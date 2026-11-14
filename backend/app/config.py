from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

_HERE = Path(__file__).resolve()
REPO_ROOT = _HERE.parents[2]


def data_file(name: str) -> Path:
    """seed_data.json / trips.csv sit at the repo root in dev and next to app/ in the image."""
    in_image = _HERE.parents[1] / name
    return in_image if in_image.exists() else REPO_ROOT / name


class Settings(BaseSettings):
    """Read from environment variables, falling back to the repo-root .env file."""

    model_config = SettingsConfigDict(env_file=REPO_ROOT / ".env", extra="ignore")

    # IBM: watsonx.ai (Granite) and Watson Speech to Text
    ibmcloud_api_key: str = ""
    watsonx_url: str = "https://us-south.ml.cloud.ibm.com"
    watsonx_project_id: str = ""
    watsonx_model_id: str = "ibm/granite-4-h-small"
    stt_url: str = ""
    stt_api_key: str = ""  # empty: use ibmcloud_api_key

    # Google Cloud: Firestore (trips) and BigQuery (dashboard aggregates)
    use_firestore: bool = False  # false: trips live in memory and vanish on restart
    bigquery_table: str = ""  # "project.riderecord.trips"; empty: read trips.csv

    @property
    def watsonx_configured(self) -> bool:
        return bool(self.ibmcloud_api_key and self.watsonx_project_id)

    @property
    def stt_configured(self) -> bool:
        return bool(self.stt_url and (self.stt_api_key or self.ibmcloud_api_key))


@lru_cache
def get_settings() -> Settings:
    return Settings()
