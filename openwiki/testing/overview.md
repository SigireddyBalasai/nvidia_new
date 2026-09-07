---
type: testing
title: Testing Strategy
description: How tests are organized — unit tests for graph configuration, integration tests for agent smoke tests, and the anyio backend.
tags: [testing, pytest, unit-tests, integration-tests]
verified:
  - by: openwiki/0.5.0
    at: 2026-09-07T00:23:46.719Z
sources:
  - id: openwiki-source-f0a6e7dc03522b2682f88655
    resource: repo://tests/conftest.py
  - id: openwiki-source-7648625b43d22937e7bd70f6
    resource: repo://tests/integration_tests/test_graph.py
  - id: openwiki-source-b7d1d49204e224b034e7f7b0
    resource: repo://tests/unit_tests/test_configuration.py
generated: { by: "opencode", at: "2026-09-06T06:03:50.304Z" }
---

# Testing Strategy

Tests are organized into unit tests and integration tests, run via pytest with the anyio async backend.

## Test Structure

```
tests/
├── conftest.py                     # Session-scoped anyio backend fixture
├── unit_tests/
│   ├── __init__.py
│   └── test_configuration.py       # Graph configuration assertions
└── integration_tests/
    ├── __init__.py
    └── test_graph.py               # Agent smoke test
```

## conftest.py

Provides a session-scoped `anyio_backend` fixture returning `"asyncio"`, enabling async test functions across the test suite.

## Unit Tests

`tests/unit_tests/test_configuration.py` validates static configuration:

| Test | Assertion |
|------|-----------|
| `test_graph_compiles` | The graph is an instance of `Pregel` (LangGraph's runtime class) |
| `test_subagents_configured` | SUBAGENTS contains exactly `{"researcher", "critic"}` |
| `test_system_prompt_is_nonempty` | SYSTEM_PROMPT is non-empty after stripping whitespace |

These tests run without API keys and verify the graph is properly constructed.

## Integration Tests

`tests/integration_tests/test_graph.py` performs a smoke test against the actual agent:

- **Skip condition**: Skipped unless `ANTHROPIC_API_KEY` is set
- **Test**: Invokes the graph with a simple "Say hello in one sentence" message
- **Assertions**: Result is not None and contains a `messages` key

Uses `pytest.mark.anyio` for async execution.

## Running Tests

```bash
# Unit tests (no API keys needed)
make test

# Integration tests (requires ANTHROPIC_API_KEY)
make integration-tests
```

Both commands use `uv run` to execute within the project's virtual environment.
