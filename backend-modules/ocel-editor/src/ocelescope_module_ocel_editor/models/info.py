from typing import Literal

from ocelescope import OCEL
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
from ocelescope.util.sql import ident, in_list

EntityType = Literal["object", "event"]


def attributes(ocel: OCEL, entity_type: EntityType, types: list[str]) -> list[str]:
    """The attributes entities of ``types`` carry, or any entity when empty."""
    if entity_type == "object":
        otype = ident(OTYPE_COL)
        return [
            attribute
            for (attribute,) in ocel.sql(f"""
                SELECT DISTINCT c.{ident(OBJECT_CHANGED_FIELD)}
                FROM {ident(OBJECT_CHANGES_TABLE)} c
                JOIN {ident(OBJECTS_TABLE)} o USING ({ident(OID_COL)})
                {f"WHERE {in_list(f'o.{otype}', types)}" if types else ""}
                ORDER BY 1
            """).fetchall()
        ]

    events = ident(EVENTS_TABLE)
    columns = [
        column
        for column in ocel.sql(f"SELECT * FROM {events} LIMIT 0").columns
        if column not in (EID_COL, ACTIVITY_COL, TIMESTAMP_COL)
    ]
    if not columns:
        return []
    counts = ocel.sql(f"""
        SELECT {", ".join(f"count({ident(column)})" for column in columns)}
        FROM {events}
        {f"WHERE {in_list(ident(ACTIVITY_COL), types)}" if types else ""}
    """).fetchone()
    return sorted(
        column
        for column, count in zip(columns, counts or [], strict=False)
        if count > 0
    )
