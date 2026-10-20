from abc import ABC, abstractmethod
from collections.abc import Callable
from itertools import count

from duckdb import DuckDBPyConnection
from ocelescope import TabularResource
from ocelescope.util.sql import ident

from ocelescope_module_ocel_editor.models.base import BaseResponse

ResourceLoader = Callable[[str, type[TabularResource], str], str]
"""Loads one table of a resource into a pipeline, giving the relation to read it from."""


class ResourceTables:
    """The tables of a resource, each loaded the first time it is read."""

    def __init__(
        self, id: str, resource_class: type[TabularResource], load: ResourceLoader
    ):
        self._id = id
        self._resource_class = resource_class
        self._load = load

    def __getitem__(self, table: str) -> str:
        return self._load(self._id, self._resource_class, table)


class Step:
    """The OCEL's tables as one action of a pipeline leaves them.

    Each table is a relation the next action reads from: the stored table, or a
    view an earlier action defined over it. An action changes a table by
    defining a new view, so the log itself is never written to or copied.
    """

    def __init__(
        self,
        con: DuckDBPyConnection,
        index: int,
        tables: dict[str, str],
        load_resource: ResourceLoader,
    ):
        self._con = con
        self._index = index
        self._views = count()
        self._load_resource = load_resource
        self.tables = dict(tables)

    def __getitem__(self, table: str) -> str:
        """The relation ``table`` reads from as of this step, quoted for SQL."""
        return self.tables[table]

    def define(self, table: str, query: str) -> None:
        """Make ``query`` what ``table`` is from here on."""
        view = ident(f"step{self._index}_{next(self._views)}_{table}")
        self._con.execute(f"CREATE TEMP VIEW {view} AS {query}")
        self.tables[table] = view

    def resource(
        self, id: str, resource_class: type[TabularResource]
    ) -> ResourceTables:
        """The tables of the session's resource ``id``, as relations to read from."""
        return ResourceTables(id, resource_class, self._load_resource)


class EditorActionBase(BaseResponse, ABC):
    @abstractmethod
    def build(self, step: Step) -> None:
        """Define the views this action changes the log by on ``step``."""
