import os

import pytest

from deep_agent.graph import _get_ro_agent

pytestmark = pytest.mark.anyio

if not os.getenv("NVIDIA_API_KEY"):
    pytest.skip(
        "Set NVIDIA_API_KEY to run integration tests.", allow_module_level=True
    )


async def test_deep_agent_smoke() -> None:
    graph = await _get_ro_agent()
    result = await graph.ainvoke(
        {
            "messages": [
                {
                    "role": "user",
                    "content": "Say hello in one sentence.",
                }
            ]
        }
    )
    assert result is not None
    assert result.get("messages")
