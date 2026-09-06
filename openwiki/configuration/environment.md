---
type: configuration
title: Configuration & Environment
description: Environment variables, API keys, and runtime configuration — model providers, LangSmith tracing, and sandbox settings.
tags: [configuration, environment, api-keys, models]
verified:
  - by: openwiki/0.5.0
    at: 2026-09-06T06:03:50.304Z
sources:
  - id: openwiki-source-5f5b95b3d6a215fa02ceb945
    resource: repo://.env.example
  - id: openwiki-source-9a767df0c13e1dad1416d3b9
    resource: repo://src/deep_agent/graph.py
generated: { by: "opencode", at: "2026-09-06T06:03:50.304Z" }
---

# Configuration & Environment

Configuration is managed through environment variables. The canonical reference is `.env.example` at the repository root.

## Environment Variables

### Model Configuration

| Variable | Default | Purpose |
|----------|---------|---------|
| `DEEP_AGENT_MODEL` | `nvidia:nemotron-3-super-120b-a12b` | Model to use for the agent |

### API Keys

| Variable | Required For | Purpose |
|----------|-------------|---------|
| `NVIDIA_API_KEY` | NVIDIA models | Authentication for build.nvidia.com |
| `ANTHROPIC_API_KEY` | Anthropic models + integration tests | Authentication for Claude models |
| `LANGSMITH_API_KEY` | Tracing + sandbox + deployment | LangSmith account access |

### Sandbox Settings

| Variable | Default | Purpose |
|----------|---------|---------|
| `SANDBOX_TEMPLATE_NAME` | `deep-agent` | LangSmith sandbox template name |
| `SANDBOX_TEMPLATE_IMAGE` | `python:3` | Docker image for the sandbox template |

### Frontend Settings

| Variable | Default | Purpose |
|----------|---------|---------|
| `LANGGRAPH_DEPLOYMENT_URL` | `http://localhost:8123` | LangGraph server URL for CopilotKit runtime |

## Supported Model Providers

The agent uses the `langchain-nvidia-ai-endpoints` package and supports:

- **NVIDIA**: `nvidia:nemotron-3-super-120b-a12b` (default), `nvidia:nemotron-3-ultra-550b-a55b`
- **Anthropic**: `anthropic:claude-sonnet-4-6`
- **OpenAI**: `openai:gpt-4o`

Model selection is done via `DEEP_AGENT_MODEL` using the `provider:model-name` format.

## Setup

```bash
cp .env.example .env
# Edit .env with your API keys
```

For local development, only `NVIDIA_API_KEY` (or an alternative provider key) is required. `LANGSMITH_API_KEY` is optional but recommended for tracing and required for deployment.
