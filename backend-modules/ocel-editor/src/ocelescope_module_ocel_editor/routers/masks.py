"""Masks made from files."""

from pathlib import Path
from tempfile import TemporaryDirectory
from typing import Annotated

from fastapi import APIRouter, File, HTTPException, UploadFile
from ocelescope_backend.app.dependencies import ApiSession

from ocelescope_module_ocel_editor.resources import OcelMask

router = APIRouter()


@router.post("/masks", operation_id="uploadMask")
def upload_mask(
    session: ApiSession,
    file: Annotated[UploadFile, File()],
) -> str:
    """Add the CSV ``file`` to the session as an :class:`OcelMask`, giving its id."""
    name = Path(file.filename or "mask.csv").stem
    with TemporaryDirectory() as directory:
        path = Path(directory) / "mask.csv"
        path.write_bytes(file.file.read())
        try:
            mask = OcelMask.from_csv(path)
        except ValueError as error:
            raise HTTPException(status_code=422, detail=str(error)) from error
    return session.add_resource(mask, name=name)
