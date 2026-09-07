---
type: architecture
title: Agent Graph Architecture
description: How the deep agent graph is built, configured, and invoked — model selection, system prompt, subagents, tools, and interrupt behavior.
tags: [agent-graph, langgraph, deepagents, subagents]
sources:
  - id: openwiki-source-9a767df0c13e1dad1416d3b9
    resource: repo://src/deep_agent/graph.py
generated: { by: "opencode", at: "2026-09-07T00:23:46.719Z" }
verified:
  - by: openwiki/0.5.0
    at: 2026-09-07T00:23:46.719Z
---

# Agent Graph Architecture

The core of this template is a LangGraph agent constructed via `create_deep_agent()` from the `deepagents` library. The graph is defined in `src/deep_agent/graph.py` and exposed as a LangGraph deployment entrypoint.

## Graph Construction

`_build_agent(backend=None)` assembles the agent with:

- **Model**: defaults to `nvidia:nemotron-3-super-120b-a12b`, overridable via `DEEP_AGENT_MODEL` env var
- **Tools**: a single built-in `utc_now` tool returning the current UTC ISO timestamp
- **System prompt**: instructs the agent to plan with todo lists, delegate to subagents, store drafts, critique output, and return concise results
- **Subagents**: two predefined — `researcher` for evidence gathering and `critic` for adversarial review
- **Interrupts**: enabled on `execute` and `write_file` actions for human-in-the-loop control
- **Middleware**: `CopilotKitMiddleware` from `copilotkit` enables frontend integration

Two agent instances exist:

1. `RO_AGENT` — a read-only agent without a sandbox backend, used when no execution runtime is available
2. A per-request agent — created in `get_agent()` with a PodmanBackend sandbox when an execution runtime is present

## Subagents

| Name | Purpose | Tools |
|------|---------|-------|
| `researcher` | Evidence collection, source-grounded fact finding | `utc_now` |
| `critic` | Adversarial review of drafts and plans | `utc_now` |

Both subagents receive focused system prompts emphasizing their specific role (contradiction detection for researcher, weak logic finding for critic).

## Agent Retrieval (`get_agent`)

`get_agent(config, runtime)` is an async context manager that:

1. Checks if the runtime provides an execution runtime (`ert`)
2. If present: extracts `thread_id` from config, creates or retrieves a cached `PodmanBackend` sandbox, builds an agent with that backend
3. If absent: yields the read-only `RO_AGENT` without sandbox capabilities

This two-tier design enables local development without sandbox overhead while supporting remote execution in production.

## Entry Point

`langgraph.json` registers the graph as:

```json
{ "graphs": { "agent": "deep_agent.graph:get_agent" } }
```

The `get_agent` async context manager is the LangGraph-compatible entrypoint, allowing runtime-dependent sandbox binding per request.
