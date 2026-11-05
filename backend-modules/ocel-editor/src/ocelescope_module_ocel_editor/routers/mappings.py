"""OCEL mappings made from files."""

from pathlib import Path
from tempfile import TemporaryDirectory
from typing import Annotated

from fastapi import APIRouter, File, HTTPException, UploadFile
from ocelescope import OCELMapping
from ocelescope_backend.app.dependencies import ApiSession

router = APIRouter()


@router.post("/mappings", operation_id="uploadMapping")
def upload_mapping(
    session: ApiSession,
    file: Annotated[UploadFile, File()],
) -> str:
    """Add the CSV ``file`` to the session as an :class:`OCELMapping`, giving its id."""
    name = Path(file.filename or "mapping.csv").stem
    with TemporaryDirectory() as directory:
        path = Path(directory) / "mapping.csv"
        path.write_bytes(file.file.read())
        try:
            mapping = OCELMapping.from_csv(path)
        except ValueError as error:
            raise HTTPException(status_code=422, detail=str(error)) from error
    return session.add_resource(mapping, name=name)
