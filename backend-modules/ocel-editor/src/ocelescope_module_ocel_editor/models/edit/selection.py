from typing import Annotated, Literal

from ocelescope.ocel.view import Step
from ocelescope.util.sql import ident, in_list
from pydantic import Field

from ocelescope_module_ocel_editor.models.base import BaseResponse
from ocelescope_module_ocel_editor.models.edit.base import Resources
from ocelescope_module_ocel_editor.resources import OcelMask


class TypeSelection(BaseResponse):
    """Every entity of these types."""

    kind: Literal["types"]
    names: list[str] = Field(min_length=1)


class IdSelection(BaseResponse):
    """The entities with these ids."""

    kind: Literal["ids"]
    ids: list[str] = Field(min_length=1)


class MaskSelection(BaseResponse):
    """Every entity an ``OcelMask`` lists."""

    kind: Literal["mask"]
    mask_id: str


Selection = Annotated[
    TypeSelection | IdSelection | MaskSelection, Field(discriminator="kind")
]


def selection_condition(
    step: Step,
    resources: Resources,
    selection: TypeSelection | IdSelection | MaskSelection,
    table: str,
    key: str,
    type_column: str,
    alias: str = "",
) -> str:
    """SQL that is true for the rows of ``table`` that ``selection`` picks."""
    if isinstance(selection, TypeSelection):
        return in_list(f"{alias}{ident(type_column)}", selection.names)
    if isinstance(selection, IdSelection):
        return in_list(f"{alias}{ident(key)}", selection.ids)
    mask = resources.table(step, selection.mask_id, OcelMask, table)
    key = ident(key)
    return f"{alias}{key} IN (SELECT {key} FROM {mask} WHERE {key} IS NOT NULL)"
