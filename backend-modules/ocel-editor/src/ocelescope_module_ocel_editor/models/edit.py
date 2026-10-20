from abc import ABC, abstractmethod
from collections.abc import Sequence
from copy import deepcopy
from typing import Annotated, Literal, TypeAlias

from duckdb import DuckDBPyConnection
from ocelescope import OCEL
from ocelescope.ocel.constants import ACTIVITY_COL, OBJECT_CHANGED_FIELD, OTYPE_COL
from ocelescope.ocel.constants.tables import (
    EVENTS_TABLE,
    OBJECT_CHANGES_TABLE,
    OBJECTS_TABLE,
)
from ocelescope.util.sql import ident
from pydantic import Field

from ocelescope_module_ocel_editor.models.base import BaseResponse


class EditorActionBase(BaseResponse, ABC):
    @abstractmethod
    def apply(self, con: DuckDBPyConnection): ...


class AttributeRename(EditorActionBase):
    type: Literal["rename-attribute"]
    entity_type: Literal["object", "event"] | None = None
    current_attribute_name: str
    new_attribute_name: str

    def apply(self, con: DuckDBPyConnection):
        table_name = (
            ident(OBJECT_CHANGES_TABLE)
            if self.entity_type == "object"
            else ident(EVENTS_TABLE)
        )

        con.execute(
            f"""
            ALTER TABLE {table_name}
            RENAME COLUMN {ident(self.current_attribute_name)}
            TO {ident(self.new_attribute_name)};
        """
        )

        if self.entity_type == "object":
            con.execute(
                f"""
                UPDATE {table_name}
                SET {ident(OBJECT_CHANGED_FIELD)} = ?
                WHERE {ident(OBJECT_CHANGED_FIELD)} = ?;
            """,
                [self.new_attribute_name, self.current_attribute_name],
            )


class TypeRename(EditorActionBase):
    type: Literal["rename-type"]
    entity_type: Literal["object", "event"]
    entity_name: str
    new_entity_name: str

    def apply(self, con: DuckDBPyConnection):
        table, column = (
            (OBJECTS_TABLE, OTYPE_COL)
            if self.entity_type == "object"
            else (EVENTS_TABLE, ACTIVITY_COL)
        )

        con.execute(
            f"""
            UPDATE {ident(table)}
            SET {ident(column)} = ?
            WHERE {ident(column)} = ?;
        """,
            [self.new_entity_name, self.entity_name],
        )


EditorAction: TypeAlias = Annotated[
    AttributeRename | TypeRename, Field(discriminator="type")
]


def apply_actions(ocel: OCEL, actions: Sequence[EditorActionBase]) -> OCEL:
    """Apply ``actions`` in order to a copy of ``ocel``, leaving ``ocel`` untouched."""
    edited = deepcopy(ocel)
    try:
        for action in actions:
            action.apply(edited.con)
    except Exception:
        edited.close()
        raise
    return edited
