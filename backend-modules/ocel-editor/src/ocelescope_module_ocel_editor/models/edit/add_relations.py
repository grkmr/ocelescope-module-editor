from abc import ABC
from typing import Annotated, ClassVar, Literal, NamedTuple

from ocelescope import OCELMapping
from ocelescope.ocel.constants import (
    ACTIVITY_COL,
    E2O_QUALIFIER,
    EID_COL,
    O2O_QUALIFIER,
    O2O_SOURCE_ID,
    O2O_TARGET_ID,
    OID_COL,
    OTYPE_COL,
)
from ocelescope.ocel.constants.tables import (
    E2O_TABLE,
    EVENTS_TABLE,
    O2O_TABLE,
    OBJECTS_TABLE,
)
from ocelescope.ocel.view import Step
from ocelescope.util.sql import ident, literal
from pydantic import Field

from ocelescope_module_ocel_editor.models.base import BaseResponse
from ocelescope_module_ocel_editor.models.edit.base import (
    EditorActionBase,
    Resources,
)
from ocelescope_module_ocel_editor.models.edit.selection import (
    Selection,
    selection_condition,
)


class MappingRelations(BaseResponse):
    """The relations an ``OCELMapping`` lists."""

    kind: Literal["mapping"]
    mapping_id: str


class RelationPairs(BaseResponse):
    """A relation from every selected source to every selected target."""

    kind: Literal["pairs"]
    sources: Selection
    targets: Selection


Relations = Annotated[MappingRelations | RelationPairs, Field(discriminator="kind")]


class _Entities(NamedTuple):
    """A table of entities a relation points at."""

    table: str
    id_column: str
    type_column: str


_EVENTS = _Entities(EVENTS_TABLE, EID_COL, ACTIVITY_COL)
_OBJECTS = _Entities(OBJECTS_TABLE, OID_COL, OTYPE_COL)


class _AddRelations(EditorActionBase, ABC):
    """Add relations to the log, leaving out those it already has.

    A relation is the same when its source, target and qualifier are. Only
    relations between entities still in the log at this step are added, and none
    from an entity to itself.
    """

    table: ClassVar[str]
    qualifier_column: ClassVar[str]
    source_column: ClassVar[str]
    target_column: ClassVar[str]
    source_entities: ClassVar[_Entities]
    target_entities: ClassVar[_Entities] = _OBJECTS

    relations: Relations
    qualifier: str = Field(min_length=1)
    """The qualifier of the new relations; a mapping's own take precedence over it."""

    def _candidates(self, step: Step, resources: Resources) -> str:
        """The relations to add, under the columns of the table."""
        source, target = ident(self.source_column), ident(self.target_column)
        qualifier = ident(self.qualifier_column)

        if isinstance(self.relations, MappingRelations):
            mapping = resources.table(
                step, self.relations.mapping_id, OCELMapping, self.table
            )
            return (
                f"SELECT {source}, {target}, "
                f"COALESCE({qualifier}, {literal(self.qualifier)}) AS {qualifier} "
                f"FROM {mapping}"
            )

        sources = self._selected(
            step, resources, self.relations.sources, self.source_entities
        )
        targets = self._selected(
            step, resources, self.relations.targets, self.target_entities
        )
        return (
            f"SELECT s.id AS {source}, t.id AS {target}, "
            f"{literal(self.qualifier)} AS {qualifier} "
            f"FROM ({sources}) s CROSS JOIN ({targets}) t"
        )

    @staticmethod
    def _selected(
        step: Step, resources: Resources, selection: Selection, entities: _Entities
    ) -> str:
        condition = selection_condition(
            step,
            resources,
            selection,
            entities.table,
            entities.id_column,
            entities.type_column,
        )
        return (
            f"SELECT {ident(entities.id_column)} AS id "
            f"FROM {step[entities.table]} WHERE {condition}"
        )

    def build(self, step: Step, resources: Resources) -> None:
        source, target = ident(self.source_column), ident(self.target_column)
        qualifier = ident(self.qualifier_column)
        source_id = ident(self.source_entities.id_column)
        target_id = ident(self.target_entities.id_column)

        # An event and an object may share an id; only an object can loop.
        self_loops = f"c.{source} <> c.{target}" if self.table == O2O_TABLE else "TRUE"

        added = step.materialize(
            f"added_{self.table}",
            f"""
            SELECT DISTINCT c.{source}, c.{target}, c.{qualifier}
            FROM ({self._candidates(step, resources)}) c
            WHERE {self_loops}
            AND c.{source} IN (
                SELECT {source_id} FROM {step[self.source_entities.table]}
            )
            AND c.{target} IN (
                SELECT {target_id} FROM {step[self.target_entities.table]}
            )
            AND NOT EXISTS (
                SELECT 1 FROM {step[self.table]} r
                WHERE r.{source} = c.{source}
                AND r.{target} = c.{target}
                AND r.{qualifier} IS NOT DISTINCT FROM c.{qualifier}
            )
            """,
        )
        step[self.table] = f"FROM {step[self.table]} UNION ALL BY NAME FROM {added}"


class AddE2O(_AddRelations):
    type: Literal["add-e2o"]

    table = E2O_TABLE
    qualifier_column = E2O_QUALIFIER
    source_column = EID_COL
    target_column = OID_COL
    source_entities = _EVENTS


class AddO2O(_AddRelations):
    type: Literal["add-o2o"]

    table = O2O_TABLE
    qualifier_column = O2O_QUALIFIER
    source_column = O2O_SOURCE_ID
    target_column = O2O_TARGET_ID
    source_entities = _OBJECTS
