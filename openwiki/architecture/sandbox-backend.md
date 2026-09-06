---
type: architecture
title: LangSmith Sandbox Backend
description: How remote code execution works via LangSmith sandboxes — lifecycle, caching, template management, and the async protocol.
tags: [sandbox, langsmith, backend, async]
verified:
  - by: openwiki/0.5.0
    at: 2026-09-06T06:03:50.304Z
sources:
  - id: openwiki-source-55fe7514816e4e5be28740fa
    resource: repo://src/deep_agent/sandbox.py
generated: { by: "opencode", at: "2026-09-06T06:03:50.304Z" }
---

# LangSmith Sandbox Backend

The sandbox backend enables the agent to execute code remotely via LangSmith's managed sandbox infrastructure. It is defined in `src/deep_agent/sandbox.py` and adapted from the open-swe project's LangSmith integration.

## LangSmithBackend Class

`LangSmithBackend` extends `BaseSandbox` from `deepagents.backends.protocol` and wraps an `AsyncSandbox` from the LangSmith SDK. It implements only async methods — sync variants raise `NotImplementedError` since the framework always calls async versions.

### Async Protocol Methods

| Method | Purpose |
|--------|---------|
| `aexecute(command, timeout?)` | Run a shell command, return output + exit code |
| `awrite(file_path, content)` | Write string content to a file in the sandbox |
| `adownload_files(paths)` | Read file contents from the sandbox |
| `aupload_files(files)` | Upload binary files to the sandbox |

Each method maps to the corresponding `AsyncSandbox` SDK call. The default command timeout is 300 seconds, configurable per call.

## Sandbox Lifecycle

### Creation

`get_or_create_sandbox(thread_id)` manages sandbox instances:

1. Checks an in-memory cache (`_backends` dict) for an existing sandbox for the given `thread_id`
2. If not cached: reads `LANGSMITH_API_KEY`, template name, and template image from environment
3. Creates an `AsyncSandboxClient` and ensures the template exists via `_ensure_template`
4. Creates a new sandbox with the template (180-second timeout)
5. Wraps it in `LangSmithBackend` and caches it

### Template Management

`_ensure_template(client, template_name, template_image)` creates the LangSmith sandbox template if it does not exist:

- Default template name: `deep-agent`
- Default template image: `python:3`
- Both configurable via `SANDBOX_TEMPLATE_NAME` and `SANDBOX_TEMPLATE_IMAGE` env vars

## Thread-to-Sandbox Binding

In `get_agent()`, the sandbox is bound per-thread:

```python
thread_id = config.get("configurable", {}).get("thread_id", "default")
backend = await get_or_create_sandbox(thread_id)
```

This ensures each conversation thread gets its own isolated execution environment, while reusing sandboxes within the same thread for session continuity.
