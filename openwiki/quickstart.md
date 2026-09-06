---
type: guide
title: Quickstart Guide
description: Task-routing map for navigating the wiki; setup, development, and deployment entry points.
tags: [quickstart, setup, getting-started]
verified:
  - by: openwiki/0.5.0
    at: 2026-09-06T06:03:50.304Z
sources:
  - id: openwiki-source-5f5b95b3d6a215fa02ceb945
    resource: repo://.env.example
  - id: openwiki-source-012f2c78e3b1446dfc35803f
    resource: repo://Makefile
generated: { by: "opencode", at: "2026-09-06T06:03:50.304Z" }
---

# Quickstart Guide

## Prerequisites

- Python 3.11+
- [uv](https://docs.astral.sh/uv/) package manager
- An API key for your model provider (NVIDIA, Anthropic, or OpenAI)
- A [LangSmith](https://smith.langchain.com/) account (Plus plan+) for deployment

## Setup

```bash
# Clone and enter the repo
cd /home/balasai/tcs/nvidia_new

# Sync dependencies
uv sync

# Configure environment
cp .env.example .env
# Edit .env with your API keys
```

## Development

### Backend (Agent)

```bash
# Start LangGraph dev server (port 8123)
make serve

# Run unit tests
make test

# Run integration tests (requires ANTHROPIC_API_KEY)
make integration-tests

# Lint and format
make lint
make format
```

### Frontend (Chat UI)

```bash
cd frontend
bun install    # first time only
bun run dev    # starts on port 3000
```

## Deployment

```bash
# Deploy to LangSmith
uv run langgraph deploy

# Or push to GitHub and configure via LangSmith UI
```

## Wiki Navigation

| Topic | Page |
|-------|------|
| Agent architecture | [Agent Graph Architecture](/openwiki/architecture/agent-graph.md) |
| Remote execution | [LangSmith Sandbox Backend](/openwiki/architecture/sandbox-backend.md) |
| Frontend-backend bridge | [CopilotKit Integration](/openwiki/architecture/copilotkit-integration.md) |
| React chat UI | [Frontend Architecture](/openwiki/frontend/overview.md) |
| Environment variables | [Configuration & Environment](/openwiki/configuration/environment.md) |
| Deploy and CI/CD | [Deployment & DevOps](/openwiki/deployment/langgraph-deploy.md) |
| Test organization | [Testing Strategy](/openwiki/testing/overview.md) |
