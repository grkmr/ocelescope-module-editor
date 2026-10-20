from typing import Annotated, Literal, Self

from ocelescope.ocel.constants import (
    ACTIVITY_COL,
    EID_COL,
    O2O_SOURCE_ID,
    O2O_TARGET_ID,
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
    EVENTS_TABLE,
    O2O_TABLE,
    OBJECT_CHANGES_TABLE,
    OBJECTS_TABLE,
)
from ocelescope.util.sql import ident, in_list, literal
from pydantic import Field, model_validator

from ocelescope_module_ocel_editor.models.base import BaseResponse
from ocelescope_module_ocel_editor.models.edit.base import (
    EditorActionBase,
    Step,
)
from ocelescope_module_ocel_editor.resources import OcelMask


class TypeSelection(BaseResponse):
    """Every entity of these types."""

    kind: Literal["types"]
    names: list[str] = Field(min_length=1)


class MaskSelection(BaseResponse):
    """Every entity an ``OcelMask`` lists."""

    kind: Literal["mask"]
    mask_id: str


Selection = Annotated[TypeSelection | MaskSelection, Field(discriminator="kind")]


def selection_condition(
    step: Step,
    selection: TypeSelection | MaskSelection,
    table: str,
    key: str,
    type_column: str,
    alias: str = "",
) -> str:
    """SQL that is true for the rows of ``table`` that ``selection`` picks."""
    if isinstance(selection, TypeSelection):
        return in_list(f"{alias}{ident(type_column)}", selection.names)
    mask = step.resource(selection.mask_id, OcelMask)[table]
    key = ident(key)
    return f"{alias}{key} IN (SELECT {key} FROM {mask} WHERE {key} IS NOT NULL)"


class StaticTypeName(BaseResponse):
    """Every selected type gets ``name``, so several selected types merge into one."""

    kind: Literal["static"]
    name: str


class AttributeTypeName(BaseResponse):
    """Each entity is typed by its value of ``attribute``.

    An entity without a value keeps its type, is dropped, or gets
    ``fallback_name``, as ``missing`` says.
    An object's attribute can change over time; its latest value is the one used.
    """

    kind: Literal["attribute"]
    attribute: str
    missing: Literal["keep", "drop", "fallback"] = "keep"
    fallback_name: str | None = None

    @model_validator(mode="after")
    def _fallback_has_name(self) -> Self:
        if self.missing == "fallback" and not self.fallback_name:
            raise ValueError("A fallback needs a name")
        return self

    def renamed(self, selected: str, value: str, current: str) -> str:
        """SQL for the new type of a row, given its ``value`` of the attribute."""
        fallback = (
            literal(self.fallback_name)
            if self.missing == "fallback" and self.fallback_name
            else current
        )
        return f"""
            CASE WHEN {selected} AND {value} IS NOT NULL THEN {value}
            WHEN {selected} THEN {fallback}
            ELSE {current} END
        """


NewTypeName = Annotated[StaticTypeName | AttributeTypeName, Field(discriminator="kind")]


def rename_static(
    step: Step, table: str, column: str, selected: str, new_name: StaticTypeName
) -> None:
    """Set ``column`` of ``table`` to the static name where ``selected`` holds."""
    column = ident(column)

    step.define(
        table,
        f"""
        SELECT * REPLACE (
            CASE WHEN {selected}
            THEN {literal(new_name.name)} ELSE {column} END AS {column}
        )
        FROM {step[table]}
    """,
    )


class ObjectTypeRename(EditorActionBase):
    type: Literal["rename-object-type"]
    selection: Selection
    new_name: NewTypeName

    def build(self, step: Step) -> None:
        if isinstance(self.new_name, StaticTypeName):
            selected = selection_condition(
                step, self.selection, OBJECTS_TABLE, OID_COL, OTYPE_COL
            )
            rename_static(step, OBJECTS_TABLE, OTYPE_COL, selected, self.new_name)
        else:
            self._rename_by_attribute(step, self.new_name)

    def _rename_by_attribute(self, step: Step, new_name: AttributeTypeName) -> None:
        oid, otype = ident(OID_COL), ident(OTYPE_COL)
        attribute = ident(new_name.attribute)
        selected = selection_condition(
            step, self.selection, OBJECTS_TABLE, OID_COL, OTYPE_COL, alias="o."
        )
        drop = new_name.missing == "drop"

        step.define(
            OBJECTS_TABLE,
            f"""
            SELECT o.* REPLACE (
                {new_name.renamed(selected, "latest.value", f"o.{otype}")} AS {otype}
            )
            FROM {step[OBJECTS_TABLE]} o
            LEFT JOIN (
                SELECT
                    {oid},
                    CAST(arg_max({attribute}, {ident(TIMESTAMP_COL)}) AS VARCHAR) AS value
                FROM {step[OBJECT_CHANGES_TABLE]}
                WHERE {attribute} IS NOT NULL
                GROUP BY {oid}
            ) latest USING ({oid})
            {f"WHERE NOT ({selected} AND latest.value IS NULL)" if drop else ""}
        """,
        )

        if drop:
            self._drop_dangling(step)

    @staticmethod
    def _drop_dangling(step: Step) -> None:
        """Drop what belongs to objects no longer in the objects table."""
        kept = f"(SELECT {ident(OID_COL)} FROM {step[OBJECTS_TABLE]})"
        for table, columns in (
            (E2O_TABLE, [OID_COL]),
            (O2O_TABLE, [O2O_SOURCE_ID, O2O_TARGET_ID]),
            (OBJECT_CHANGES_TABLE, [OID_COL]),
            (QUANTITIES_TABLE, [OID_COL]),
            (QUANTITY_OPERATIONS_TABLE, [OID_COL]),
        ):
            step.define(
                table,
                f"SELECT * FROM {step[table]} WHERE "
                + " AND ".join(f"{ident(column)} IN {kept}" for column in columns),
            )


class ActivityRename(EditorActionBase):
    type: Literal["rename-activity"]
    selection: Selection
    new_name: NewTypeName

    def build(self, step: Step) -> None:
        if isinstance(self.new_name, StaticTypeName):
            selected = selection_condition(
                step, self.selection, EVENTS_TABLE, EID_COL, ACTIVITY_COL
            )
            rename_static(step, EVENTS_TABLE, ACTIVITY_COL, selected, self.new_name)
        else:
            self._rename_by_attribute(step, self.new_name)

    def _rename_by_attribute(self, step: Step, new_name: AttributeTypeName) -> None:
        activity = ident(ACTIVITY_COL)
        attribute = ident(new_name.attribute)
        selected = selection_condition(
            step, self.selection, EVENTS_TABLE, EID_COL, ACTIVITY_COL
        )
        value = f"CAST({attribute} AS VARCHAR)"
        drop = new_name.missing == "drop"

        step.define(
            EVENTS_TABLE,
            f"""
            SELECT * REPLACE ({new_name.renamed(selected, value, activity)} AS {activity})
            FROM {step[EVENTS_TABLE]}
            {f"WHERE NOT ({selected} AND {attribute} IS NULL)" if drop else ""}
        """,
        )

        if drop:
            self._drop_dangling(step)

    @staticmethod
    def _drop_dangling(step: Step) -> None:
        """Drop what belongs to events no longer in the events table."""
        eid = ident(EID_COL)
        for table in (E2O_TABLE, QUANTITY_OPERATIONS_TABLE):
            step.define(
                table,
                f"SELECT * FROM {step[table]} "
                f"WHERE {eid} IN (SELECT {eid} FROM {step[EVENTS_TABLE]})",
            )
