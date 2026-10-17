"""Windows-user-scoped encrypted storage for future provider credentials.

The vault has no network or provider API capability.  It stores opaque blobs
outside the repository, protected by Windows DPAPI for the current user.  Only
a future, separately approved provider adapter may call ``load``.
"""
from __future__ import annotations

import ctypes
import os
from ctypes import wintypes
from pathlib import Path


class CredentialVaultError(RuntimeError):
    """Raised without including credential material in the error message."""


class _DataBlob(ctypes.Structure):
    _fields_ = [("cbData", wintypes.DWORD), ("pbData", ctypes.POINTER(ctypes.c_byte))]


class WindowsDpapi:
    """Small no-dependency wrapper around CryptProtectData/UnprotectData."""

    _UI_FORBIDDEN = 0x1

    def __init__(self):
        if os.name != "nt":
            raise CredentialVaultError("Personal provider credentials are available only on Windows.")
        self._crypt32 = ctypes.WinDLL("Crypt32", use_last_error=True)
        self._kernel32 = ctypes.WinDLL("Kernel32", use_last_error=True)
        self._crypt32.CryptProtectData.argtypes = [ctypes.POINTER(_DataBlob), wintypes.LPCWSTR, ctypes.c_void_p, ctypes.c_void_p, ctypes.c_void_p, wintypes.DWORD, ctypes.POINTER(_DataBlob)]
        self._crypt32.CryptProtectData.restype = wintypes.BOOL
        self._crypt32.CryptUnprotectData.argtypes = [ctypes.POINTER(_DataBlob), ctypes.c_void_p, ctypes.c_void_p, ctypes.c_void_p, ctypes.c_void_p, wintypes.DWORD, ctypes.POINTER(_DataBlob)]
        self._crypt32.CryptUnprotectData.restype = wintypes.BOOL
        self._kernel32.LocalFree.argtypes = [ctypes.c_void_p]
        self._kernel32.LocalFree.restype = ctypes.c_void_p

    @staticmethod
    def _input_blob(value: bytes) -> tuple[_DataBlob, ctypes.Array[ctypes.c_byte]]:
        buffer = (ctypes.c_byte * len(value)).from_buffer_copy(value)
        return _DataBlob(len(value), ctypes.cast(buffer, ctypes.POINTER(ctypes.c_byte))), buffer

    def _output_bytes(self, output: _DataBlob) -> bytes:
        try:
            return ctypes.string_at(output.pbData, output.cbData)
        finally:
            if output.pbData:
                self._kernel32.LocalFree(output.pbData)

    def protect(self, value: bytes) -> bytes:
        source, _buffer = self._input_blob(value)
        output = _DataBlob()
        if not self._crypt32.CryptProtectData(ctypes.byref(source), "Markellos AI Training Lab provider credential", None, None, None, self._UI_FORBIDDEN, ctypes.byref(output)):
            raise CredentialVaultError("Windows could not protect the provider credential.")
        return self._output_bytes(output)

    def unprotect(self, value: bytes) -> bytes:
        source, _buffer = self._input_blob(value)
        output = _DataBlob()
        if not self._crypt32.CryptUnprotectData(ctypes.byref(source), None, None, None, None, self._UI_FORBIDDEN, ctypes.byref(output)):
            raise CredentialVaultError("Windows could not open the stored provider credential.")
        return self._output_bytes(output)


class CredentialVault:
    """Persist provider-specific DPAPI blobs without storing metadata or tokens."""

    _FILENAMES = {"runpod": "runpod.token.dpapi", "openai-chatgpt": "openai-chatgpt.connection.dpapi"}

    def __init__(self, root: Path | None = None, protector: object | None = None):
        local_app_data = Path(os.environ.get("LOCALAPPDATA", Path.home() / "AppData" / "Local"))
        self._root = root or local_app_data / "MarkellosEcosystem" / "AITrainingLab" / "credentials"
        self._protector = protector

    def _path(self, provider: str) -> Path:
        try:
            return self._root / self._FILENAMES[provider]
        except KeyError as error:
            raise CredentialVaultError("Unsupported personal provider credential.") from error

    def _dpapi(self) -> object:
        return self._protector or WindowsDpapi()

    def status(self, provider: str) -> dict:
        return {"provider": provider, "stored": self._path(provider).is_file(), "scope": "current-windows-user"}

    def store(self, provider: str, token: str) -> None:
        destination = self._path(provider)
        protected = self._dpapi().protect(token.encode("utf-8"))
        destination.parent.mkdir(parents=True, exist_ok=True)
        temporary = destination.with_suffix(".tmp")
        try:
            temporary.write_bytes(protected)
            os.replace(temporary, destination)
        except OSError as error:
            temporary.unlink(missing_ok=True)
            raise CredentialVaultError("The encrypted provider credential could not be saved locally.") from error

    def load(self, provider: str) -> str:
        source = self._path(provider)
        if not source.is_file():
            raise CredentialVaultError("No provider credential is stored for this Windows user.")
        try:
            return self._dpapi().unprotect(source.read_bytes()).decode("utf-8")
        except (OSError, UnicodeDecodeError, CredentialVaultError) as error:
            raise CredentialVaultError("The stored provider credential is unavailable.") from error

    def remove(self, provider: str) -> bool:
        target = self._path(provider)
        existed = target.is_file()
        try:
            target.unlink(missing_ok=True)
        except OSError as error:
            raise CredentialVaultError("The stored provider credential could not be removed.") from error
        return existed
