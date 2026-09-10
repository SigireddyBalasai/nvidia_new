import { createFileRoute, Navigate } from "@tanstack/react-router"
import { useEffect } from "react"
import { useStore } from "@/lib/store"
import { StarterPage } from "@/components/starter-page"

export const Route = createFileRoute("/")({ component: App })

function App() {
  const isAuthenticated = useStore((s) => s.isAuthenticated)
  const lastActiveThreadId = useStore((s) => s.lastActiveThreadId)
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

  // Redirect to last active thread if exists
  if (lastActiveThreadId) {
    return <Navigate to="/thread/$threadId" params={{ threadId: lastActiveThreadId }} />
  }

  // Fallback to starter page if no threads
  return <StarterPage />
}