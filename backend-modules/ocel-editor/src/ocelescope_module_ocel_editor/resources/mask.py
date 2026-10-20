from ocelescope import Table, TabularResource
from ocelescope.ocel.constants import (
    E2O_QUALIFIER,
    EID_COL,
    O2O_QUALIFIER,
    O2O_SOURCE_ID,
    O2O_TARGET_ID,
    OID_COL,
)


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
