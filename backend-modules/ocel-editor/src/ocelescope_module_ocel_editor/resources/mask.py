from pathlib import Path
from typing import Self

import duckdb
from ocelescope import Table, TabularResource
from ocelescope.ocel.constants import (
    E2O_QUALIFIER,
    EID_COL,
    O2O_QUALIFIER,
    O2O_SOURCE_ID,
    O2O_TARGET_ID,
    OID_COL,
)
from ocelescope.util.sql import ident, literal

_CSV_TABLES: list[tuple[str, list[str], str | None]] = [
    ("e2o", [EID_COL, OID_COL], E2O_QUALIFIER),
    ("o2o", [O2O_SOURCE_ID, O2O_TARGET_ID], O2O_QUALIFIER),
    ("objects", [OID_COL], None),
    ("events", [EID_COL], None),
]


class OcelMask(TabularResource):
    """A selection of an OCEL: objects, events and relations, listed by id.

    Any of the tables may be empty. A relation whose qualifier is NULL stands for
    that relation under any qualifier.
    """

    label = "OCEL Mask"
    description = "A selection of objects, events and relations of an OCEL"

    objects = Table([(OID_COL, "str")])
    events = Table([(EID_COL, "str")])
    e2o = Table([(EID_COL, "str"), (OID_COL, "str"), (E2O_QUALIFIER, "str")])
    o2o = Table(
        [(O2O_SOURCE_ID, "str"), (O2O_TARGET_ID, "str"), (O2O_QUALIFIER, "str")]
    )

    @classmethod
    def from_csv(cls, path: str | Path) -> Self:
        """A mask filling the one table the CSV at ``path`` has the columns of.

        The columns are the OCEL's own (``ocel:oid``, ``ocel:eid``, ...); a
        relation's qualifier may be left out.

        Raises:
            ValueError: If the CSV fits no table, or lists nothing.
        """
        con = duckdb.connect(":memory:")
        try:
            try:
                csv = con.sql(
                    f"FROM read_csv({literal(str(path))}, header = true, all_varchar = true)"
                )
            except duckdb.Error as error:
                raise ValueError(f"Not a readable CSV: {error}") from error
            columns = csv.columns

            for table, required, qualifier in _CSV_TABLES:
                if not set(required) <= set(columns):
                    continue
                selected = [ident(column) for column in required]
                if qualifier is not None:
                    selected.append(
                        ident(qualifier)
                        if qualifier in columns
                        else f"NULL AS {ident(qualifier)}"
                    )
                rows = con.sql(
                    f"SELECT DISTINCT {', '.join(selected)} FROM csv "
                    f"WHERE {' AND '.join(f'{ident(c)} IS NOT NULL' for c in required)}"
                )
                data = rows.arrow().read_all()
                if data.num_rows == 0:
                    raise ValueError("The CSV lists nothing")
                mask = cls()
                setattr(mask, table, data)
                return mask
        finally:
            con.close()

        raise ValueError(
            "The CSV needs an ocel:oid or ocel:eid column, both for E2O "
            "relations, or ocel:oid_1 and ocel:oid_2 for O2O relations"
        )
