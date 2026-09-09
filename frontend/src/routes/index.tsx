import { createFileRoute } from "@tanstack/react-router"
import { useEffect } from "react"
import { useStore } from "@/lib/store"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { ChatPanel } from "@/components/chat-panel"
import { InsightsPanel } from "@/components/insights-panel"
import { StarterPage } from "@/components/starter-page"

export const Route = createFileRoute("/")({ component: App })

function App() {
  const sidebarOpen = useStore((s) => s.sidebarOpen)
  const isAuthenticated = useStore((s) => s.isAuthenticated)
  const logout = useStore((s) => s.logout)
  const panelLayout = useStore((s) => s.panelLayout)
  const setPanelLayout = useStore((s) => s.setPanelLayout)

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

  // Synchronize browser history and handle browser back button
  useEffect(() => {
    if (typeof window === "undefined") return

    if (!isAuthenticated) {
      if (window.location.hash === "#workspace") {
        window.history.replaceState({ view: "starter" }, "", "/")
      } else if (!window.history.state || window.history.state.view !== "starter") {
        window.history.replaceState({ view: "starter" }, "", "/")
      }
    }

    const handlePopState = (e: PopStateEvent) => {
      if (isAuthenticated) {
        if (!e.state || e.state.view !== "workspace" || window.location.hash !== "#workspace") {
          logout()
          window.history.replaceState({ view: "starter" }, "", "/")
        }
      } else {
        if (window.location.hash) {
          window.history.replaceState({ view: "starter" }, "", "/")
        }
      }
    }

    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [isAuthenticated, logout])

  if (!isAuthenticated) {
    return <StarterPage />
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        {sidebarOpen && panelLayout === "split" && <Sidebar />}
        <main className="flex flex-1 overflow-hidden">
          {panelLayout !== "visuals" && <ChatPanel isFullscreen={panelLayout === "chat"} />}
          {panelLayout !== "chat" && <InsightsPanel isFullscreen={panelLayout === "visuals"} />}
        </main>
      </div>
    </div>
  )
}