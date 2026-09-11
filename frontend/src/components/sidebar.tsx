import { useState, useCallback, useEffect } from "react"
import {
  Clock,
  MessageSquare,
  Plus,
  GitFork,
  ExternalLink,
  Trash2,
  Edit3,
  Check,
  X,
} from "lucide-react"
import { useNavigate } from "@tanstack/react-router"
import { useStore } from "@/lib/store"
import { useLangGraphThreads } from "@/lib/langgraph-threads"
import type { SidebarThread } from "@/lib/langgraph-threads"
import { useCopilotChatConfiguration } from "@copilotkit/react-core/v2"

export function Sidebar() {
  const {
    threads: rawThreads,
    isLoading,
    error,
    createThread,
    deleteThread,
    renameThread,
    refresh,
  } = useLangGraphThreads()
  const config = useCopilotChatConfiguration()
  const currentSessionId = useStore((s) => s.currentSessionId)
  const setCurrentSessionId = useStore((s) => s.setCurrentSessionId)
  const isProcessing = useStore((s) => s.isProcessing)
  const navigate = useNavigate()

  // Refetch threads when active thread changes (e.g., auto-created on first message)
  useEffect(() => {
    if (currentSessionId) {
      refresh()
    }
  }, [currentSessionId, refresh])

  // Filter out archived and group by date
  const activeThreads = rawThreads.filter((t) => !t.archived)
  const today = activeThreads.filter((t) => {
    const d = new Date(t.createdAt)
    const now = new Date()
    return d.toDateString() === now.toDateString()
  })
  const earlier = activeThreads.filter((t) => {
    const d = new Date(t.createdAt)
    const now = new Date()
    return d.toDateString() !== now.toDateString()
  })

  const handleNewAnalysis = useCallback(async () => {
    const id = await createThread("New Analysis")
    if (id) {
      setCurrentSessionId(id)
      try {
        config?.setActiveThreadId(id, { explicit: true })
      } catch {}
      navigate({ to: "/thread/$threadId", params: { threadId: id } })
    }
  }, [createThread, setCurrentSessionId, config, navigate])

  const handleSelectThread = useCallback(
    (id: string) => {
      setCurrentSessionId(id)
      config?.setActiveThreadId(id, { explicit: true })
      navigate({ to: "/thread/$threadId", params: { threadId: id } })
    },
    [setCurrentSessionId, config, navigate]
  )

  return (
    <aside className="flex w-64 shrink-0 flex-col overflow-hidden border-r border-border bg-sidebar">
      <div className="space-y-2.5 border-b border-sidebar-border p-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Analysis Sessions
          </h2>
        </div>
        <button
          onClick={handleNewAnalysis}
          disabled={isProcessing}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary shadow-sm transition-all hover:bg-primary/20 active:scale-[0.98] disabled:opacity-50"
        >
          <Plus size={14} />
          <span>New Analysis</span>
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-2">
        {isLoading && (
          <div className="py-8 text-center text-muted-foreground">
            <p className="text-xs">Loading sessions...</p>
          </div>
        )}

        {error && (
          <div className="py-8 text-center text-destructive">
            <p className="text-xs">{error}</p>
          </div>
        )}

        {!isLoading && !error && activeThreads.length === 0 && (
          <div className="py-8 text-center text-muted-foreground">
            <MessageSquare className="mx-auto mb-2 opacity-40" size={24} />
            <p className="text-xs">No sessions yet.</p>
            <p className="text-xs">Ask a question to begin.</p>
          </div>
        )}

        {today.length > 0 && (
          <div>
            <p className="mb-1 px-2 text-[10px] font-semibold tracking-wider text-primary/70 uppercase">
              Today
            </p>
            {today.map((t) => (
              <ThreadItem
                key={t.id}
                thread={t}
                active={t.id === currentSessionId}
                onClick={() => handleSelectThread(t.id)}
                onDelete={() => deleteThread(t.id)}
                onRename={(name) => renameThread(t.id, name)}
              />
            ))}
          </div>
        )}

        {earlier.length > 0 && (
          <div>
            <p className="mt-2 mb-1 border-t border-sidebar-border px-2 pt-2 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
              Earlier
            </p>
            {earlier.map((t) => (
              <ThreadItem
                key={t.id}
                thread={t}
                active={t.id === currentSessionId}
                onClick={() => handleSelectThread(t.id)}
                onDelete={() => deleteThread(t.id)}
                onRename={(name) => renameThread(t.id, name)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer link to NeMo Traces */}
      <div className="border-t border-sidebar-border bg-sidebar/50 p-2.5">
        <a
          href="/traces"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between rounded-lg border border-cyan-500/20 px-3 py-2 text-xs font-semibold text-cyan-400 transition-all hover:bg-cyan-500/10"
          title="Open NeMo Switchyard & Relay Traces in a new tab"
        >
          <div className="flex items-center gap-2">
            <GitFork size={14} className="text-cyan-400" />
            <span>NeMo Traces & ATOF</span>
          </div>
          <ExternalLink size={12} className="text-cyan-400/80" />
        </a>
      </div>
    </aside>
  )
}

function ThreadItem({
  thread,
  active,
  onClick,
  onDelete,
  onRename,
}: {
  thread: SidebarThread
  active: boolean
  onClick: () => void
  onDelete: () => void
  onRename: (name: string) => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(thread.name || "")

  const displayTime = new Date(
    thread.lastRunAt || thread.updatedAt
  ).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })

  const handleRename = () => {
    if (editName.trim()) {
      onRename(editName.trim())
    }
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleRename()
    } else if (e.key === "Escape") {
      setEditName(thread.name || "")
      setIsEditing(false)
    }
  }

  return (
    <button
      onClick={onClick}
      className={`group relative w-full rounded-lg px-2.5 py-2 text-left transition-all ${
        active
          ? "border-l-2 border-primary bg-primary/10 text-primary-foreground shadow-[inset_0_0_12px_rgba(var(--primary),0.1)]"
          : "border-l-2 border-transparent text-sidebar-foreground hover:bg-sidebar-accent/50"
      }`}
    >
      <div className="flex items-start gap-2">
        <Clock
          size={12}
          className={`mt-0.5 shrink-0 ${active ? "text-primary" : "text-muted-foreground"}`}
        />
        <div className="min-w-0 flex-1">
          {isEditing ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleRename}
                autoFocus
                className="flex-1 rounded border border-border bg-background px-1 py-0.5 text-xs font-medium focus:ring-1 focus:ring-primary focus:outline-none"
                onClick={(e) => e.stopPropagation()}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleRename()
                }}
                className="rounded p-0.5 text-primary hover:bg-primary/10"
              >
                <Check size={10} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setEditName(thread.name || "")
                  setIsEditing(false)
                }}
                className="rounded p-0.5 text-muted-foreground hover:bg-muted"
              >
                <X size={10} />
              </button>
            </div>
          ) : (
            <p className="truncate text-xs font-medium">
              {thread.name || "New Analysis"}
            </p>
          )}
          <p
            className={`mt-0.5 text-[10px] ${active ? "text-primary/70" : "text-muted-foreground"}`}
          >
            {displayTime}
          </p>
        </div>
        {!isEditing && (
          <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsEditing(true)
                setEditName(thread.name || "")
              }}
              className={`rounded p-1 hover:bg-muted ${active ? "text-primary/70 hover:text-primary" : "text-muted-foreground hover:text-foreground"}`}
              title="Rename session"
            >
              <Edit3 size={10} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
              className={`rounded p-1 hover:bg-destructive/10 ${active ? "text-primary/70 hover:text-destructive" : "text-muted-foreground hover:text-destructive"}`}
              title="Delete session"
            >
              <Trash2 size={10} />
            </button>
          </div>
        )}
      </div>
    </button>
  )
}
