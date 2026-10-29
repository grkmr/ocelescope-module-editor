"""What the editor's inputs offer, read from the log or one of its views."""

from fastapi import APIRouter, Query
from ocelescope_backend.app.dependencies import ApiOcel

from ocelescope_module_ocel_editor.models import EntityType, info

router = APIRouter()


@router.get("/{ocel_id}/attributes", operation_id="attributes")
def attributes(
    ocel: ApiOcel,
    entity_type: EntityType,
    types: list[str] = Query(default=[]),
) -> list[str]:
    return info.attributes(ocel, entity_type, types)
