import asyncio

import pytest
from langgraph.pregel import Pregel

from deep_agent.graph import SUBAGENTS, SYSTEM_PROMPT, _get_ro_agent


def test_graph_compiles() -> None:
    """The lazy-built agent must be a compiled Pregel graph."""
    agent = asyncio.run(_get_ro_agent())
    assert isinstance(agent, Pregel)


def test_subagents_configured() -> None:
    names = {item["name"] for item in SUBAGENTS}
    assert names == {"researcher", "critic"}


def test_system_prompt_is_nonempty() -> None:
    assert len(SYSTEM_PROMPT.strip()) > 0
