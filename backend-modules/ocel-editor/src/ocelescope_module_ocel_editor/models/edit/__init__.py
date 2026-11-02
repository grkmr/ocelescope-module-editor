from typing import Annotated, TypeAlias

from pydantic import Field

from ocelescope_module_ocel_editor.models.edit.add_relations import AddE2O, AddO2O
from ocelescope_module_ocel_editor.models.edit.base import (
    Edit,
    EditorActionBase,
    Resources,
)
from ocelescope_module_ocel_editor.models.edit.type_rename import (
    ActivityRename,
    ObjectTypeRename,
)

EditorAction: TypeAlias = Annotated[
    ObjectTypeRename | ActivityRename | AddE2O | AddO2O,
    Field(discriminator="type"),
]

__all__ = [
    "ActivityRename",
    "AddE2O",
    "AddO2O",
    "Edit",
    "EditorAction",
    "EditorActionBase",
    "ObjectTypeRename",
    "Resources",
]
