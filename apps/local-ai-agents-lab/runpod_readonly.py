"""Narrow, fixed-endpoint RunPod account and GPU-catalog reader.

This module intentionally has no mutation, upload, shell, model, dataset, or
Pod capability.  It sends a single fixed GraphQL query only after an explicit
same-origin Local Lab request.  The bearer token remains inside this process
and is neither logged nor returned to the browser.
"""
from __future__ import annotations

import json
from urllib.error import HTTPError, URLError
from urllib.request import HTTPRedirectHandler, ProxyHandler, Request, build_opener

from credential_vault import CredentialVaultError


class RunpodReadOnlyError(RuntimeError):
    """A safe error for a read-only provider connection check."""


class _NoRedirectHandler(HTTPRedirectHandler):
    """Reject redirects so bearer credentials never follow a new destination."""

    def redirect_request(self, *_args, **_kwargs):
        return None


class RunpodReadOnlyService:
    """Use one allow-listed HTTPS endpoint for a non-mutating RunPod query."""

    _ENDPOINT = "https://api.runpod.io/graphql"
    _TIMEOUT_SECONDS = 12
    _MAX_RESPONSE_BYTES = 1_000_000
    _QUERY = """query LocalLabReadOnlyConnection {
      myself { id }
      gpuTypes {
        id
        displayName
        memoryInGb
        lowestPrice(input: { gpuCount: 1 }) {
          stockStatus
          uninterruptablePrice
        }
      }
    }"""

    def __init__(self, vault, opener=None):
        self._vault = vault
        # Ignore proxy environment variables so a local proxy cannot receive a
        # personal provider token. HTTPS certificate validation remains active.
        self._opener = opener or build_opener(ProxyHandler({}), _NoRedirectHandler())

    @staticmethod
    def _number(value):
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            return None
        if value < 0 or value > 1_000_000:
            return None
        return value

    @staticmethod
    def _text(value, maximum=120):
        return value if isinstance(value, str) and 0 < len(value) <= maximum else None

    def _request(self, token: str):
        body = json.dumps({"query": self._QUERY}, separators=(",", ":")).encode("utf-8")
        return Request(
            self._ENDPOINT,
            data=body,
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json", "Accept": "application/json"},
            method="POST",
        )

    def check(self, provider: str) -> dict:
        if provider != "runpod":
            raise RunpodReadOnlyError("Unsupported personal provider connection.")
        try:
            token = self._vault.load(provider)
        except CredentialVaultError as error:
            raise RunpodReadOnlyError("No usable local RunPod credential is available.") from error
        try:
            with self._opener.open(self._request(token), timeout=self._TIMEOUT_SECONDS) as response:
                raw = response.read(self._MAX_RESPONSE_BYTES + 1)
        except HTTPError as error:
            if error.code in (401, 403):
                raise RunpodReadOnlyError("RunPod did not accept the stored credential.") from error
            raise RunpodReadOnlyError("RunPod could not complete the read-only connection check.") from error
        except (URLError, OSError, TimeoutError) as error:
            raise RunpodReadOnlyError("RunPod could not be reached for the read-only connection check.") from error
        if len(raw) > self._MAX_RESPONSE_BYTES:
            raise RunpodReadOnlyError("RunPod returned an unexpectedly large connection response.")
        try:
            payload = json.loads(raw)
            data = payload["data"]
            account = data["myself"]
            gpu_types = data["gpuTypes"]
        except (KeyError, TypeError, ValueError, json.JSONDecodeError) as error:
            raise RunpodReadOnlyError("RunPod returned an invalid read-only connection response.") from error
        if not isinstance(account, dict) or not self._text(account.get("id"), 200):
            raise RunpodReadOnlyError("RunPod could not confirm the stored credential.")
        if not isinstance(gpu_types, list):
            raise RunpodReadOnlyError("RunPod returned an invalid GPU catalog.")
        catalog = []
        for gpu in gpu_types[:100]:
            if not isinstance(gpu, dict):
                continue
            price = gpu.get("lowestPrice")
            price = price if isinstance(price, dict) else {}
            identifier = self._text(gpu.get("id"))
            name = self._text(gpu.get("displayName"))
            memory = self._number(gpu.get("memoryInGb"))
            if identifier and name and memory is not None:
                catalog.append({
                    "id": identifier,
                    "name": name,
                    "memoryGb": memory,
                    "availability": self._text(price.get("stockStatus"), 20),
                    "hourlyPriceUsd": self._number(price.get("uninterruptablePrice")),
                })
        return {
            "state": "READ_ONLY_CONNECTED",
            "provider": "runpod",
            "account": "authenticated",
            "gpus": catalog,
            "execution": "No Pod, upload, provisioning, model download, or training job was started.",
        }
