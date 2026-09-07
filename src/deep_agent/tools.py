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


def load_mcp_config() -> MCPConfig:
    if not CONFIG_PATH.exists():
        return MCPConfig(mcpServers={})
    data = json.loads(CONFIG_PATH.read_text())
    return MCPConfig.model_validate(data)


async def get_mcp_tools() -> list[BaseTool]:
    config = load_mcp_config()
    if not config.mcpServers:
        return []
    async with MCPAdapter(config) as adapter:
        tools = await adapter.list_tools()
        logger.info("Loaded %d MCP tools: %s", len(tools), [t.name for t in tools])
        return tools
