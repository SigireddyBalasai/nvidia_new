---
type: architecture
title: CopilotKit Integration
description: How CopilotKit bridges the frontend chat UI to the LangGraph agent — runtime config, middleware, and API route.
tags: [copilotkit, integration, frontend, api]
sources:
  - id: openwiki-source-8935a2e27b970adbe227da7a
    resource: repo://frontend/src/routes/__root.tsx
  - id: openwiki-source-012170de0418874a05fbb173
    resource: repo://frontend/src/routes/api/copilotkit.%24.ts
  - id: openwiki-source-9a767df0c13e1dad1416d3b9
    resource: repo://src/deep_agent/graph.py
generated: { by: "opencode", at: "2026-09-07T00:23:46.719Z" }
verified:
  - by: openwiki/0.5.0
    at: 2026-09-07T00:23:46.719Z
---

# CopilotKit Integration

CopilotKit provides the bridge between the React frontend and the LangGraph agent backend. It handles chat state management, streaming responses, and runtime communication.

## Agent-Side Middleware

In `src/deep_agent/graph.py`, `CopilotKitMiddleware` from `copilotkit` is added to the agent's middleware stack:

```python
middleware = [CopilotKitMiddleware()]
```

This middleware enables CopilotKit's protocol for state synchronization, tool call handling, and interrupt management between the agent and the frontend.

## Frontend Runtime API

The API route at `frontend/src/routes/api/copilotkit.$.ts` sets up the server-side CopilotKit runtime using CopilotKit v2:

1. **CopilotRuntime** is instantiated with a `LangGraphAgent` configured to connect to the LangGraph deployment URL (`LANGGRAPH_DEPLOYMENT_URL`, defaulting to `http://localhost:36007`)
2. The agent uses `graphId: "agent"` to match the graph registered in `langgraph.json`
3. Authentication uses `LANGSMITH_API_KEY` for LangSmith connectivity
4. An MCP server for Excalidraw (`https://mcp.excalidraw.com`) is registered under `mcpApps`
5. `InMemoryAgentRunner` handles agent execution in-process

The route handles both GET and POST requests via `createCopilotRuntimeHandler`.

## Root Layout Integration

In `frontend/src/routes/__root.tsx`, the entire app is wrapped in `<CopilotKit>` with `runtimeUrl="/api/copilotkit"` and `a2ui` theme configuration. This:

- Provides CopilotKit context to all child components
- Enables `<CopilotChat />` in the index route to connect to the agent
- Loads CopilotKit's v2 CSS styles

## Data Flow

```
User types message
  → CopilotChat (frontend)
    → POST /api/copilotkit/*
      → CopilotRuntime → LangGraphAgent
        → LangGraph deployment (port 36007)
          → deep_agent graph execution
        ← streamed response chunks
      ← CopilotKit protocol
    ← React state update
  ← UI renders response
```
