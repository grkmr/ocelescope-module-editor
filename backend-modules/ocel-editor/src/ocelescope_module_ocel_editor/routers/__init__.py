"""The editor's router, assembled from the per-concern sub-routers.

``mappings`` is included first so its static ``/mappings`` is matched before the
``/{ocel_id}`` paths.
"""

from fastapi import APIRouter

from ocelescope_module_ocel_editor.routers import edit, info, mappings

router = APIRouter()
router.include_router(mappings.router)
router.include_router(edit.router)
router.include_router(info.router)

__all__ = ["router"]
