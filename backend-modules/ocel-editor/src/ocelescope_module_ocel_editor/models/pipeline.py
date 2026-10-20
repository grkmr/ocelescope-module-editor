from collections.abc import Sequence
from contextlib import ExitStack
from pathlib import Path
from typing import TYPE_CHECKING, Literal, Self

import duckdb
from ocelescope import OCEL, TabularResource
from ocelescope.ocel.constants import (
    ACTIVITY_COL,
    EID_COL,
    OBJECT_CHANGED_FIELD,
    OID_COL,
    OTYPE_COL,
    TIMESTAMP_COL,
)
from ocelescope.ocel.constants.tables import (
    EVENTS_TABLE,
    OBJECT_CHANGES_TABLE,
    OBJECTS_TABLE,
)
from ocelescope.util.sql import ident, in_list, set_utc

from ocelescope_module_ocel_editor.models.edit import EditorActionBase
from ocelescope_module_ocel_editor.models.edit.base import Step

if TYPE_CHECKING:
    from ocelescope_backend.app.internal.session import Session

EntityType = Literal["object", "event"]

BATCH_SIZE = 100_000


class Pipeline:
    """``actions`` run on ``ocel`` as views, one step stacked on the next.

    Nothing is copied or written: each action defines views over the tables the
    one before it left, and a query only computes what it asks for. The views
    live on a cursor of their own, which is what keeps them apart from other
    requests on the same log.
    """

    def __init__(
        self,
        ocel: OCEL,
        actions: Sequence[EditorActionBase],
        session: "Session | None" = None,
    ):
        self._con = ocel.con.cursor()
        set_utc(self._con)
        self._session = session
        # Resources stay open for the pipeline, so each table loads without reopening
        self._open_resources = ExitStack()
        self._resources: dict[str, TabularResource] = {}
        self._resource_tables: dict[tuple[str, str], str] = {}

        try:
            tables = {
                name: ident(name)
                for (name,) in self._con.execute(
                    "SELECT table_name FROM information_schema.tables "
                    "WHERE table_schema = 'main' AND table_type = 'BASE TABLE'"
                ).fetchall()
            }
            for index, action in enumerate(actions):
                step = Step(self._con, index, tables, self._load_resource)
                action.build(step)
                tables = step.tables
            self._tables = tables
        except Exception:
            self.close()
            raise

    def __enter__(self) -> Self:
        return self

    def __exit__(self, *_exc) -> None:
        self.close()

    def close(self) -> None:
        self._open_resources.close()
        self._con.close()

    def _load_resource(
        self, id: str, resource_class: type[TabularResource], table: str
    ) -> str:
        """Copy ``table`` of the session's resource ``id`` into a temp table, once.

        Only the tables a step reads are copied. Copied rather than ATTACHed:
        DuckDB won't attach one file to two logs at once, and two requests may
        well use the same resource.
        """
        if (id, table) not in self._resource_tables:
            if id not in self._resources:
                if self._session is None:
                    raise ValueError("Resources need a session to be loaded from")
                self._resources[id] = self._open_resources.enter_context(
                    self._session.open_resource(id, resource_class)
                )

            temp = ident(f"resource{len(self._resource_tables)}_{table}")
            self._con.register(
                "resource_batches",
                getattr(self._resources[id], table).fetch_record_batch(BATCH_SIZE),
            )
            try:
                self._con.execute(f"CREATE TEMP TABLE {temp} AS FROM resource_batches")
            finally:
                self._con.unregister("resource_batches")
            self._resource_tables[id, table] = temp

        return self._resource_tables[id, table]

    def types(self, entity_type: EntityType) -> dict[str, int]:
        """The object types or activities left at the end, each with its count."""
        table, column = (
            (OBJECTS_TABLE, OTYPE_COL)
            if entity_type == "object"
            else (EVENTS_TABLE, ACTIVITY_COL)
        )
        return dict(
            self._con.execute(
                f"SELECT {ident(column)}, count(*) FROM {self._tables[table]} GROUP BY 1"
            ).fetchall()
        )

    def attributes(self, entity_type: EntityType, types: list[str]) -> list[str]:
        """The attributes entities of ``types`` carry, or any entity when empty."""
        if entity_type == "object":
            otype = ident(OTYPE_COL)
            return [
                attribute
                for (attribute,) in self._con.execute(f"""
                    SELECT DISTINCT c.{ident(OBJECT_CHANGED_FIELD)}
                    FROM {self._tables[OBJECT_CHANGES_TABLE]} c
                    JOIN {self._tables[OBJECTS_TABLE]} o USING ({ident(OID_COL)})
                    {f"WHERE {in_list(f'o.{otype}', types)}" if types else ""}
                    ORDER BY 1
                """).fetchall()
            ]

        events = self._tables[EVENTS_TABLE]
        columns = [
            column
            for column in self._con.sql(f"SELECT * FROM {events} LIMIT 0").columns
            if column not in (EID_COL, ACTIVITY_COL, TIMESTAMP_COL)
        ]
        if not columns:
            return []
        counts = self._con.execute(f"""
            SELECT {", ".join(f"count({ident(column)})" for column in columns)}
            FROM {events}
            {f"WHERE {in_list(ident(ACTIVITY_COL), types)}" if types else ""}
        """).fetchone()
        return sorted(
            column for column, count in zip(columns, counts or []) if count > 0
        )

    def write(self, path: Path) -> None:
        """Write the log as the pipeline leaves it into a DuckDB file at ``path``."""
        with duckdb.connect(str(path)) as edited:
            for table, relation in self._tables.items():
                batches = self._con.sql(f"SELECT * FROM {relation}").fetch_record_batch(
                    BATCH_SIZE
                )
                edited.from_arrow(batches).create(table)
