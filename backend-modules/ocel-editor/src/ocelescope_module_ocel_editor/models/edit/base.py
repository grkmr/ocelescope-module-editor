from abc import ABC, abstractmethod
from contextlib import ExitStack
from typing import TYPE_CHECKING, Self

from ocelescope import TabularResource
from ocelescope.ocel.view import Step, ViewOperation

from ocelescope_module_ocel_editor.models.base import BaseResponse

if TYPE_CHECKING:
    from ocelescope_backend.app.internal.session import Session

BATCH_SIZE = 100_000


class Resources:
    """The session's resources, as the steps of one :class:`OCELView` read them.

    A table is stored in the view the first time a step reads it, so a view
    reading a resource stays valid once the resource is closed. Resources are
    opened as they are first read and closed with :meth:`close` -- after the
    view is built. One instance serves one view: the relations it hands out
    live in that view's catalog.
    """

    def __init__(self, session: "Session | None"):
        self._session = session
        self._open = ExitStack()
        self._resources: dict[str, TabularResource] = {}
        self._tables: dict[tuple[str, str], str] = {}

    def __enter__(self) -> Self:
        return self

    def __exit__(self, *_exc) -> None:
        self.close()

    def close(self) -> None:
        self._open.close()

    def table(
        self,
        step: Step,
        id: str,
        resource_class: type[TabularResource],
        table: str,
    ) -> str:
        """``table`` of the session's resource ``id``, as a relation to read from."""
        if (id, table) not in self._tables:
            if id not in self._resources:
                if self._session is None:
                    raise ValueError("Resources need a session to be loaded from")
                self._resources[id] = self._open.enter_context(
                    self._session.open_resource(id, resource_class)
                )
            self._tables[id, table] = step.load(
                f"resource_{table}",
                getattr(self._resources[id], table).to_arrow_reader(BATCH_SIZE),
            )
        return self._tables[id, table]


class EditorActionBase(BaseResponse, ABC):
    @abstractmethod
    def build(self, step: Step, resources: Resources) -> None:
        """Set, on ``step``, the tables this action changes the log by."""


class Edit(ViewOperation):
    """``action`` as a step of an :class:`OCELView`, reading ``resources``."""

    def __init__(self, action: EditorActionBase, resources: Resources):
        self.action = action
        self.resources = resources

    def build(self, step: Step) -> None:
        self.action.build(step, self.resources)
