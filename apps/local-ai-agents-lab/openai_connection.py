"""User-controlled ChatGPT connection and one-off external review requests."""
from __future__ import annotations

import base64
import hashlib
import json
import os
import secrets
import time
import uuid
import webbrowser
from pathlib import Path
from threading import Lock
from typing import Any, Callable
from urllib.parse import urlencode
from urllib.request import ProxyHandler, Request, build_opener

from credential_vault import CredentialVault, CredentialVaultError

AUTHORIZATION_ENDPOINT = "https://auth.openai.com/api/accounts/authorize"
TOKEN_ENDPOINT = "https://auth.openai.com/api/accounts/oauth/token"
JWKS_URI = "https://auth.openai.com/.well-known/jwks.json"
ISSUER = "https://auth.openai.com"
RESOURCE = "https://api.openai.com/v1"
SCOPES = ("openid", "profile", "email", "offline_access", "resource.invoke", "chatgpt.tokens.use.direct")
DYNAMIC_CLIENT_ID = "dynamic_agent_client"
CALLBACK_PATH = "/auth/callback"
ATTEMPT_TTL_SECONDS = 600


class OpenAIConnectionError(ValueError):
    """A safe-to-display local connection error."""


class OpenAIConnectionSetupRequired(OpenAIConnectionError):
    """The explicit crypto/OIDC component has not been installed yet."""


def _urlsafe_random(size: int = 32) -> str:
    return base64.urlsafe_b64encode(os.urandom(size)).rstrip(b"=").decode("ascii")


def _challenge(verifier: str) -> str:
    return base64.urlsafe_b64encode(hashlib.sha256(verifier.encode("ascii")).digest()).rstrip(b"=").decode("ascii")


class OpenAIConnectionService:
    """Owns the browser approval transaction and opaque locally protected record."""

    def __init__(self, vault: CredentialVault, root: Path, *, browser_open: Callable[[str], bool] = webbrowser.open,
                 token_exchange: Callable[[dict[str, str]], dict[str, Any]] | None = None,
                 identity_validator: Callable[[str, str, str], dict[str, Any]] | None = None):
        self._vault = vault
        self._root = Path(root)
        self._browser_open = browser_open
        self._token_exchange = token_exchange or self._exchange_tokens
        self._identity_validator = identity_validator or self._validate_identity_token
        self._lock = Lock()
        self._attempt: dict[str, Any] | None = None

    @property
    def _registration_path(self) -> Path:
        return self._root / "data" / "openai-chatgpt-registration.json"

    @property
    def _host_path(self) -> Path:
        return self._root / "data" / "openai-chatgpt-host.json"

    def status(self) -> dict[str, Any]:
        try:
            raw = self._vault.load("openai-chatgpt")
        except CredentialVaultError as err:
            raise OpenAIConnectionError("The saved ChatGPT connection could not be read. Disconnect it locally and reconnect.") from err
        if not raw:
            return {"provider": "openai-chatgpt", "connected": False, "scope": "current-windows-user"}
        try:
            record = json.loads(raw)
            if not isinstance(record, dict) or not isinstance(record.get("subject"), str):
                raise ValueError("invalid record")
        except (TypeError, ValueError, json.JSONDecodeError) as err:
            raise OpenAIConnectionError("The saved ChatGPT connection is invalid. Disconnect it locally and reconnect.") from err
        return {
            "provider": "openai-chatgpt",
            "connected": True,
            "scope": "current-windows-user",
            "planUsageAuthorized": bool(record.get("planUsageAuthorized")),
        }

    def start(self, callback_port: int) -> dict[str, Any]:
        if not 1024 <= callback_port <= 65535:
            raise OpenAIConnectionError("The local callback port is invalid.")
        self._require_crypto()
        with self._lock:
            if self._attempt and self._attempt["expiresAt"] > time.time():
                raise OpenAIConnectionError("A ChatGPT connection approval is already open in your browser.")
            client_id = self._client_id()
            attempt = {
                "state": _urlsafe_random(), "nonce": _urlsafe_random(), "verifier": _urlsafe_random(48),
                "clientId": client_id, "expiresAt": time.time() + ATTEMPT_TTL_SECONDS,
                "redirectUri": f"http://127.0.0.1:{callback_port}{CALLBACK_PATH}",
                "hostId": self._host_id(),
            }
            self._attempt = attempt
        query = {
            "response_type": "code", "client_id": client_id, "redirect_uri": attempt["redirectUri"],
            "scope": " ".join(SCOPES), "resource": RESOURCE, "state": attempt["state"],
            "nonce": attempt["nonce"], "code_challenge": _challenge(attempt["verifier"]),
            "code_challenge_method": "S256",
        }
        if client_id == DYNAMIC_CLIENT_ID:
            query["agent_name_hint"] = "Markellos Ecosystem AI Lab"
        query["ext_agent_host_id"] = attempt["hostId"]
        url = AUTHORIZATION_ENDPOINT + "?" + urlencode(query)
        if not self._browser_open(url):
            with self._lock:
                self._attempt = None
            raise OpenAIConnectionError("The browser could not be opened for ChatGPT approval.")
        return {"state": "AUTHORIZATION_STARTED", "expiresInSeconds": ATTEMPT_TTL_SECONDS}

    def complete(self, query: dict[str, str]) -> dict[str, Any]:
        with self._lock:
            attempt = self._attempt
            self._attempt = None
        if not attempt or attempt["expiresAt"] <= time.time():
            raise OpenAIConnectionError("This ChatGPT approval has expired. Start the connection again.")
        if query.get("error"):
            raise OpenAIConnectionError("ChatGPT approval was not completed.")
        if not secrets.compare_digest(query.get("state", ""), attempt["state"]):
            raise OpenAIConnectionError("The ChatGPT approval state did not match this local request.")
        code = query.get("code")
        issued_client_id = query.get("client_id")
        if not isinstance(code, str) or not code or not isinstance(issued_client_id, str) or not issued_client_id:
            raise OpenAIConnectionError("The ChatGPT approval response was incomplete.")
        if attempt["clientId"] != DYNAMIC_CLIENT_ID and not secrets.compare_digest(issued_client_id, attempt["clientId"]):
            raise OpenAIConnectionError("The ChatGPT approval response used an unexpected client identifier.")
        if attempt["clientId"] == DYNAMIC_CLIENT_ID and not issued_client_id.startswith("oaiapp_"):
            raise OpenAIConnectionError("The ChatGPT approval response did not issue a valid client identifier.")
        tokens = self._token_exchange({
            "grant_type": "authorization_code", "code": code, "client_id": issued_client_id,
            "redirect_uri": attempt["redirectUri"], "code_verifier": attempt["verifier"],
            "resource": RESOURCE,
        })
        if not isinstance(tokens, dict) or not isinstance(tokens.get("id_token"), str) or not isinstance(tokens.get("refresh_token"), str):
            raise OpenAIConnectionError("ChatGPT did not return a complete connection response.")
        identity = self._identity_validator(tokens["id_token"], issued_client_id, attempt["nonce"])
        if not isinstance(identity, dict) or not isinstance(identity.get("sub"), str) or not identity["sub"]:
            raise OpenAIConnectionError("ChatGPT did not return a valid account identity.")
        scope = tokens.get("scope", "")
        scopes = set(scope.split()) if isinstance(scope, str) else set()
        record = {
            "subject": identity["sub"], "clientId": issued_client_id,
            "refreshToken": tokens["refresh_token"], "accessToken": tokens.get("access_token", ""),
            "accessTokenExpiresAt": self._access_expiry(tokens),
            "planUsageAuthorized": "chatgpt.tokens.use.direct" in scopes,
        }
        try:
            self._vault.store("openai-chatgpt", json.dumps(record, separators=(",", ":")))
            self._save_client_id(issued_client_id)
        except (CredentialVaultError, OSError) as err:
            try:
                self._vault.remove("openai-chatgpt")
            except CredentialVaultError:
                pass
            raise OpenAIConnectionError("The ChatGPT connection could not be protected for this Windows user.") from err
        return self.status()

    def remove(self) -> dict[str, Any]:
        with self._lock:
            self._attempt = None
        try:
            removed = self._vault.remove("openai-chatgpt")
            self._registration_path.unlink(missing_ok=True)
            self._host_path.unlink(missing_ok=True)
        except (CredentialVaultError, OSError) as err:
            raise OpenAIConnectionError("The ChatGPT connection could not be removed locally.") from err
        return {"provider": "openai-chatgpt", "state": "REMOVED_LOCALLY", "removed": removed}

    def cloud_review(self, *, model: str, question: str, shared_content: str) -> dict[str, Any]:
        """Send one user-approved review packet; it never reads local history itself."""
        if not isinstance(model, str) or not model or len(model) > 160:
            raise OpenAIConnectionError("Choose an available ChatGPT model.")
        if not isinstance(question, str) or not question.strip() or len(question) > 12_000:
            raise OpenAIConnectionError("Provide a review question of up to 12,000 characters.")
        if not isinstance(shared_content, str) or len(shared_content) > 60_000:
            raise OpenAIConnectionError("The selected review content is too large.")
        record = self._connection_record()
        if not record.get("planUsageAuthorized"):
            raise OpenAIConnectionError("ChatGPT plan usage is not authorized. Reconnect and approve plan usage before requesting a review.")
        access_token = self._access_token(record)
        review_packet = question.strip()
        if shared_content.strip():
            review_packet += "\n\nUser-approved material for review:\n" + shared_content.strip()
        request = Request(
            "https://api.openai.com/v1/responses",
            data=json.dumps({"model": model, "input": [{"role": "user", "content": review_packet}],
                             "store": False, "stream": True}).encode("utf-8"),
            method="POST", headers={"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"},
        )
        text, completed = [], False
        try:
            with build_opener(ProxyHandler({})).open(request, timeout=60) as response:
                for raw_line in response:
                    line = raw_line.decode("utf-8").strip()
                    if not line.startswith("data:"):
                        continue
                    payload = line[5:].strip()
                    if payload == "[DONE]":
                        continue
                    event = json.loads(payload)
                    if event.get("type") == "response.output_text.delta" and isinstance(event.get("delta"), str):
                        text.append(event["delta"])
                    elif event.get("type") == "response.completed":
                        completed = True
                    elif event.get("type") == "response.failed":
                        raise OpenAIConnectionError("The external ChatGPT review did not complete.")
        except OpenAIConnectionError:
            raise
        except Exception as err:
            raise OpenAIConnectionError("The external ChatGPT review could not be completed. Your connection may need to be renewed.") from err
        if not completed:
            raise OpenAIConnectionError("The external ChatGPT review ended before completion.")
        return {"provider": "openai-chatgpt", "model": model, "review": "".join(text)}

    def models(self) -> dict[str, Any]:
        """List only the signed-in account's displayable models after an explicit UI request."""
        record = self._connection_record()
        if not record.get("planUsageAuthorized"):
            raise OpenAIConnectionError("ChatGPT plan usage is not authorized. Reconnect and approve plan usage before listing models.")
        access_token = self._access_token(record)
        request = Request(
            "https://api.openai.com/v1/models", method="GET",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        try:
            with build_opener(ProxyHandler({})).open(request, timeout=15) as response:
                body = json.loads(response.read().decode("utf-8"))
        except Exception as err:
            raise OpenAIConnectionError("The available ChatGPT models could not be loaded. Your connection may need to be renewed.") from err
        catalog = body.get("models") if isinstance(body, dict) else None
        if not isinstance(catalog, list):
            raise OpenAIConnectionError("ChatGPT returned an invalid model catalog.")
        models = [
            {"slug": item["slug"], "displayName": item["display_name"]}
            for item in catalog
            if isinstance(item, dict) and item.get("visibility") == "list"
            and isinstance(item.get("slug"), str) and isinstance(item.get("display_name"), str)
        ]
        return {"provider": "openai-chatgpt", "models": models}

    def _connection_record(self) -> dict[str, Any]:
        try:
            raw = self._vault.load("openai-chatgpt")
            record = json.loads(raw) if raw else None
        except (CredentialVaultError, TypeError, ValueError, json.JSONDecodeError) as err:
            raise OpenAIConnectionError("The saved ChatGPT connection could not be read. Disconnect it locally and reconnect.") from err
        if not isinstance(record, dict):
            raise OpenAIConnectionError("No ChatGPT connection is stored for this Windows user.")
        return record

    def _access_token(self, record: dict[str, Any]) -> str:
        access_token = record.get("accessToken")
        expires_at = record.get("accessTokenExpiresAt")
        if isinstance(access_token, str) and access_token and (not isinstance(expires_at, (int, float)) or time.time() < expires_at - 60):
            return access_token
        client_id, refresh_token = record.get("clientId"), record.get("refreshToken")
        if not isinstance(client_id, str) or not client_id.startswith("oaiapp_") or not isinstance(refresh_token, str) or not refresh_token:
            raise OpenAIConnectionError("ChatGPT authorization has expired. Reconnect and approve plan usage again.")
        with self._lock:
            refreshed = self._token_exchange({
                "grant_type": "refresh_token", "client_id": client_id,
                "refresh_token": refresh_token, "resource": RESOURCE,
            })
            if not isinstance(refreshed, dict) or not isinstance(refreshed.get("access_token"), str) or not refreshed["access_token"]:
                raise OpenAIConnectionError("ChatGPT did not return a renewed connection token. Reconnect and approve plan usage again.")
            record["accessToken"] = refreshed["access_token"]
            if isinstance(refreshed.get("refresh_token"), str) and refreshed["refresh_token"]:
                record["refreshToken"] = refreshed["refresh_token"]
            record["accessTokenExpiresAt"] = self._access_expiry(refreshed)
            try:
                self._vault.store("openai-chatgpt", json.dumps(record, separators=(",", ":")))
            except CredentialVaultError as err:
                raise OpenAIConnectionError("The renewed ChatGPT connection could not be protected locally.") from err
            return record["accessToken"]

    @staticmethod
    def _access_expiry(tokens: dict[str, Any]) -> float:
        lifetime = tokens.get("expires_in")
        return time.time() + lifetime if isinstance(lifetime, (int, float)) and lifetime > 0 else 0

    def _client_id(self) -> str:
        try:
            data = json.loads(self._registration_path.read_text(encoding="utf-8"))
            client_id = data.get("clientId")
            if isinstance(client_id, str) and client_id.startswith("oaiapp_"):
                return client_id
        except (OSError, ValueError, json.JSONDecodeError):
            pass
        return DYNAMIC_CLIENT_ID

    def _save_client_id(self, client_id: str) -> None:
        self._registration_path.parent.mkdir(parents=True, exist_ok=True)
        temporary = self._registration_path.with_suffix(".tmp")
        temporary.write_text(json.dumps({"clientId": client_id}, separators=(",", ":")), encoding="utf-8")
        temporary.replace(self._registration_path)

    def _host_id(self) -> str:
        try:
            data = json.loads(self._host_path.read_text(encoding="utf-8"))
            host_id = data.get("hostId")
            if isinstance(host_id, str) and host_id.startswith("urn:uuid:"):
                return host_id
        except (OSError, ValueError, json.JSONDecodeError):
            pass
        host_id = f"urn:uuid:{uuid.uuid4()}"
        self._host_path.parent.mkdir(parents=True, exist_ok=True)
        temporary = self._host_path.with_suffix(".tmp")
        temporary.write_text(json.dumps({"hostId": host_id}, separators=(",", ":")), encoding="utf-8")
        temporary.replace(self._host_path)
        return host_id

    @staticmethod
    def _require_crypto() -> None:
        try:
            import jwt  # noqa: F401
        except ImportError as err:
            raise OpenAIConnectionSetupRequired("Install the optional ChatGPT connection component before continuing.") from err

    @staticmethod
    def _exchange_tokens(form: dict[str, str]) -> dict[str, Any]:
        payload = urlencode(form).encode("utf-8")
        request = Request(TOKEN_ENDPOINT, data=payload, method="POST", headers={"Content-Type": "application/x-www-form-urlencoded"})
        try:
            with build_opener(ProxyHandler({})).open(request, timeout=15) as response:
                body = json.loads(response.read().decode("utf-8"))
        except Exception as err:
            raise OpenAIConnectionError("ChatGPT could not complete the connection exchange.") from err
        if not isinstance(body, dict):
            raise OpenAIConnectionError("ChatGPT returned an invalid connection response.")
        return body

    @staticmethod
    def _validate_identity_token(id_token: str, client_id: str, nonce: str) -> dict[str, Any]:
        OpenAIConnectionService._require_crypto()
        import jwt
        try:
            signing_key = jwt.PyJWKClient(JWKS_URI, timeout=10).get_signing_key_from_jwt(id_token)
            claims = jwt.decode(id_token, signing_key.key, algorithms=["RS256"], audience=client_id,
                                issuer=ISSUER, options={"require": ["exp", "iat", "sub", "nonce"]}, leeway=5)
        except Exception as err:
            raise OpenAIConnectionError("ChatGPT identity verification failed.") from err
        if not isinstance(claims, dict) or not isinstance(claims.get("nonce"), str) or not secrets.compare_digest(claims["nonce"], nonce):
            raise OpenAIConnectionError("ChatGPT identity verification did not match this local request.")
        return claims
