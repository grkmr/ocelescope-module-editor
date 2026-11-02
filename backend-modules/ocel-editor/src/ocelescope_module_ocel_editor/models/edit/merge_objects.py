from typing import Annotated, Literal, Self

from ocelescope.ocel.constants import (
    E2O_QUALIFIER,
    EID_COL,
    O2O_QUALIFIER,
    O2O_SOURCE_ID,
    O2O_TARGET_ID,
    OBJECT_CHANGED_FIELD,
    OID_COL,
    OTYPE_COL,
    TIMESTAMP_COL,
)
from ocelescope.ocel.constants.quantity import (
    QUANTITIES_TABLE,
    QUANTITY_OPERATIONS_TABLE,
)
from ocelescope.ocel.constants.tables import (
    E2O_TABLE,
    O2O_TABLE,
    OBJECT_CHANGES_TABLE,
    OBJECTS_TABLE,
)
from ocelescope.ocel.view import Step
from ocelescope.util.sql import ident, in_list, literal
from pydantic import Field, model_validator

from ocelescope_module_ocel_editor.models.base import BaseResponse
from ocelescope_module_ocel_editor.models.edit.base import (
    EditorActionBase,
    Resources,
)
from ocelescope_module_ocel_editor.models.edit.selection import (
    Selection,
    selection_condition,
)


class ObjectMerge(BaseResponse):
    """The selected objects, as one new object.

    ``new_id`` must not be in the log; ``object_type`` may be. The new object
    takes each attribute of ``copy_from``, if given, once: at its first or last
    value, as ``copy_at`` says, under the timestamp of that value.
    """

    new_id: str = Field(min_length=1)
    object_type: str = Field(min_length=1)
    objects: Selection
    copy_from: str | None = None
    copy_at: Literal["start", "end"] = "start"


class KeepQualifiers(BaseResponse):
    """One relation per qualifier the merged objects had to the event."""

    kind: Literal["keep"]


class FixedQualifier(BaseResponse):
    """One relation to each event, under ``name``."""

    kind: Literal["fixed"]
    name: str = Field(min_length=1)


MergedQualifier = Annotated[
    KeepQualifiers | FixedQualifier, Field(discriminator="kind")
]


class MergeObjects(EditorActionBase):
    """Replace sets of objects by one new object each.

    A new object is related to every event any object of its set is. An object
    may be in several sets; every object in one is gone afterwards. Their O2O
    relations move to the new objects or are dropped, as ``object_relations`` says; a moved
    relation between two objects that merged into one is dropped either way.
    """

    type: Literal["merge-objects"]
    merges: list[ObjectMerge] = Field(min_length=1)
    qualifier: MergedQualifier
    object_relations: Literal["move", "drop"]

    @model_validator(mode="after")
    def _new_ids_differ(self) -> Self:
        ids = [merge.new_id for merge in self.merges]
        if len(ids) != len(set(ids)):
            raise ValueError("Each merge needs a new id of its own")
        return self

    def build(self, step: Step, resources: Resources) -> None:
        self._check_ids(step)
        members = self._members(step, resources)
        self._merge_e2o(step, members)
        self._merge_o2o(step, members)
        self._merge_changes(step, members)
        self._merge_objects(step, members)
        self._drop_quantities(step, members)

    def _check_ids(self, step: Step) -> None:
        oid = ident(OID_COL)
        new_ids = [merge.new_id for merge in self.merges]
        taken = step.sql(
            f"SELECT {oid} FROM {step[OBJECTS_TABLE]} "
            f"WHERE {in_list(oid, new_ids)} ORDER BY 1"
        ).fetchall()
        if taken:
            listed = ", ".join(id for (id,) in taken)
            raise ValueError(f"These new ids are already in the log: {listed}")

        copied = {merge.copy_from for merge in self.merges if merge.copy_from}
        if copied:
            found = step.sql(
                f"SELECT {oid} FROM {step[OBJECTS_TABLE]} "
                f"WHERE {in_list(oid, sorted(copied))}"
            ).fetchall()
            missing = copied - {id for (id,) in found}
            if missing:
                listed = ", ".join(sorted(missing))
                raise ValueError(f"These objects to copy from are gone: {listed}")

    def _members(self, step: Step, resources: Resources) -> str:
        """Store which objects go into which new id, under ``new_id`` and the oid."""
        oid = ident(OID_COL)
        sets = [
            f"SELECT {literal(merge.new_id)} AS new_id, {oid} "
            f"FROM {step[OBJECTS_TABLE]} WHERE "
            + selection_condition(
                step, resources, merge.objects, OBJECTS_TABLE, OID_COL, OTYPE_COL
            )
            for merge in self.merges
        ]
        members = step.materialize("merge_members", " UNION ALL ".join(sets))
        found = {
            new_id
            for (new_id,) in step.sql(
                f"SELECT DISTINCT new_id FROM {members}"
            ).fetchall()
        }
        empty = sorted({merge.new_id for merge in self.merges} - found)
        if empty:
            raise ValueError(f"These merges select no objects: {', '.join(empty)}")
        return members

    def _merge_e2o(self, step: Step, members: str) -> None:
        eid, oid = ident(EID_COL), ident(OID_COL)
        qualifier = ident(E2O_QUALIFIER)
        merged_qualifier = (
            f"r.{qualifier}"
            if isinstance(self.qualifier, KeepQualifiers)
            else literal(self.qualifier.name)
        )
        added = step.materialize(
            "merged_e2o",
            f"""
            SELECT DISTINCT r.{eid}, m.new_id AS {oid}, {merged_qualifier} AS {qualifier}
            FROM {step[E2O_TABLE]} r
            JOIN {members} m USING ({oid})
            """,
        )
        step[E2O_TABLE] = f"""
            SELECT * FROM {step[E2O_TABLE]}
            WHERE {oid} NOT IN (SELECT {oid} FROM {members})
            UNION ALL BY NAME FROM {added}
        """

    def _merge_o2o(self, step: Step, members: str) -> None:
        oid = ident(OID_COL)
        source, target = ident(O2O_SOURCE_ID), ident(O2O_TARGET_ID)
        qualifier = ident(O2O_QUALIFIER)
        kept = f"""
            SELECT * FROM {step[O2O_TABLE]}
            WHERE {source} NOT IN (SELECT {oid} FROM {members})
            AND {target} NOT IN (SELECT {oid} FROM {members})
        """
        if self.object_relations == "drop":
            step[O2O_TABLE] = kept
            return

        moved = step.materialize(
            "merged_o2o",
            f"""
            SELECT DISTINCT
                COALESCE(s.new_id, r.{source}) AS {source},
                COALESCE(t.new_id, r.{target}) AS {target},
                r.{qualifier}
            FROM {step[O2O_TABLE]} r
            LEFT JOIN {members} s ON r.{source} = s.{oid}
            LEFT JOIN {members} t ON r.{target} = t.{oid}
            WHERE (s.new_id IS NOT NULL OR t.new_id IS NOT NULL)
            AND COALESCE(s.new_id, r.{source}) <> COALESCE(t.new_id, r.{target})
            """,
        )
        step[O2O_TABLE] = f"{kept} UNION ALL BY NAME FROM {moved}"

    def _merge_changes(self, step: Step, members: str) -> None:
        oid = ident(OID_COL)
        kept = f"""
            SELECT * FROM {step[OBJECT_CHANGES_TABLE]}
            WHERE {oid} NOT IN (SELECT {oid} FROM {members})
        """
        copies = [
            self._copied_values(step, merge, merge.copy_from)
            for merge in self.merges
            if merge.copy_from
        ]
        if not copies:
            step[OBJECT_CHANGES_TABLE] = kept
            return

        copied = step.materialize("merged_changes", " UNION ALL ".join(copies))
        step[OBJECT_CHANGES_TABLE] = f"{kept} UNION ALL BY NAME FROM {copied}"

    @staticmethod
    def _copied_values(step: Step, merge: ObjectMerge, copy_from: str) -> str:
        """Each attribute of ``copy_from`` once, at the value ``copy_at`` picks."""
        oid, timestamp = ident(OID_COL), ident(TIMESTAMP_COL)
        return f"""
            SELECT * REPLACE ({literal(merge.new_id)} AS {oid})
            FROM {step[OBJECT_CHANGES_TABLE]}
            WHERE {oid} = {literal(copy_from)}
            QUALIFY row_number() OVER (
                PARTITION BY {ident(OBJECT_CHANGED_FIELD)}
                ORDER BY {timestamp} {"ASC" if merge.copy_at == "start" else "DESC"}
            ) = 1
        """

    def _merge_objects(self, step: Step, members: str) -> None:
        oid, otype = ident(OID_COL), ident(OTYPE_COL)
        new_objects = " UNION ALL ".join(
            f"SELECT {literal(merge.new_id)} AS {oid}, "
            f"{literal(merge.object_type)} AS {otype}"
            for merge in self.merges
        )
        step[OBJECTS_TABLE] = f"""
            SELECT * FROM {step[OBJECTS_TABLE]}
            WHERE {oid} NOT IN (SELECT {oid} FROM {members})
            UNION ALL BY NAME {new_objects}
        """

    @staticmethod
    def _drop_quantities(step: Step, members: str) -> None:
        oid = ident(OID_COL)
        for table in (QUANTITIES_TABLE, QUANTITY_OPERATIONS_TABLE):
            if table in step.tables:
                step[table] = (
                    f"SELECT * FROM {step[table]} "
                    f"WHERE {oid} NOT IN (SELECT {oid} FROM {members})"
                )
