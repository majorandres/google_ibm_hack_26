from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

REPO_ROOT = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    """Read from environment variables, falling back to the repo-root .env file."""

    model_config = SettingsConfigDict(env_file=REPO_ROOT / ".env", extra="ignore")

    ibmcloud_api_key: str = ""
    watsonx_url: str = "https://us-south.ml.cloud.ibm.com"
    watsonx_project_id: str = ""
    watsonx_model_id: str = "ibm/granite-4-h-small"
    google_maps_api_key: str = ""

    @property
    def watsonx_configured(self) -> bool:
        return bool(self.ibmcloud_api_key and self.watsonx_project_id)


@lru_cache
def get_settings() -> Settings:
    return Settings()
