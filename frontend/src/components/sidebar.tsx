import { useState, useCallback, useEffect } from "react";
import { Clock, MessageSquare, Plus, GitFork, ExternalLink, Trash2, Edit3, Check, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { useLangGraphThreads } from "@/lib/langgraph-threads";
import type { SidebarThread } from "@/lib/langgraph-threads";
import { useCopilotChatConfiguration } from "@copilotkit/react-core/v2";

export function Sidebar() {
  const { threads: rawThreads, isLoading, error, createThread, deleteThread, renameThread, refresh } = useLangGraphThreads();
  const config = useCopilotChatConfiguration();
  const currentSessionId = useStore((s) => s.currentSessionId);
  const setCurrentSessionId = useStore((s) => s.setCurrentSessionId);
  const isProcessing = useStore((s) => s.isProcessing);

  // Refetch threads when active thread changes (e.g., auto-created on first message)
  useEffect(() => {
    if (currentSessionId) {
      refresh();
    }
  }, [currentSessionId, refresh]);

  // Filter out archived and group by date
  const activeThreads = rawThreads.filter((t) => !t.archived);
  const today = activeThreads.filter((t) => {
    const d = new Date(t.createdAt);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });
  const earlier = activeThreads.filter((t) => {
    const d = new Date(t.createdAt);
    const now = new Date();
    return d.toDateString() !== now.toDateString();
  });

  const handleNewAnalysis = useCallback(async () => {
    const id = await createThread("New Analysis");
    if (id) {
      setCurrentSessionId(id);
      config?.setActiveThreadId(id, { explicit: true });
    }
  }, [createThread, setCurrentSessionId, config]);

  const handleSelectThread = useCallback((id: string) => {
    setCurrentSessionId(id);
    config?.setActiveThreadId(id, { explicit: true });
  }, [setCurrentSessionId, config]);

  return (
    <aside className="w-64 border-r border-border bg-sidebar flex flex-col shrink-0 overflow-hidden">
      <div className="p-3 border-b border-sidebar-border space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Analysis Sessions
          </h2>
        </div>
        <button
          onClick={handleNewAnalysis}
          disabled={isProcessing}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 text-xs font-semibold transition-all shadow-sm active:scale-[0.98] disabled:opacity-50"
        >
          <Plus size={14} />
          <span>New Analysis</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        {isLoading && (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-xs">Loading sessions...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-8 text-destructive">
            <p className="text-xs">{error}</p>
          </div>
        )}

        {!isLoading && !error && activeThreads.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="mx-auto mb-2 opacity-40" size={24} />
            <p className="text-xs">No sessions yet.</p>
            <p className="text-xs">Ask a question to begin.</p>
          </div>
        )}

        {today.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-primary/70 uppercase tracking-wider px-2 mb-1">
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
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-1 mt-2 pt-2 border-t border-sidebar-border">
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
      <div className="p-2.5 border-t border-sidebar-border bg-sidebar/50">
        <a
          href="/traces"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-cyan-400 hover:bg-cyan-500/10 border border-cyan-500/20 transition-all"
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
  );
}

function ThreadItem({
  thread,
  active,
  onClick,
  onDelete,
  onRename,
}: {
  thread: SidebarThread;
  active: boolean;
  onClick: () => void;
  onDelete: () => void;
  onRename: (name: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(thread.name || "");

  const displayTime = new Date(thread.lastRunAt || thread.updatedAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleRename = () => {
    if (editName.trim()) {
      onRename(editName.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleRename();
    } else if (e.key === "Escape") {
      setEditName(thread.name || "");
      setIsEditing(false);
    }
  };

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-lg px-2.5 py-2 transition-all group relative ${
        active
          ? "bg-primary/10 text-primary-foreground border-l-2 border-primary shadow-[inset_0_0_12px_rgba(var(--primary),0.1)]"
          : "hover:bg-sidebar-accent/50 text-sidebar-foreground border-l-2 border-transparent"
      }`}
    >
      <div className="flex items-start gap-2">
        <Clock size={12} className={`mt-0.5 shrink-0 ${active ? "text-primary" : "text-muted-foreground"}`} />
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
                className="flex-1 text-xs font-medium bg-background border border-border rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary"
                onClick={(e) => e.stopPropagation()}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRename();
                }}
                className="p-0.5 rounded hover:bg-primary/10 text-primary"
              >
                <Check size={10} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditName(thread.name || "");
                  setIsEditing(false);
                }}
                className="p-0.5 rounded hover:bg-muted text-muted-foreground"
              >
                <X size={10} />
              </button>
            </div>
          ) : (
            <p className="text-xs font-medium truncate">
              {thread.name || "New Analysis"}
            </p>
          )}
          <p className={`text-[10px] mt-0.5 ${active ? "text-primary/70" : "text-muted-foreground"}`}>
            {displayTime}
          </p>
        </div>
        {!isEditing && (
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
                setEditName(thread.name || "");
              }}
              className={`p-1 rounded hover:bg-muted ${active ? "text-primary/70 hover:text-primary" : "text-muted-foreground hover:text-foreground"}`}
              title="Rename session"
            >
              <Edit3 size={10} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className={`p-1 rounded hover:bg-destructive/10 ${active ? "text-primary/70 hover:text-destructive" : "text-muted-foreground hover:text-destructive"}`}
              title="Delete session"
            >
              <Trash2 size={10} />
            </button>
          </div>
        )}
      </div>
    </button>
  );
}
