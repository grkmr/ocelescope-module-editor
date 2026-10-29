import json
import time
from typing import Annotated

from fastapi import APIRouter, Body, Query
from ocelescope_backend.app.dependencies import ApiOcel, ApiSession
from ocelescope_backend.app.internal.model.ocel import SessionOCEL
from ocelescope_backend.app.internal.model.view import SessionView
from ocelescope_backend.app.internal.session import Session
from ocelescope_backend.app.sse_manager import SystemNotification, sse_manager

from ocelescope_module_ocel_editor.models import (
    Edit,
    EditorAction,
    EntityType,
    Resources,
    info,
)

router = APIRouter()

EDITOR_SOURCE = "OcelEditorV1"
DEFAULT_VIEW_NAME = "Edited"


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
    with Resources(session) as resources:
        return handle.create_view(
            [Edit(step, resources) for step in pipeline],
            EDITOR_SOURCE,
            pipeline_key(pipeline),
            name=name,
            temporary=temporary,
        )


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


def editor_view(handle: SessionOCEL) -> SessionView | None:
    """The OCEL's active view, when the editor made it."""
    view = handle.active_view
    return view if view is not None and view.source == EDITOR_SOURCE else None


@router.get("/{ocel_id}/edit", operation_id="getActiveEdit")
def get_active_edit(ocel_id: str, session: ApiSession) -> str | None:
    """The id of the OCEL's active view, when the editor made it.

    The pipeline itself lives in the browser, next to the id it was applied as.
    """
    view = editor_view(session.get_ocel(ocel_id))
    return None if view is None else view.id


@router.post("/{ocel_id}/edit", operation_id="setEdit")
def set_edit(
    ocel_id: str,
    pipeline: list[EditorAction],
    session: ApiSession,
) -> str | None:
    """Make the log as ``pipeline`` leaves it the OCEL's active view."""
    handle = session.get_ocel(ocel_id)
    started_at = time.perf_counter()

    previous = editor_view(handle)
    view_id = None
    if pipeline:
        view_id = create_editor_view(handle, session, pipeline, DEFAULT_VIEW_NAME).id
        handle.prepare_view(view_id)
    handle.set_active_view(view_id)
    if previous is not None and previous.id != view_id:
        handle.delete_view(previous.id)

    duration = time.perf_counter() - started_at
    sse_manager.send_safe(
        session.id,
        SystemNotification(
            title=f"Successfully edited {handle.name}",
            message=f"Applied {len(pipeline)} edits in {duration:.3f}s",
            notification_type="info",
        ),
    )
    return view_id


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


@router.get("/{ocel_id}/attributes", operation_id="attributes")
def attributes(
    ocel: ApiOcel,
    entity_type: EntityType,
    types: list[str] = Query(default=[]),
) -> list[str]:
    return info.attributes(ocel, entity_type, types)
