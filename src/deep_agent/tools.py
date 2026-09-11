"""Load MCP server tools from .mcp.json."""

from __future__ import annotations

import json
import logging
from pathlib import Path

from fastmcp.mcp_config import MCPConfig
from langchain.mcp import MCPAdapter
from langchain_core.tools import BaseTool

logger = logging.getLogger(__name__)

CONFIG_PATH = Path(__file__).resolve().parents[2] / ".mcp.json"

# Module-level persistent adapter so the MCP transport stays alive
# for the lifetime of the process (tools hold references to the session).
_adapter: MCPAdapter | None = None


def load_mcp_config() -> MCPConfig:
    if not CONFIG_PATH.exists():
        return MCPConfig(mcpServers={})
    data = json.loads(CONFIG_PATH.read_text())
    return MCPConfig.model_validate(data)


async def get_mcp_tools() -> list[BaseTool]:
    """Return MCP tools, keeping the adapter alive for the process lifetime.

    The adapter (and its underlying MCP transport sessions) must remain open
    as long as the returned tools are in use.  Creating a new adapter per call
    and closing it immediately renders the tool objects non-functional.
    """
    global _adapter  # noqa: PLW0603

    config = load_mcp_config()
    if not config.mcpServers:
        return []

    if _adapter is None:
        _adapter = MCPAdapter(config)
        await _adapter.__aenter__()

    tools: list[BaseTool] = await _adapter.list_tools()
    logger.info("Loaded %d MCP tools: %s", len(tools), [t.name for t in tools])
    return tools
