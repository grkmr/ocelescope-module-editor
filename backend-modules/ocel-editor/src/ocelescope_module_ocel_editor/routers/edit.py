"""The pipeline as views: previews, and saving the result as an OCEL."""

import json
from typing import Annotated

from fastapi import APIRouter, Body, HTTPException
from ocelescope_backend.app.dependencies import ApiSession
from ocelescope_backend.app.internal.model.ocel import SessionOCEL
from ocelescope_backend.app.internal.model.view import SessionView
from ocelescope_backend.app.internal.session import Session

from ocelescope_module_ocel_editor.models import Edit, EditorAction, Resources

router = APIRouter()

EDITOR_SOURCE = "OcelEditorV1"


def pipeline_key(pipeline: list[EditorAction]) -> str:
    return json.dumps(
        [step.model_dump(mode="json") for step in pipeline], sort_keys=True
    )


def create_editor_view(
    handle: SessionOCEL,
    session: Session,
    pipeline: list[EditorAction],
    name: str,
    temporary: bool = False,
) -> SessionView:
    """The log as ``pipeline`` leaves it, as a view of ``handle``'s original log."""
    try:
        with Resources(session) as resources:
            return handle.create_view(
                [Edit(step, resources) for step in pipeline],
                EDITOR_SOURCE,
                pipeline_key(pipeline),
                name=name,
                temporary=temporary,
            )
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error


@router.post("/{ocel_id}/views", operation_id="registerView")
def register_view(
    ocel_id: str,
    session: ApiSession,
    steps: Annotated[list[EditorAction], Body()],
) -> str | None:
    if not steps:
        return None
    return create_editor_view(
        session.get_ocel(ocel_id), session, steps, "Edit preview", temporary=True
    ).id


@router.post("/{ocel_id}/save", operation_id="saveAsOcel")
def save_as_ocel(
    ocel_id: str,
    session: ApiSession,
    pipeline: Annotated[list[EditorAction], Body()],
    name: str,
) -> str:
    """Add the log as ``pipeline`` leaves it to the session as an OCEL of its own."""
    handle = session.get_ocel(ocel_id)
    if not pipeline:
        return session.add_ocel(handle.db_path, name=name)
    view = create_editor_view(handle, session, pipeline, name, temporary=True)
    view.materialize()
    return session.add_ocel(view.path, name=name)
