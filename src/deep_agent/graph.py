"""Deep Agent graph for deployment."""

from __future__ import annotations

import asyncio
import contextlib
import os
from datetime import UTC, datetime

from copilotkit import CopilotKitMiddleware
from deepagents import create_deep_agent
from langchain_core.runnables import RunnableConfig
from langchain_core.tools import BaseTool, tool
from langgraph.checkpoint.memory import MemorySaver
from langgraph_sdk.runtime import ServerRuntime

from deep_agent.sandbox import create_backend
from deep_agent.tools import get_mcp_tools

DEFAULT_MODEL = os.getenv("DEEP_AGENT_MODEL", "nvidia:nemotron-3-super-120b-a12b")

SYSTEM_PROMPT = """
You are a deep agent.

Workflow:
1. Write and maintain a todo list for non-trivial requests.
2. Delegate focused fact-finding to subagents when helpful.
3. Store intermediate drafts in files when the task is long.
4. Before finalizing, critique your work for risks, gaps, and missing constraints.
5. Return concise, actionable output.

- Prefer concrete evidence over assumptions.
- State unresolved uncertainty explicitly.
- Keep output compact unless the user asks for depth.
""".strip()


@tool
def utc_now() -> str:
    """Return the current UTC timestamp in ISO format."""
    return datetime.now(tz=UTC).isoformat()


SUBAGENTS = [
    {
        "name": "researcher",
        "description": "Use for evidence collection and source-grounded fact finding.",
        "system_prompt": (
            "You are a focused researcher. Gather evidence, list assumptions, and "
            "report contradictions clearly."
        ),
        "tools": [utc_now],
    },
    {
        "name": "critic",
        "description": "Use for adversarial review of drafts and plans.",
        "system_prompt": (
            "You are a critical reviewer. Find weak logic, untested assumptions, and "
            "missing constraints."
        ),
        "tools": [utc_now],
    },
]


async def _build_agent(backend=None):
    mcp_tools_list: list[BaseTool] = await get_mcp_tools()
    checkpointer = MemorySaver()
    return create_deep_agent(
        model=DEFAULT_MODEL,
        tools=[utc_now, *mcp_tools_list],
        backend=backend or create_backend,
        system_prompt=SYSTEM_PROMPT,
        subagents=SUBAGENTS,
        interrupt_on={"execute": True, "write_file": True},
        checkpointer=checkpointer,
        name="deep_agent",
        memory=["/memory/AGENTS.md"],
        middleware=[CopilotKitMiddleware()],
    )


# Lazy singleton: built on first use to avoid asyncio.run() at import time,
# which raises RuntimeError when the module is loaded inside an already-running
# event loop (e.g. LangGraph server startup).
_ro_agent = None
_ro_agent_lock = asyncio.Lock()


async def _get_ro_agent():
    global _ro_agent  # noqa: PLW0603
    async with _ro_agent_lock:
        if _ro_agent is None:
            _ro_agent = await _build_agent()
    return _ro_agent


# Public alias expected by tests and external importers.
# `graph` is set to None at import time and populated on first request.
# Tests should call `await _get_ro_agent()` or use the `get_agent` context manager.
graph = None  # populated lazily — see _get_ro_agent()


@contextlib.asynccontextmanager
async def get_agent(config: RunnableConfig, runtime: ServerRuntime):
    ert = runtime.execution_runtime
    if ert:
        try:
            agent = await _build_agent()
        except Exception:  # noqa: BLE001
            agent = await _get_ro_agent()
        yield agent
    else:
        yield await _get_ro_agent()
