from pathlib import Path
from tempfile import TemporaryDirectory

from fastapi import APIRouter, Query
from ocelescope import OCEL
from ocelescope_backend.app.dependencies import ApiOcel, ApiSession

from ocelescope_module_ocel_editor.models import EditorAction, EntityType, Pipeline

router = APIRouter()


@router.post("/{ocel_id}", operation_id="edit")
def edit(
    ocel: ApiOcel, session: ApiSession, actions: list[EditorAction], name: str
) -> str:
    with (
        Pipeline(ocel, actions, session) as pipeline,
        TemporaryDirectory() as directory,
    ):
        path = Path(directory) / "edited.duckdb"
        pipeline.write(path)
        with OCEL.read_duckdb(path) as edited:
            return session.add_ocel(edited, name=name)


@router.post("/{ocel_id}/types", operation_id="types")
def types(
    ocel: ApiOcel,
    session: ApiSession,
    actions: list[EditorAction],
    entity_type: EntityType,
) -> dict[str, int]:
    with Pipeline(ocel, actions, session) as pipeline:
        return pipeline.types(entity_type)


@router.post("/{ocel_id}/attributes", operation_id="attributes")
def attributes(
    ocel: ApiOcel,
    session: ApiSession,
    actions: list[EditorAction],
    entity_type: EntityType,
    types: list[str] = Query(default=[]),
) -> list[str]:
    with Pipeline(ocel, actions, session) as pipeline:
        return pipeline.attributes(entity_type, types)
