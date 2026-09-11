import { createFileRoute, Navigate } from "@tanstack/react-router"
import { useEffect } from "react"
import { useStore } from "@/lib/store"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { ChatPanel } from "@/components/chat-panel"
import { InsightsPanel } from "@/components/insights-panel"
import { DataForgeChartTools } from "@/components/dataforge-charts"
import {
  BarChartTool,
  PieChartTool,
  LineChartTool,
  TableTool,
} from "@/components/copilot-tools"
import { useLangGraphThreads } from "@/lib/langgraph-threads"

export const Route = createFileRoute("/thread/$threadId")({
  component: ThreadView,
})

function ThreadView() {
  const { threadId } = Route.useParams()
  const sidebarOpen = useStore((s) => s.sidebarOpen)
  const isAuthenticated = useStore((s) => s.isAuthenticated)
  const setCurrentSessionId = useStore((s) => s.setCurrentSessionId)
  const panelLayout = useStore((s) => s.panelLayout)
  const setPanelLayout = useStore((s) => s.setPanelLayout)
  const { threads, isLoading } = useLangGraphThreads()

  // Update current session when threadId changes
  useEffect(() => {
    if (threadId) {
      setCurrentSessionId(threadId)
    }
  }, [threadId, setCurrentSessionId])

  // Global Escape key listener to exit full screen mode back to split
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && panelLayout !== "split") {
        setPanelLayout("split")
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [panelLayout, setPanelLayout])

  // Check if thread exists (wait for loading to complete)
  const threadExists = threads.some((t) => t.id === threadId)

  // Redirect to home if not authenticated or thread doesn't exist
  if (!isAuthenticated) {
    return <Navigate to="/" />
  }

  // Only redirect if we've finished loading, there are other threads, and this one genuinely doesn't exist
  if (!isLoading && threads.length > 0 && !threadExists) {
    return <Navigate to="/" />
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      <DataForgeChartTools />
      <BarChartTool />
      <PieChartTool />
      <LineChartTool />
      <TableTool />
      <Header />
      <div className="flex flex-1 overflow-hidden">
        {sidebarOpen && panelLayout === "split" && <Sidebar />}
        <main className="flex flex-1 overflow-hidden">
          {panelLayout !== "visuals" && (
            <ChatPanel isFullscreen={panelLayout === "chat"} />
          )}
          {panelLayout !== "chat" && (
            <InsightsPanel isFullscreen={panelLayout === "visuals"} />
          )}
        </main>
      </div>
    </div>
  )
}
