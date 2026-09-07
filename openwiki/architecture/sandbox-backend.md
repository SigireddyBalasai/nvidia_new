---
type: architecture
title: Podman Sandbox Backend
description: How code execution works via Podman containers — lifecycle, caching, file transfer, and the sync/async protocol.
tags: [sandbox, podman, backend, async, sync]
sources:
  - id: openwiki-source-55fe7514816e4e5be28740fa
    resource: repo://src/deep_agent/sandbox.py
generated: { by: "opencode", at: "2026-09-07T00:23:46.719Z" }
verified:
  - by: openwiki/0.5.0
    at: 2026-09-07T00:23:46.719Z
---

# Podman Sandbox Backend

The sandbox backend enables the agent to execute code inside a local Podman container. It is defined in `src/deep_agent/sandbox.py` and wraps a Podman container via the Podman Python SDK.

## PodmanBackend Class

`PodmanBackend` extends `BaseSandbox` from `deepagents.backends.protocol` and wraps a Podman container via the Podman Python SDK. It executes commands via `container.exec_run()` and transfers files via `put_archive` / `get_archive`.

The container is automatically stopped and removed when this object is garbage collected (via `weakref.finalize`).

### Sync Protocol Methods

| Method | Purpose |
|--------|---------|
| `execute(command, timeout?)` | Run a shell command, return output + exit code |
| `write(file_path, content)` | Write string content to a file in the sandbox |
| `download_files(paths)` | Read file contents from the sandbox |
| `upload_files(files)` | Upload binary files to the sandbox |

### Async Protocol Methods

| Method | Purpose |
|--------|---------|
| `aexecute(command, timeout?)` | Run a shell command asynchronously, return output + exit code |
| `awrite(file_path, content)` | Write string content to a file asynchronously |
| `adownload_files(paths)` | Read file contents from the sandbox asynchronously |
| `aupload_files(files)` | Upload binary files to the sandbox asynchronously |

The default command timeout is 300 seconds, configurable per call.

## Container Lifecycle

### Creation

`get_or_create_sandbox(thread_id)` manages sandbox instances:

1. Checks an in-memory cache (`_backends` dict) for an existing sandbox for the given `thread_id`
2. If not cached: reads `PODMAN_SOCKET_URL` and `SANDBOX_TEMPLATE_IMAGE` from environment
3. Creates a `PodmanClient` connected to the default socket `unix:///run/user/1000/podman/podman.sock`
4. Creates a new Podman container using the `python:3.11-slim` image with `sleep infinity` command
5. Wraps it in `PodmanBackend` and caches it

### Cleanup

The container lifecycle includes automatic cleanup via `weakref.finalize` on garbage collection, and explicit cleanup via `cleanup_sandbox(thread_id)`.

## File Transfer

File operations use tar archives over the Podman socket:

- **Write**: Creates an in-memory tar archive from the file content and calls `container.put_archive()` to write it into the container
- **Download**: Calls `container.get_archive()` to retrieve a tar stream, extracts the file content from the archive
- **Upload**: Creates an in-memory tar archive from the file content and calls `container.put_archive()`

## Thread-to-Sandbox Binding

In `get_agent()`, the sandbox is bound per-thread:

```python
thread_id = config.get("configurable", {}).get("thread_id", "default")
backend = await get_or_create_sandbox(thread_id)
```

This ensures each conversation thread gets its own isolated execution environment, while reusing sandboxes within the same thread for session continuity.

## Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `PODMAN_SOCKET_URL` | `unix:///run/user/1000/podman/podman.sock` | Podman socket connection URL |
| `SANDBOX_TEMPLATE_IMAGE` | `python:3.11-slim` | Docker image for the sandbox container |
