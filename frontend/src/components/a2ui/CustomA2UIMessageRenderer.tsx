"use client"

import * as React from "react"
import type { z } from "zod"
import {
  MCPAppsActivityRenderer,
  MCPAppsActivityType,
  MCPAppsActivityContentSchema,
} from "@copilotkit/react-core/v2"
import type { ReactActivityMessageRenderer } from "@copilotkit/react-core/v2"
import type { AbstractAgent } from "@ag-ui/client"
import { useWindowManager } from "@/components/window-manager"
import type { WindowContentProps } from "@/components/window-manager"

type MCPAppsContent = z.infer<typeof MCPAppsActivityContentSchema>

const mcpAppsDataStore = new Map<string, {
  content: MCPAppsContent
  message: Record<string, unknown>
  agent: AbstractAgent | undefined
}>()

function MCPAppsWindowContent({ windowId }: WindowContentProps) {
  const data = mcpAppsDataStore.get(windowId)

  if (!data) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <span className="text-sm text-muted-foreground">Loading MCP App...</span>
      </div>
    )
  }

  return (
    <div className="flex h-full overflow-auto">
      <MCPAppsActivityRenderer
        activityType={MCPAppsActivityType}
        content={data.content}
        message={data.message}
        agent={data.agent}
      />
    </div>
  )
}

const MCPAppsFloatingRenderer: React.FC<{
  content: MCPAppsContent
  message: Record<string, unknown>
  agent: AbstractAgent | undefined
}> = ({ content, message, agent }) => {
  const { registerWindow, openWindow, windows } = useWindowManager()
  const surfaceId = `mcp-apps-${String((message as { id?: string }).id ?? "unknown")}`

  React.useEffect(() => {
    mcpAppsDataStore.set(surfaceId, { content, message, agent })

    if (!windows.has(surfaceId)) {
      registerWindow({
        id: surfaceId,
        title: content?.serverId || "MCP App",
        component: MCPAppsWindowContent,
      })
    }
    openWindow(surfaceId)
  }, [surfaceId, content, message, agent, registerWindow, openWindow, windows])

  return (
    <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
      <div className="size-4 rounded-full bg-primary/20" />
      <span className="text-sm text-muted-foreground">
        {content?.serverId || "MCP App"}
      </span>
    </div>
  )
}

export const CustomA2UIMessageRenderer: ReactActivityMessageRenderer<MCPAppsContent>[] = [
  {
    activityType: MCPAppsActivityType,
    content: MCPAppsActivityContentSchema,
    render: MCPAppsFloatingRenderer as ReactActivityMessageRenderer<MCPAppsContent>["render"],
  },
]

export default CustomA2UIMessageRenderer
