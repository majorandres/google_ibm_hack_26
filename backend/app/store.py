"""Trip storage: Firestore when USE_FIRESTORE=true, otherwise an in-memory dict.

Trips are stored as JSON-ready dicts (Trip.model_dump(mode="json")).
"""

from functools import lru_cache

from app.config import get_settings

_mem: dict[str, dict] = {}


@lru_cache
def _collection():
    from google.cloud import firestore  # imported late: not needed for local dev

    return firestore.Client().collection("trips")


def _firestore() -> bool:
    return get_settings().use_firestore


def save(trip: dict) -> None:
    if _firestore():
        _collection().document(trip["id"]).set(trip)
    else:
        _mem[trip["id"]] = trip


def by_rider(rider_id: str) -> list[dict]:
    if _firestore():
        from google.cloud.firestore_v1.base_query import FieldFilter

        query = _collection().where(filter=FieldFilter("rider_id", "==", rider_id))
        trips = [doc.to_dict() for doc in query.stream()]
    else:
        trips = [t for t in _mem.values() if t["rider_id"] == rider_id]
    return sorted(trips, key=lambda t: (t["trip_date"], t["logged_at"]), reverse=True)
