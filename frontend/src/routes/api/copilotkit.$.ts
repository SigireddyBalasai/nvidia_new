import { createFileRoute } from "@tanstack/react-router"
import {
  CopilotRuntime,
  createCopilotRuntimeHandler,
  InMemoryAgentRunner,
} from "@copilotkit/runtime/v2"
import { LangGraphAgent } from "@copilotkit/runtime/langgraph"

const LANGGRAPH_DEPLOYMENT_URL =
  process.env.LANGGRAPH_DEPLOYMENT_URL || "http://localhost:36007"
const LANGSMITH_API_KEY = process.env.LANGSMITH_API_KEY || ""

const langGraphAgent = new LangGraphAgent({
  deploymentUrl: LANGGRAPH_DEPLOYMENT_URL,
  langsmithApiKey: LANGSMITH_API_KEY,
  graphId: "agent",
})

const runtime = new CopilotRuntime({
  agents: {
    default: langGraphAgent,
  },
  runner: new InMemoryAgentRunner(),
  mcpApps: {
    servers: [
      {
        type: "http",
        url: "https://mcp.excalidraw.com",
        serverId: "excalidraw",
      },
    ],
  },
})

const handler = createCopilotRuntimeHandler({
  runtime,
  basePath: "/api/copilotkit",
})

export const Route = createFileRoute("/api/copilotkit/$")({
  server: {
    handlers: {
      GET: async ({ request }) => handler(request),
      POST: async ({ request }) => handler(request),
    },
  },
})
