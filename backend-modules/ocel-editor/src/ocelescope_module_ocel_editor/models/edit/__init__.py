from typing import Annotated, TypeAlias

from pydantic import Field

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
    ObjectTypeRename | ActivityRename, Field(discriminator="type")
]

__all__ = [
    "ActivityRename",
    "Edit",
    "EditorAction",
    "EditorActionBase",
    "ObjectTypeRename",
    "Resources",
]
