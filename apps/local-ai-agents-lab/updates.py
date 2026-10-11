"""Explicit, bounded check for the official AI Agents Lab release."""
from __future__ import annotations

import json
import re
from urllib.error import HTTPError, URLError
from urllib.request import Request

REPOSITORY = "mmark76/Markellos-Ecosystem-AI-Agents-Lab"
LATEST_RELEASE_URL = f"https://api.github.com/repos/{REPOSITORY}/releases/latest"
RELEASE_URL_PREFIX = f"https://github.com/{REPOSITORY}/releases/"
ASSET_NAME = "AI-Agents-Lab-Windows.zip"
MAX_RESPONSE_BYTES = 1_000_000
VERSION_RE = re.compile(r"^v?(\d+)\.(\d+)\.(\d+)$")


class UpdateCheckError(ValueError):
    """A safe, user-facing update-check failure."""


def _version(value: str) -> tuple[int, int, int]:
    if not isinstance(value, str):
        raise UpdateCheckError("Invalid release version.")
    match = VERSION_RE.fullmatch(value.strip())
    if not match:
        raise UpdateCheckError("The official release has an invalid version.")
    return tuple(int(part) for part in match.groups())  # type: ignore[return-value]


def _official_url(value: object, label: str) -> str:
    if not isinstance(value, str) or not value.startswith(RELEASE_URL_PREFIX):
        raise UpdateCheckError(f"The official release returned an invalid {label}.")
    return value


def check_for_update(current_version: str, opener) -> dict:
    """Fetch release metadata only after an explicit local UI request.

    The endpoint, request size, timeout, version format, and external links are
    all fixed here. This function never downloads, installs, or executes an
    update.
    """
    current = _version(current_version)
    request = Request(
        LATEST_RELEASE_URL,
        headers={
            "Accept": "application/vnd.github+json",
            "User-Agent": "Markellos-AI-Agents-Lab-Update-Check",
        },
    )
    try:
        with opener.open(request, timeout=8) as response:
            raw = response.read(MAX_RESPONSE_BYTES + 1)
    except (HTTPError, URLError, OSError) as err:
        raise UpdateCheckError("Could not check for updates. Try again later.") from err
    if len(raw) > MAX_RESPONSE_BYTES:
        raise UpdateCheckError("The update response was unexpectedly large.")
    try:
        release = json.loads(raw)
    except (TypeError, ValueError, json.JSONDecodeError) as err:
        raise UpdateCheckError("The official release response was invalid.") from err
    if not isinstance(release, dict):
        raise UpdateCheckError("The official release response was invalid.")

    tag = release.get("tag_name")
    latest = _version(tag)
    release_url = _official_url(release.get("html_url"), "release link")
    asset_url = ""
    assets = release.get("assets")
    if isinstance(assets, list):
        for asset in assets:
            if isinstance(asset, dict) and asset.get("name") == ASSET_NAME:
                asset_url = _official_url(asset.get("browser_download_url"), "download link")
                break

    return {
        "currentVersion": current_version,
        "latestVersion": f"{latest[0]}.{latest[1]}.{latest[2]}",
        "available": latest > current,
        "releaseUrl": release_url,
        "downloadUrl": asset_url,
    }
