"""The editor's router, assembled from the per-concern sub-routers.

``masks`` is included first so its static ``/masks`` is matched before the
``/{ocel_id}`` paths.
"""

from fastapi import APIRouter

from ocelescope_module_ocel_editor.routers import edit, info, masks

router = APIRouter()
router.include_router(masks.router)
router.include_router(edit.router)
router.include_router(info.router)

__all__ = ["router"]
