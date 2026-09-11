"""OpenShell sandbox backend for deepagents.

Implements SandboxBackendProtocol backed by an OpenShell sandbox.
The OpenShell gateway is selected from the active cluster config
(~/.config/openshell/active_gateway) or OPENSHELL_GATEWAY env var.

Sandbox selection (controlled via env vars):
  OPENSHELL_SANDBOX_NAME  Connect to a pre-existing named sandbox.
                          Create one with: openshell sandbox create --name <name> --keep
  (not set)               Create a fresh sandbox for this run.

Gateway Setup (required for sandbox isolation):

  1. Install the OpenShell CLI:
     - Linux/macOS: curl -LsSf https://raw.githubusercontent.com/NVIDIA/OpenShell/main/install.sh | sh
     - Windows: Use WSL 2 or Docker Desktop

  2. Start the gateway (requires Docker or Podman running):
     openshell gateway start

  3. The gateway writes connection info to ~/.config/openshell/active_gateway.
     The Python SDK reads this automatically via SandboxClient.from_active_cluster().

  Alternative: Set OPENSHELL_GATEWAY env var to connect to a remote gateway:
     export OPENSHELL_GATEWAY=grpc://host:port

  If no gateway is available, the backend falls back to local filesystem
  execution (no sandbox isolation) for development/testing.

Usage:
  # With gateway (sandboxed):
  openshell gateway start  # in one terminal
  make serve               # in another terminal

  # Without gateway (local fallback):
  make serve               # runs with FilesystemBackend
"""

from __future__ import annotations

import asyncio
import base64
import logging
import os
import shlex
from typing import Any

from deepagents.backends import CompositeBackend, FilesystemBackend
from deepagents.backends.protocol import (
    ExecuteResponse,
    FileDownloadResponse,
    FileUploadResponse,
)
from deepagents.backends.sandbox import BaseSandbox
from openshell import SandboxClient, SandboxSession

SANDBOX_NAME_ENV = "OPENSHELL_SANDBOX_NAME"

logger = logging.getLogger(__name__)


class OpenShellBackend(BaseSandbox):
    """deepagents SandboxBackendProtocol backed by an OpenShell sandbox.

    Wraps a live SandboxSession. All file operations (read, write, edit,
    grep, glob, ls) are inherited from BaseSandbox and executed as shell
    commands via execute(). Only execute(), upload_files(), and
    download_files() need concrete implementations.

    All public methods are async-native: blocking SandboxSession calls are
    offloaded to a thread pool via asyncio.to_thread() to avoid blocking the
    event loop.
    """

    def __init__(
        self,
        session: SandboxSession,
        *,
        default_timeout: int = 30 * 60,
    ) -> None:
        self._session = session
        self._default_timeout = default_timeout

    @property
    def id(self) -> str:
        return self._session.id

    async def execute(
        self,
        command: str,
        *,
        timeout: int | None = None,
    ) -> ExecuteResponse:
        """Run a shell command in the OpenShell sandbox (non-blocking)."""
        effective_timeout = timeout if timeout is not None else self._default_timeout

        def _sync() -> ExecuteResponse:
            result = self._session.exec(
                ["bash", "-c", command],
                timeout_seconds=effective_timeout,
            )
            output = result.stdout
            if result.stderr:
                output = f"{output}\n{result.stderr}" if output else result.stderr
            return ExecuteResponse(
                output=output,
                exit_code=result.exit_code,
                truncated=False,
            )

        return await asyncio.to_thread(_sync)

    async def upload_files(
        self, files: list[tuple[str, bytes]]
    ) -> list[FileUploadResponse]:
        """Upload files to the sandbox by piping raw bytes over stdin (non-blocking)."""

        def _sync() -> list[FileUploadResponse]:
            responses: list[FileUploadResponse] = []
            for path, content in files:
                try:
                    parent = shlex.quote(os.path.dirname(path) or ".")
                    dest = shlex.quote(path)
                    result = self._session.exec(
                        ["bash", "-c", f"mkdir -p {parent} && cat > {dest}"],
                        stdin=content,
                    )
                    if result.exit_code != 0:
                        responses.append(
                            FileUploadResponse(path=path, error="permission_denied")
                        )
                    else:
                        responses.append(FileUploadResponse(path=path, error=None))
                except Exception:  # noqa: BLE001
                    responses.append(
                        FileUploadResponse(path=path, error="permission_denied")
                    )
            return responses

        return await asyncio.to_thread(_sync)

    async def download_files(
        self, paths: list[str]
    ) -> list[FileDownloadResponse]:
        """Download files from the sandbox via base64 encoding (non-blocking)."""

        def _sync() -> list[FileDownloadResponse]:
            responses: list[FileDownloadResponse] = []
            for path in paths:
                try:
                    result = self._session.exec(["base64", path])
                    if result.exit_code != 0:
                        responses.append(
                            FileDownloadResponse(
                                path=path, content=None, error="file_not_found"
                            )
                        )
                    else:
                        content = base64.b64decode(result.stdout.strip())
                        responses.append(
                            FileDownloadResponse(path=path, content=content, error=None)
                        )
                except Exception:  # noqa: BLE001
                    responses.append(
                        FileDownloadResponse(
                            path=path, content=None, error="file_not_found"
                        )
                    )
            return responses

        return await asyncio.to_thread(_sync)


async def create_backend(runtime: Any) -> CompositeBackend:
    """Backend factory: OpenShell sandbox + filesystem for memory/skills.

    Sandbox selection:
    - If OPENSHELL_SANDBOX_NAME is set: connect to that existing named sandbox.
      Pre-create one with: openshell sandbox create --name <name> --keep
    - Otherwise: create a fresh sandbox for this run and wait for it to be ready.

    The active OpenShell gateway is resolved from:
    1. OPENSHELL_GATEWAY env var
    2. ~/.config/openshell/active_gateway (set by: openshell gateway select <name>)

    If no gateway is configured, falls back to a local filesystem backend
    (no sandbox isolation) so the agent can still function for development.

    Memory and skills live on the local filesystem (FilesystemBackend) so
    changes persist across restarts and can be committed back to git.
    """
    try:
        client = await asyncio.to_thread(SandboxClient.from_active_cluster)

        sandbox_name = os.environ.get(SANDBOX_NAME_ENV)
        if sandbox_name:
            ref = await asyncio.to_thread(client.get, sandbox_name)
        else:
            ref = await asyncio.to_thread(client.create)
            ref = await asyncio.to_thread(client.wait_ready, ref.name)

        session = SandboxSession(client, ref)

        return CompositeBackend(
            default=OpenShellBackend(session),
            routes={
                "/memory/": FilesystemBackend(root_dir="./src", virtual_mode=True),
                "/skills/": FilesystemBackend(root_dir="./skills", virtual_mode=True),
            },
        )
    except Exception as e:  # noqa: BLE001
        logger.warning(
            "OpenShell gateway not available (%s), falling back to local backend",
            e,
        )
        return CompositeBackend(
            default=FilesystemBackend(root_dir=".", virtual_mode=False),
            routes={
                "/memory/": FilesystemBackend(root_dir="./src", virtual_mode=True),
                "/skills/": FilesystemBackend(root_dir="./skills", virtual_mode=True),
            },
        )
