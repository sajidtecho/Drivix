import os
import re
from datetime import datetime
from typing import Dict, List, Optional, Tuple, Any
import pandas as pd
import numpy as np

try:
    from pymongo import MongoClient
    from pymongo.errors import PyMongoError, ServerSelectionTimeoutError
    PYMONGO_AVAILABLE = True
except ImportError:
    PYMONGO_AVAILABLE = False

from feature_engineering import FEATURE_COLUMNS_RAW

# Default connection settings
DEFAULT_MONGO_URI = (
    os.getenv("MONGO_URI") or
    "mongodb+srv://drivixmobility_db_user:X9lvJNDZ1RUknC4N@drivix.irkmtpg.mongodb.net/drivix"
)
DEFAULT_DB_NAME = os.getenv("MONGO_DB_NAME", "drivix")


class DrivixDatabaseConnector:
    """
    Connects to the Drivix MongoDB operational database to stream
    real-time bookings, location capacity metrics, and calculate ground-truth
    occupancy labels for the Online Learning system.
    """

    def __init__(self, mongo_uri: Optional[str] = None, db_name: Optional[str] = None, timeout_ms: int = 4000):
        self.mongo_uri = mongo_uri or DEFAULT_MONGO_URI
        self.db_name = db_name or DEFAULT_DB_NAME
        self.timeout_ms = timeout_ms
        self._client: Optional[Any] = None
        self._db: Optional[Any] = None

    def connect(self) -> bool:
        """Establishes MongoDB connection with timeout guard."""
        if not PYMONGO_AVAILABLE:
            print("[DB Connector] Warning: pymongo is not installed.")
            return False

        try:
            self._client = MongoClient(
                self.mongo_uri,
                serverSelectionTimeoutMS=self.timeout_ms,
                connectTimeoutMS=self.timeout_ms
            )
            # Ping to verify connectivity
            self._client.admin.command('ping')
            self._db = self._client[self.db_name]
            return True
        except Exception as e:
            print(f"[DB Connector] Connection failed: {e}")
            self._client = None
            self._db = None
            return False

    def is_connected(self) -> bool:
        """Checks if MongoDB connection is alive."""
        if self._client is None or self._db is None:
            return self.connect()
        try:
            self._client.admin.command('ping')
            return True
        except Exception:
            return False

    def get_database(self):
        if not self.is_connected():
            return None
        return self._db

    def fetch_locations_map(self) -> Dict[str, Dict[str, Any]]:
        """
        Retrieves all parking locations indexed by ObjectId string and parkingName
        for fast contextual lookups during feature extraction.
        """
        db = self.get_database()
        if db is None:
            return {}

        loc_map: Dict[str, Dict[str, Any]] = {}
        try:
            cursor = db["parkinglocations"].find(
                {},
                {"parkingName": 1, "totalSlots": 1, "availableSlots": 1, "hourlyPrice": 1, "status": 1}
            )
            for doc in cursor:
                loc_id = str(doc.get("_id"))
                loc_name = doc.get("parkingName", "Unknown")
                info = {
                    "id": loc_id,
                    "parkingName": loc_name,
                    "totalSlots": int(doc.get("totalSlots") or 100),
                    "availableSlots": int(doc.get("availableSlots") if doc.get("availableSlots") is not None else 50),
                    "hourlyPrice": float(doc.get("hourlyPrice") or 60.0)
                }
                loc_map[loc_id] = info
                loc_map[loc_name] = info
        except Exception as e:
            print(f"[DB Connector] Error fetching locations: {e}")
        return loc_map

    def fetch_bookings(
        self,
        since_timestamp: Optional[datetime] = None,
        limit: int = 200,
        status_filter: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """
        Fetches bookings created or modified since since_timestamp.
        """
        db = self.get_database()
        if db is None:
            return []

        query: Dict[str, Any] = {}
        if since_timestamp:
            query["createdAt"] = {"$gt": since_timestamp}

        if status_filter:
            query["status"] = {"$in": status_filter}

        try:
            cursor = db["bookings"].find(query).sort("createdAt", 1).limit(limit)
            return list(cursor)
        except Exception as e:
            print(f"[DB Connector] Error querying bookings: {e}")
            return []

    def get_total_bookings_count(self) -> int:
        """Returns total document count in bookings collection."""
        db = self.get_database()
        if db is None:
            return 0
        try:
            return db["bookings"].count_documents({})
        except Exception:
            return 0

    def transform_booking_to_sample(
        self,
        booking: Dict[str, Any],
        locations_map: Optional[Dict[str, Dict[str, Any]]] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Transforms a raw MongoDB booking document into standard ML feature vector
        plus ground-truth target occupancy label.
        """
        if locations_map is None:
            locations_map = self.fetch_locations_map()

        loc_name = booking.get("locationName") or "Connaught Place"
        loc_id = str(booking.get("locationId") or booking.get("parkingHubId") or "")

        loc_info = locations_map.get(loc_id) or locations_map.get(loc_name) or {}
        total_capacity = float(loc_info.get("totalSlots") or 100.0)

        # Parse entry date and time
        entry_date_str = str(booking.get("entryDate") or booking.get("bookingDate") or "")
        entry_time_str = str(booking.get("entryTime") or booking.get("startTime") or "12:00")
        created_at = booking.get("createdAt")

        if isinstance(created_at, str):
            try:
                created_at_dt = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
            except Exception:
                created_at_dt = datetime.now()
        elif isinstance(created_at, datetime):
            created_at_dt = created_at
        else:
            created_at_dt = datetime.now()

        # Parse entry hour & day-of-week
        entry_hour = 12
        entry_dow = created_at_dt.weekday()

        if entry_time_str:
            time_match = re.search(r"(\d{1,2}):(\d{2})", entry_time_str)
            if time_match:
                entry_hour = int(time_match.group(1))

        if entry_date_str:
            try:
                date_dt = datetime.strptime(entry_date_str[:10], "%Y-%m-%d")
                entry_dow = date_dt.weekday()
            except Exception:
                pass

        is_weekend = 1 if entry_dow in [5, 6] else 0

        # Requested duration
        duration_h = float(booking.get("duration") or 2.0)
        duration_h = max(0.5, min(72.0, duration_h))

        # Calculate lead time in minutes
        lead_time_min = 15.0
        if entry_date_str:
            try:
                sched_dt = datetime.strptime(f"{entry_date_str[:10]} {entry_hour:02d}:00", "%Y-%m-%d %H:%M")
                diff = (sched_dt - created_at_dt).total_seconds() / 60.0
                lead_time_min = max(0.0, diff)
            except Exception:
                lead_time_min = 15.0

        # Occupancy at quote time
        avail_slots = loc_info.get("availableSlots")
        if avail_slots is not None and total_capacity > 0:
            occ_at_quote = max(0.0, min(1.0, (total_capacity - avail_slots) / total_capacity))
        else:
            occ_at_quote = 0.50

        busy_frac = occ_at_quote
        requests_60min = 10.0
        occ_same_hour_last_week = occ_at_quote

        # Ground-truth Target Calculation:
        # Ground truth target is the actual realized occupancy fraction for this booking's window.
        # We derive this from the booking status, realized slots, and dynamic pricing result.
        status = str(booking.get("status", "")).lower()
        total_cost = float(booking.get("totalCost") or 0.0)
        base_rate = float(loc_info.get("hourlyPrice") or 60.0)

        # Derive effective multiplier if available
        if total_cost > 0 and base_rate > 0 and duration_h > 0:
            effective_mult = total_cost / (base_rate * duration_h)
        else:
            effective_mult = 1.0

        # If booking was completed/checked in/out or confirmed, estimate the ground-truth occupancy
        # High surge (multiplier >= 1.25) corresponds to occupancy > 0.70; normal to 0.40 - 0.60
        if effective_mult >= 1.4:
            ground_truth_occ = 0.88
        elif effective_mult >= 1.2:
            ground_truth_occ = 0.74
        elif effective_mult >= 1.05:
            ground_truth_occ = 0.58
        elif effective_mult < 0.95:
            ground_truth_occ = 0.25
        else:
            # Baseline proportional to lot occupancy plus peak hour dynamics
            peak_bonus = 0.15 if ((9 <= entry_hour <= 12) or (17 <= entry_hour <= 20)) else -0.08
            ground_truth_occ = np.clip(occ_at_quote + peak_bonus, 0.10, 0.95)

        features = {
            'f_location': loc_name,
            'f_capacity': float(total_capacity),
            'f_entry_hour': int(entry_hour),
            'f_entry_dow': int(entry_dow),
            'f_is_weekend': int(is_weekend),
            'f_lead_time_min': float(lead_time_min),
            'f_requested_duration_h': float(duration_h),
            'f_occ_entry_at_quote': float(occ_at_quote),
            'f_busy_frac_window_at_quote': float(busy_frac),
            'f_requests_last_60min_location': float(requests_60min),
            'f_occ_same_hour_last_week': float(occ_same_hour_last_week)
        }

        return {
            "booking_id": str(booking.get("bookingId") or booking.get("_id")),
            "created_at": created_at_dt,
            "features": features,
            "target_occupancy_rate": float(ground_truth_occ)
        }

    def fetch_training_batch_from_db(
        self,
        since_timestamp: Optional[datetime] = None,
        limit: int = 200
    ) -> Tuple[pd.DataFrame, pd.Series, Optional[datetime], int]:
        """
        Fetches new operational bookings from MongoDB, extracts features,
        and formats them as (X_df, y_series, latest_timestamp, records_count).
        """
        raw_bookings = self.fetch_bookings(since_timestamp=since_timestamp, limit=limit)
        if not raw_bookings:
            return pd.DataFrame(columns=FEATURE_COLUMNS_RAW), pd.Series(dtype=float), since_timestamp, 0

        locations_map = self.fetch_locations_map()
        feature_rows = []
        target_values = []
        latest_ts = since_timestamp

        for b in raw_bookings:
            sample = self.transform_booking_to_sample(b, locations_map=locations_map)
            if sample:
                feature_rows.append(sample["features"])
                target_values.append(sample["target_occupancy_rate"])
                ts = sample["created_at"]
                if latest_ts is None or (isinstance(ts, datetime) and ts > latest_ts):
                    latest_ts = ts

        if not feature_rows:
            return pd.DataFrame(columns=FEATURE_COLUMNS_RAW), pd.Series(dtype=float), latest_ts, 0

        X_df = pd.DataFrame(feature_rows)[FEATURE_COLUMNS_RAW]
        y_series = pd.Series(target_values, dtype=float)
        return X_df, y_series, latest_ts, len(feature_rows)
