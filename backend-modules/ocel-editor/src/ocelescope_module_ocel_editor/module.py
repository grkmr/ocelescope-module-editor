from fastapi import FastAPI
from ocelescope_backend.app.modules import Module, ModuleMeta
from packaging.version import Version

from ocelescope_module_ocel_editor.resources import OcelMask
from ocelescope_module_ocel_editor.routes import router


class OcelEditor(Module):
    meta = ModuleMeta(key="ocelEditor", version=Version("1.0"))
    resources = [OcelMask]

    def create_app(self) -> FastAPI:
        app = FastAPI(title="Ocel Editor", version=str(self.meta.version))
        app.include_router(router)
        return app
