import { useState, useRef, useCallback, useEffect } from "react"
import {
  Send,
  Database,
  Sparkles,
  TrendingUp,
  BarChart3,
  AlertCircle,
  RefreshCw,
} from "lucide-react"
import { useAgent, useCopilotKit } from "@copilotkit/react-core/v2"
import { useStore } from "@/lib/store"
import { useLangGraphThreads } from "@/lib/langgraph-threads"
import { AgentRadar } from "./agent-radar"
import { ProgressIndicator } from "./progress-indicator"
import { checkBackendHealth } from "@/lib/api"

interface ExampleQuery {
  title: string
  steps: string
  actionText: string
  query: string
  category: "multi_agent" | "sql" | "ml" | "optimization"
}

const VERTICAL_QUERIES: Record<string, ExampleQuery[]> = {
  cbg: [
    {
      title: "Revenue Decline & Policy Optimization",
      steps: "11 Steps",
      actionText: "Run strategic multi-agent flow →",
      query:
        "Why did revenue decline last quarter, what caused it, which products are most affected, what happens if we change reorder policy, and what should we do?",
      category: "multi_agent",
    },
    {
      title: "Top 5 Products by Revenue",
      steps: "3 Steps",
      actionText: "Run zero-shot cuDF SQL →",
      query: "What are the top 5 products by revenue last month?",
      category: "sql",
    },
  ],
  bfsi: [
    {
      title: "Customer Churn Root Cause & Retention",
      steps: "10 Steps",
      actionText: "Run strategic multi-agent flow →",
      query:
        "Why did customer churn increase in retail accounts, what are the primary risk factors, and what retention strategy minimizes lost balances?",
      category: "multi_agent",
    },
    {
      title: "High-Balance Inactive Accounts",
      steps: "3 Steps",
      actionText: "Run zero-shot cuDF SQL →",
      query: "List top 10 customers with balance over $50,000 who have been inactive for 60 days",
      category: "sql",
    },
  ],
  lshc: [
    {
      title: "Drug Stockout & Cold-Chain Resilience",
      steps: "11 Steps",
      actionText: "Run strategic multi-agent flow →",
      query:
        "Which drugs are at risk of stockout in the next 30 days, what caused the cold-chain deviation, and what is the optimal redistribution strategy?",
      category: "multi_agent",
    },
    {
      title: "Top SKUs by Revenue",
      steps: "3 Steps",
      actionText: "Run zero-shot cuDF SQL →",
      query: "What are the top 10 drug SKUs by revenue in the last quarter?",
      category: "sql",
    },
  ],
}

const CATEGORY_ICONS: Record<string, typeof Database> = {
  multi_agent: Sparkles,
  sql: Database,
  ml: TrendingUp,
  optimization: BarChart3,
}

const CATEGORY_COLORS: Record<string, string> = {
  multi_agent: "text-purple-500",
  sql: "text-cyan-500",
  ml: "text-indigo-500",
  optimization: "text-amber-500",
}

interface ChatPanelProps {
  isFullscreen?: boolean
}

type BackendStatus = "checking" | "ok" | "error"

export function ChatPanel({ isFullscreen = false }: ChatPanelProps) {
  const vertical = useStore((s) => s.vertical)
  const setIsProcessing = useStore((s) => s.setIsProcessing)
  const currentSessionId = useStore((s) => s.currentSessionId)
  const setCurrentSessionId = useStore((s) => s.setCurrentSessionId)
  // OSS-only headless chat: useAgent + copilotkit.runAgent (no license key).
  const { agent } = useAgent({ agentId: "default" })
  const { copilotkit } = useCopilotKit()
  const isLoading = agent.isRunning
  const { threads, createThread, fetchThreadMessages } = useLangGraphThreads()
  
  // Find active thread name
  const activeThread = threads.find((t) => t.id === currentSessionId)
  const threadName = activeThread?.name || "New Analysis"

  const queries = VERTICAL_QUERIES[vertical] || VERTICAL_QUERIES.cbg
  const [input, setInput] = useState("")
  const [backendStatus, setBackendStatus] = useState<BackendStatus>("checking")
  const [backendError, setBackendError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [threadMessages, setThreadMessages] = useState<Array<{id: string, role: "user" | "assistant", content: string}>>([])

  // Keep global processing flag in sync with agent run state
  useEffect(() => {
    setIsProcessing(isLoading)
  }, [isLoading, setIsProcessing])

  // Load messages when thread changes
  useEffect(() => {
    const loadMessages = async () => {
      if (!currentSessionId) {
        setThreadMessages([])
        return
      }
      const messages = await fetchThreadMessages(currentSessionId)
      const mapped = messages
        .filter(
          (m: { type?: string; content?: unknown }) =>
            (m.type === "human" || m.type === "ai") &&
            typeof m.content === "string" &&
            (m.content as string).trim().length > 0,
        )
        .map((m: { id?: string; type: string; content: unknown }) => ({
          id: m.id || `msg-${Date.now()}`,
          role: (m.type === "human" ? "user" : "assistant") as "user" | "assistant",
          content: m.content as string,
        }))
      setThreadMessages(mapped)
    }
    loadMessages()
  }, [currentSessionId, fetchThreadMessages])

  // Merge thread messages with live agent messages
  const agentMessages = agent.messages
    .filter(
      (m) =>
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim().length > 0,
    )
    .map((m) => ({
      id: m.id,
      role: m.role as "user" | "assistant",
      content: m.content as string,
    }))
  
  // Use thread messages as base, append any new agent messages not already in the list
  const messages = threadMessages.length > 0
    ? [...threadMessages, ...agentMessages.filter((am) => !threadMessages.some((tm) => tm.id === am.id))]
    : agentMessages

  // Check backend health on mount
  useEffect(() => {
    const checkHealth = async () => {
      setBackendStatus("checking")
      const result = await checkBackendHealth()
      setBackendStatus(result.status)
      setBackendError(result.status === "error" ? result.message : null)
    }
    checkHealth()
    // Re-check every 30 seconds
    const interval = setInterval(checkHealth, 30000)
    return () => clearInterval(interval)
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || agent.isRunning) return

    // Check backend before sending
    const healthCheck = await checkBackendHealth()
    if (healthCheck.status === "error") {
      setBackendStatus("error")
      setBackendError(healthCheck.message)
      return
    }

    // Create a new thread if none is active
    let activeThreadId = currentSessionId
    if (!activeThreadId) {
      activeThreadId = await createThread()
      if (!activeThreadId) {
        setBackendStatus("error")
        setBackendError("Failed to create thread")
        return
      }
      setCurrentSessionId(activeThreadId)
    }

    // Sync active thread id onto agent before sending
    agent.threadId = activeThreadId

    setInput("")
    setTimeout(scrollToBottom, 50)

    try {
      agent.addMessage({
        id: `user-${Date.now()}`,
        role: "user",
        content: content.trim(),
      })
      await copilotkit.runAgent({ agent })
      setTimeout(scrollToBottom, 50)
    } catch (err) {
      console.error("Failed to send message:", err)
      // Re-check backend status
      const recheck = await checkBackendHealth()
      setBackendStatus(recheck.status)
      setBackendError(recheck.status === "error" ? recheck.message : null)
    }
  }, [agent, copilotkit, currentSessionId, createThread, setCurrentSessionId])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const handleQueryClick = (query: string) => {
    sendMessage(query)
  }

  const handleRetryConnection = async () => {
    setBackendStatus("checking")
    setBackendError(null)
    const result = await checkBackendHealth()
    setBackendStatus(result.status)
    setBackendError(result.status === "error" ? result.message : null)
  }

  return (
    <div
      className={`flex flex-col border-r border-border bg-card ${
        isFullscreen ? "flex-1" : "w-1/2 min-w-[400px]"
      }`}
    >
      {/* Agent Radar */}
      <AgentRadar />

      {/* Progress Indicator */}
      <ProgressIndicator />

      {/* Backend Error Banner */}
      {backendStatus === "error" && (
        <div className="mx-4 mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
          <div className="flex items-start gap-3">
            <AlertCircle size={16} className="text-destructive mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-destructive">
                Backend Unreachable
              </p>
              <p className="text-[11px] text-destructive/80 mt-0.5">
                {backendError || "Cannot connect to the LangGraph agent server."}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">
                Start the agent server with:{" "}
                <code className="px-1 py-0.5 rounded bg-muted text-[10px]">
                  uv run langgraph dev --port 2024
                </code>
              </p>
            </div>
            <button
              onClick={handleRetryConnection}
              className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
              title="Retry connection"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && backendStatus === "ok" && (
          <div className="text-center py-12">
            <BarChart3 size={48} className="mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="text-sm font-semibold text-foreground mb-2">
              {threadName}
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Ask a question about your data or select an example query below.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-xl px-4 py-3 ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground border border-border"
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-secondary border border-border rounded-xl px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <span className="text-sm text-muted-foreground">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-border">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              backendStatus === "error"
                ? "Backend offline — start agent server first"
                : `Message ${threadName}...`
            }
            disabled={isLoading || backendStatus === "error"}
            className="flex-1 px-4 py-2.5 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim() || backendStatus === "error"}
            className="px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={16} />
          </button>
        </form>
      </div>

      {/* Example Queries */}
      <div className="p-3 border-t border-border bg-sidebar/50">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Example Queries
        </p>
        <div className="space-y-2">
          {queries.slice(0, 2).map((q, i) => {
            const Icon = CATEGORY_ICONS[q.category]
            const color = CATEGORY_COLORS[q.category]
            return (
              <button
                key={i}
                onClick={() => handleQueryClick(q.query)}
                disabled={isLoading || backendStatus === "error"}
                className="w-full text-left p-2.5 rounded-lg border border-border/60 hover:bg-accent/50 transition-colors group disabled:opacity-50"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Icon size={12} className={color} />
                    <span className="text-xs font-semibold text-foreground">{q.title}</span>
                  </div>
                  <span className="text-[9px] text-muted-foreground">{q.steps}</span>
                </div>
                <p className="text-[10px] text-primary font-medium">{q.actionText}</p>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}