---
type: operations
title: Deployment & DevOps
description: How to deploy the agent to LangGraph and run locally — langgraph.json config, CLI commands, and GitHub Actions.
tags: [deployment, langgraph, devops, ci-cd]
verified:
  - by: openwiki/0.5.0
    at: 2026-09-07T00:23:46.719Z
sources:
  - id: openwiki-source-5f5b95b3d6a215fa02ceb945
    resource: repo://.env.example
  - id: openwiki-source-6d4b4e707b8d60b6ccfa3425
    resource: repo://.github/workflows/openwiki-update.yml
  - id: openwiki-source-5bbba7b2a8ea8360ff233d63
    resource: repo://langgraph.json
  - id: openwiki-source-012f2c78e3b1446dfc35803f
    resource: repo://Makefile
  - id: openwiki-source-05ccef8d4cf1698187f20464
    resource: repo://pyproject.toml
generated: { by: "opencode", at: "2026-09-07T00:23:46.719Z" }
---

# Deployment & DevOps

## Local Development

### LangGraph Dev Server

```bash
uv run langgraph dev
```

Starts a local LangGraph development server (default port 36007) that serves the agent graph for testing.

### Frontend Dev Server

```bash
cd frontend && bun run dev
```

Starts the TanStack Start frontend on port 3000 with Vite HMR.

## LangGraph Configuration

`langgraph.json` configures the LangGraph deployment:

| Field | Value | Purpose |
|-------|-------|---------|
| `graphs.agent` | `deep_agent.graph:get_agent` | Maps the graph name to its entrypoint |
| `dependencies` | `["."]` | Includes the root package as a dependency |
| `image_distro` | `wolfi` | Container base image distribution |
| `env` | `.env` | Environment file for the deployment |

## Makefile Targets

| Target | Command | Purpose |
|--------|---------|---------|
| `install` | `uv sync --no-dev` | Sync runtime dependencies |
| `dev` | `uv sync` | Sync project + dev dependencies |
| `serve` | `uv run langgraph dev` | Start local dev server |
| `test` | `uv run python -m pytest tests/unit_tests -q` | Run unit tests |
| `integration-tests` | `uv run python -m pytest tests/integration_tests -q` | Run integration tests |
| `lint` | `uv run python -m ruff check src tests` | Ruff lint checks |
| `format` | `uv run python -m ruff format src tests` | Ruff auto-format |

## Deployment to LangGraph

```bash
uv run langgraph deploy
```

Requires a LangSmith account (Plus plan or higher). Alternatively, push to GitHub and configure deployment through the LangGraph UI for CI-based deployments.

## GitHub Actions — OpenWiki Workflow

The `.github/workflows/openwiki-update.yml` runs daily at 08:00 UTC (and on manual dispatch):

1. Checks out the repo with full history (`fetch-depth: 0`)
2. Installs OpenWiki (`openwiki@0.5.0`) with mermaid + jsdom
3. Runs `openwiki code --update --print`
4. Creates a pull request with any documentation changes

### Required Secrets

| Secret | Purpose |
|--------|---------|
| `OPENAI_API_KEY` | OpenWiki LLM provider |
| `OPENWIKI_LANGSMITH_API_KEY` | LangSmith connector for code-mode pull |
| `LANGSMITH_API_KEY` | Optional: trace the OpenWiki workflow itself |

## Package Management

The project uses `uv` for Python dependency management with `pyproject.toml` and `uv.lock`. The frontend uses `bun` with `bun.lock`.
