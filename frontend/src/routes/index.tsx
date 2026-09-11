import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { useStore } from "@/lib/store"
import { StarterPage } from "@/components/starter-page"
import { useLangGraphThreads } from "@/lib/langgraph-threads"

export const Route = createFileRoute("/")({ component: App })

function App() {
  const isAuthenticated = useStore((s) => s.isAuthenticated)
  const lastActiveThreadId = useStore((s) => s.lastActiveThreadId)
  const setCurrentSessionId = useStore((s) => s.setCurrentSessionId)
  const logout = useStore((s) => s.logout)
  const panelLayout = useStore((s) => s.panelLayout)
  const setPanelLayout = useStore((s) => s.setPanelLayout)
  const { createThread } = useLangGraphThreads()
  const navigate = useNavigate()
  const [isRedirecting, setIsRedirecting] = useState(false)

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

  // Handle browser back button — log out user when navigating back to /
  useEffect(() => {
    const handlePopState = () => {
      if (isAuthenticated && window.location.pathname === "/") {
        logout()
      }
    }

    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [isAuthenticated, logout])

  // Auto-create thread for authenticated users with no last active thread
  useEffect(() => {
    if (isAuthenticated && !lastActiveThreadId && !isRedirecting) {
      setIsRedirecting(true)
      ;(async () => {
        const threadId = await createThread("New Analysis")
        if (threadId) {
          setCurrentSessionId(threadId)
          navigate({ to: "/thread/$threadId", params: { threadId } })
        }
      })()
    }
  }, [
    isAuthenticated,
    lastActiveThreadId,
    isRedirecting,
    createThread,
    setCurrentSessionId,
    navigate,
  ])

  if (!isAuthenticated) {
    return <StarterPage />
  }

  // Redirect to last active thread if exists
  if (lastActiveThreadId) {
    return (
      <Navigate
        to="/thread/$threadId"
        params={{ threadId: lastActiveThreadId }}
      />
    )
  }

  // Loading state while auto-creating thread
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fafbfc]">
      <div className="space-y-3 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
        <p className="text-sm text-slate-500">Setting up your workspace...</p>
      </div>
    </div>
  )
}
