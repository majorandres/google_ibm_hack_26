from datetime import date, datetime
from zoneinfo import ZoneInfo

MICHIGAN = ZoneInfo("America/Detroit")


def today() -> date:
    """The rider's calendar day. Cloud Run runs in UTC, which is already tomorrow after 7 or 8 PM here."""
    return datetime.now(MICHIGAN).date()
