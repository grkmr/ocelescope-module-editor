from fastapi import APIRouter
from ocelescope_backend.app.dependencies import ApiOcel, ApiSession

from ocelescope_module_ocel_editor.models import EditorAction, apply_actions

router = APIRouter()


@router.post("/{ocel_id}", operation_id="edit")
def edit(
    ocel: ApiOcel, session: ApiSession, actions: list[EditorAction], name: str
) -> str:
    with apply_actions(ocel, actions) as edited:
        return session.add_ocel(edited, name=name)
