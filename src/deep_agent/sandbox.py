"""Sandbox backend using local Podman containers via the Podman Python SDK."""

from __future__ import annotations

import asyncio
import io
import os
import tarfile
import uuid
import weakref
import logging

from deepagents.backends.protocol import (
    ExecuteResponse,
    FileDownloadResponse,
    FileUploadResponse,
    WriteResult,
)
from deepagents.backends.sandbox import BaseSandbox
from podman import PodmanClient

DEFAULT_CONTAINER_IMAGE = "python:3.11-slim"
DEFAULT_TIMEOUT = 300
DEFAULT_SOCKET_URL = "unix:///run/user/1000/podman/podman.sock"

_backends: dict[str, PodmanBackend] = {}

logger = logging.getLogger(__name__)


def _cleanup_container(client: PodmanClient, container) -> None:
    """Best-effort stop + remove a Podman container and close the client."""
    try:
        container.reload()
        if container.status == "running":
            container.stop(timeout=5)
    except Exception:  # noqa: BLE001,S110
        pass
    try:
        container.remove(force=True)
    except Exception:  # noqa: BLE001,S110
        pass
    try:
        client.close()
    except Exception:  # noqa: BLE001,S110
        pass


class PodmanBackend(BaseSandbox):
    """Local Podman container sandbox backend using the Podman Python SDK.

    Runs commands inside a Podman container via ``container.exec_run()``
    and transfers files via ``put_archive`` / ``get_archive``.

    The container is automatically stopped and removed when this object
    is garbage collected (via ``weakref.finalize``).
    """

    def __init__(
        self,
        client: PodmanClient,
        container,
        *,
        timeout: int = DEFAULT_TIMEOUT,
    ) -> None:
        self._client = client
        self._container = container
        self._default_timeout = timeout
        self._finalizer = weakref.finalize(self, _cleanup_container, client, container)

    def __del__(self) -> None:
        if self._finalizer.is_alive():
            self._finalizer()

    @property
    def id(self) -> str:
        return self._container.id

    def execute(self, command: str, *, timeout: int | None = None) -> ExecuteResponse:
        logger.debug("Executing command: %s", command)
        effective_timeout = timeout if timeout is not None else self._default_timeout

        exit_code, output = self._container.exec_run(
            ["sh", "-c", command],
            demux=True,
        )

        stdout_text = (output or b"").decode("utf-8", errors="replace")

        # output from demux=True is (stdout, stderr) when stderr is captured
        if isinstance(output, tuple):
            stderr_text = output[1] if len(output) > 1 else b""
        else:
            stderr_text = output or b""

        output_str = stdout_text
        if stderr_text:
            output_str = (
                f"{stdout_text}\n{stderr_text.decode('utf-8', errors='replace')}"
                if stdout_text
                else stderr_text.decode("utf-8", errors="replace")
            )

        logger.debug(
            "Command exit_code=%s output=%s",
            exit_code,
            output_str[:200] if output_str else "",
        )

        return ExecuteResponse(
            output=output_str,
            exit_code=exit_code or 0,
            truncated=False,
        )

    async def aexecute(
        self, command: str, *, timeout: int | None = None
    ) -> ExecuteResponse:
        effective_timeout = timeout if timeout is not None else self._default_timeout

        def _run():
            exit_code, output = self._container.exec_run(
                ["sh", "-c", command],
                demux=True,
            )
            return exit_code, output

        try:
            exit_code, (stdout, stderr) = await asyncio.wait_for(
                asyncio.to_thread(_run), effective_timeout
            )
        except TimeoutError:
            return ExecuteResponse(
                output=f"Command timed out after {effective_timeout}s",
                exit_code=124,
                truncated=False,
            )

        stdout_text = (stdout or b"").decode("utf-8", errors="replace")
        stderr_text = (stderr or b"").decode("utf-8", errors="replace")
        output = stdout_text
        if stderr_text:
            output = f"{output}\n{stderr_text}" if output else stderr_text

        return ExecuteResponse(
            output=output,
            exit_code=exit_code or 0,
            truncated=False,
        )

    async def awrite(self, file_path: str, content: str) -> WriteResult:
        try:
            file_dir = os.path.dirname(file_path) or "/"
            file_name = os.path.basename(file_path)

            # Build a tar archive in memory with the file
            buf = io.BytesIO()
            with tarfile.open(fileobj=buf, mode="w") as tar:
                data = content.encode("utf-8")
                info = tarfile.TarInfo(name=file_name)
                info.size = len(data)
                tar.addfile(info, io.BytesIO(data))
            buf.seek(0)

            def _put():
                # put_archive writes into the directory, so use the parent dir
                self._container.put_archive(file_dir, buf)

            await asyncio.to_thread(_put)
            return WriteResult(path=file_path, files_update=None)
        except Exception as e:  # noqa: BLE001
            return WriteResult(error=f"Failed to write file '{file_path}': {e}")

    async def adownload_files(self, paths: list[str]) -> list[FileDownloadResponse]:
        responses: list[FileDownloadResponse] = []
        for path in paths:
            try:

                def _get(p=path):
                    stream, _ = self._container.get_archive(p)
                    return b"".join(stream)

                tar_data = await asyncio.to_thread(_get)

                # Extract file content from tar
                buf = io.BytesIO(tar_data)
                with tarfile.open(fileobj=buf, mode="r") as tar:
                    members = tar.getmembers()
                    if members:
                        f = tar.extractfile(members[0])
                        content = f.read() if f else b""
                    else:
                        content = b""

                responses.append(
                    FileDownloadResponse(path=path, content=content, error=None)
                )
            except Exception as e:  # noqa: BLE001
                responses.append(
                    FileDownloadResponse(path=path, content=b"", error=str(e))
                )
        return responses

    async def aupload_files(
        self, files: list[tuple[str, bytes]]
    ) -> list[FileUploadResponse]:
        responses: list[FileUploadResponse] = []
        for path, content in files:
            try:
                file_dir = os.path.dirname(path) or "/"
                file_name = os.path.basename(path)

                buf = io.BytesIO()
                with tarfile.open(fileobj=buf, mode="w") as tar:
                    info = tarfile.TarInfo(name=file_name)
                    info.size = len(content)
                    tar.addfile(info, io.BytesIO(content))
                buf.seek(0)

                def _put(d=file_dir, b=buf):
                    self._container.put_archive(d, b)

                await asyncio.to_thread(_put)
                responses.append(FileUploadResponse(path=path, error=None))
            except Exception as e:  # noqa: BLE001
                responses.append(FileUploadResponse(path=path, error=str(e)))
        return responses

    def write(self, file_path: str, content: str) -> WriteResult:
        try:
            file_dir = os.path.dirname(file_path) or "/"
            file_name = os.path.basename(file_path)

            # Build a tar archive in memory with the file
            buf = io.BytesIO()
            with tarfile.open(fileobj=buf, mode="w") as tar:
                data = content.encode("utf-8")
                info = tarfile.TarInfo(name=file_name)
                info.size = len(data)
                tar.addfile(info, io.BytesIO(data))
            buf.seek(0)

            def _put():
                # put_archive writes into the directory, so use the parent dir
                self._container.put_archive(file_dir, buf)

            self._container.put_archive(file_dir, buf)
            return WriteResult(path=file_path, files_update=None)
        except Exception as e:  # noqa: BLE001
            logger.error("Failed to write file '%s': %s", file_path, e)
            return WriteResult(error=f"Failed to write file '{file_path}': {e}")

    def download_files(self, paths: list[str]) -> list[FileDownloadResponse]:
        responses: list[FileDownloadResponse] = []
        for path in paths:
            try:
                stream, _ = self._container.get_archive(path)
                tar_data = b"".join(stream)

                # Extract file content from tar
                buf = io.BytesIO(tar_data)
                with tarfile.open(fileobj=buf, mode="r") as tar:
                    members = tar.getmembers()
                    if members:
                        f = tar.extractfile(members[0])
                        content = f.read() if f else b""
                    else:
                        content = b""

                responses.append(
                    FileDownloadResponse(path=path, content=content, error=None)
                )
            except Exception as e:  # noqa: BLE001
                logger.error("Failed to download file '%s': %s", path, e)
                responses.append(
                    FileDownloadResponse(path=path, content=b"", error=str(e))
                )
        return responses

    def upload_files(self, files: list[tuple[str, bytes]]) -> list[FileUploadResponse]:
        responses: list[FileUploadResponse] = []
        for path, content in files:
            try:
                file_dir = os.path.dirname(path) or "/"
                file_name = os.path.basename(path)

                buf = io.BytesIO()
                with tarfile.open(fileobj=buf, mode="w") as tar:
                    info = tarfile.TarInfo(name=file_name)
                    info.size = len(content)
                    tar.addfile(info, io.BytesIO(content))
                buf.seek(0)

                self._container.put_archive(file_dir, buf)
                responses.append(FileUploadResponse(path=path, error=None))
            except Exception as e:  # noqa: BLE001
                logger.error("Failed to upload file '%s': %s", path, e)
                responses.append(FileUploadResponse(path=path, error=str(e)))
        return responses


async def _start_container(client: PodmanClient, image: str):
    """Create and start a Podman container, returning the container object."""
    name = f"deep-agent-{uuid.uuid4().hex[:8]}"

    def _create():
        # Pull image if not available locally
        try:
            client.images.get(image)
        except Exception:  # noqa: BLE001
            client.images.pull(image)
        container = client.containers.create(
            image,
            command=["sleep", "infinity"],
            name=name,
        )
        container.start()
        return container

    return await asyncio.to_thread(_create)


async def get_or_create_sandbox(thread_id: str) -> PodmanBackend:
    """Get a cached sandbox for this thread, or create a new one."""
    if backend := _backends.get(thread_id):
        return backend

    socket_url = os.environ.get("PODMAN_SOCKET_URL", DEFAULT_SOCKET_URL)
    image = os.environ.get("SANDBOX_TEMPLATE_IMAGE", DEFAULT_CONTAINER_IMAGE)

    client = PodmanClient(base_url=socket_url)
    container = await _start_container(client, image)
    backend = PodmanBackend(client, container)
    _backends[thread_id] = backend
    return backend


async def cleanup_sandbox(thread_id: str) -> None:
    """Explicitly stop and remove the sandbox for a thread.

    Safe to call even if thread_id is not cached.
    """
    backend = _backends.pop(thread_id, None)
    if backend is not None:
        backend._finalizer()
