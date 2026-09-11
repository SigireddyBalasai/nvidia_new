import { useState, useRef, useCallback, useEffect } from "react"
import {
  Send,
  Database,
  Sparkles,
  TrendingUp,
  BarChart3,
  AlertCircle,
  RefreshCw,
  Brain,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { useNavigate } from "@tanstack/react-router"
import {
  useAgent,
  useCopilotKit,
  CopilotChatToolCallsView,
  useInterrupt,
} from "@copilotkit/react-core/v2"
import { useStore } from "@/lib/store"
import { useLangGraphThreads } from "@/lib/langgraph-threads"
import { AgentRadar } from "./agent-radar"
import { ProgressIndicator } from "./progress-indicator"
import { InterruptApprovalCard } from "./interrupt-approval-card"
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
      query:
        "List top 10 customers with balance over $50,000 who have been inactive for 60 days",
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

interface ThinkingMessageProps {
  content: string
  isLatest?: boolean
}

function ThinkingMessage({ content, isLatest = false }: ThinkingMessageProps) {
  const [isExpanded, setIsExpanded] = useState(isLatest)

  return (
    <div className="max-w-[80%] overflow-hidden rounded-xl border border-amber-500/30 bg-amber-500/5">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center gap-2 px-4 py-2.5 text-left transition-colors hover:bg-amber-500/10"
      >
        <Brain size={14} className="shrink-0 text-amber-500" />
        <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
          Thinking Process
        </span>
        <div className="flex-1" />
        {isExpanded ? (
          <ChevronUp size={12} className="text-amber-500" />
        ) : (
          <ChevronDown size={12} className="text-amber-500" />
        )}
      </button>
      {isExpanded && (
        <div className="border-t border-amber-500/20 px-4 pb-3">
          <p className="mt-2 text-xs leading-relaxed whitespace-pre-wrap text-muted-foreground">
            {content}
          </p>
        </div>
      )}
    </div>
  )
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
  const navigate = useNavigate()
  const { threads, createThread, fetchThreadMessages } = useLangGraphThreads()

  // Find active thread name
  const activeThread = threads.find((t) => t.id === currentSessionId)
  const threadName = activeThread?.name || "New Analysis"

  const queries = VERTICAL_QUERIES[vertical]
  const [input, setInput] = useState("")
  const [backendStatus, setBackendStatus] = useState<BackendStatus>("checking")
  const [backendError, setBackendError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [threadMessages, setThreadMessages] = useState<
    Array<{
      id: string
      role: "user" | "assistant" | "reasoning"
      content: string
      toolCalls?: any
    }>
  >([])

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
            (m.type === "human" || m.type === "ai" || m.type === "reasoning") &&
            typeof m.content === "string" &&
            m.content.trim().length > 0
        )
        .map(
          (m: {
            id?: string
            type: string
            content: unknown
            tool_calls?: unknown
          }) => ({
            id: m.id || crypto.randomUUID(),
            role: (
              m.type === "human"
                ? "user"
                : m.type === "reasoning"
                  ? "reasoning"
                  : "assistant"
            ) as "user" | "reasoning" | "assistant",
            content: m.content as string,
            toolCalls: (m as any).tool_calls,
          })
        )
      setThreadMessages(mapped)
    }
    loadMessages()
  }, [currentSessionId, fetchThreadMessages])

  // Merge thread messages with live agent messages
  const agentMessages = agent.messages
    .filter(
      (m) =>
        (m.role === "user" ||
          m.role === "assistant" ||
          m.role === "reasoning") &&
        typeof m.content === "string" &&
        m.content.trim().length > 0
    )
    .map((m) => ({
      id: m.id,
      role: m.role as "user" | "assistant" | "reasoning",
      content: m.content as string,
      toolCalls: (m as any).toolCalls,
    }))

  // Use thread messages as base, append any new agent messages not already in the list
  const messages =
    threadMessages.length > 0
      ? [
          ...threadMessages,
          ...agentMessages.filter(
            (am) => !threadMessages.some((tm) => tm.id === am.id)
          ),
        ]
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

  // Handle graph-level interrupts (execute / write_file approval)
  useInterrupt({
    render: ({ interrupt, resolve }) => {
      // Deepagents interrupt: metadata contains action_requests + review_configs
      const meta = interrupt?.metadata as any
      if (!meta?.action_requests) {
        return <div />
      }

      const interruptData = {
        action_requests: meta.action_requests,
        review_configs: meta.review_configs || [],
      }

      return (
        <div className="flex justify-start">
          <InterruptApprovalCard
            interrupt={interruptData}
            onApprove={() =>
              resolve({
                decisions: interruptData.action_requests.map(() => ({
                  type: "approve",
                })),
              })
            }
            onReject={(message) =>
              resolve({
                decisions: interruptData.action_requests.map(() => ({
                  type: "reject",
                  message: message || "User rejected this action.",
                })),
              })
            }
            onRespond={(message) =>
              resolve({
                decisions: interruptData.action_requests.map(() => ({
                  type: "respond",
                  message,
                })),
              })
            }
          />
        </div>
      )
    },
  })

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const sendMessage = useCallback(
    async (content: string) => {
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
        navigate({
          to: "/thread/$threadId",
          params: { threadId: activeThreadId },
        })
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
    },
    [
      agent,
      copilotkit,
      currentSessionId,
      createThread,
      setCurrentSessionId,
      navigate,
    ]
  )

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
        <div className="mx-4 mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3">
          <div className="flex items-start gap-3">
            <AlertCircle
              size={16}
              className="mt-0.5 shrink-0 text-destructive"
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-destructive">
                Backend Unreachable
              </p>
              <p className="mt-0.5 text-[11px] text-destructive/80">
                {backendError ||
                  "Cannot connect to the LangGraph agent server."}
              </p>
              <p className="mt-1 text-[10px] text-muted-foreground">
                Start the agent server with:{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-[10px]">
                  uv run langgraph dev --port 2024
                </code>
              </p>
            </div>
            <button
              onClick={handleRetryConnection}
              className="rounded-lg p-1.5 text-destructive transition-colors hover:bg-destructive/10"
              title="Retry connection"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 && backendStatus === "ok" && (
          <div className="py-12 text-center">
            <BarChart3
              size={48}
              className="mx-auto mb-4 text-muted-foreground/30"
            />
            <h3 className="mb-2 text-sm font-semibold text-foreground">
              {threadName}
            </h3>
            <p className="mx-auto max-w-sm text-xs text-muted-foreground">
              Ask a question about your data or select an example query below.
            </p>
          </div>
        )}

        {messages.map((msg, index) => {
          if (msg.role === "reasoning") {
            const isLatestReasoning =
              index === messages.length - 1 ||
              (index < messages.length - 1 &&
                messages[index + 1]?.role !== "reasoning")
            return (
              <div key={msg.id} className="flex justify-start">
                <ThinkingMessage
                  content={msg.content}
                  isLatest={isLatestReasoning && isLoading}
                />
              </div>
            )
          }

          return (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-xl px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-secondary text-secondary-foreground"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                {msg.role === "assistant" && (msg as any).toolCalls && (
                  <CopilotChatToolCallsView
                    message={msg as any}
                    messages={messages}
                  />
                )}
              </div>
            </div>
          )
        })}

        {isLoading && (
          <div className="flex justify-start">
            <div className="rounded-xl border border-border bg-secondary px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                <span className="text-sm text-muted-foreground">
                  Thinking...
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-border p-4">
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
            className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 text-sm transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/30 focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim() || backendStatus === "error"}
            className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send size={16} />
          </button>
        </form>
      </div>

      {/* Example Queries */}
      <div className="border-t border-border bg-sidebar/50 p-3">
        <p className="mb-2 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
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
                className="group w-full rounded-lg border border-border/60 p-2.5 text-left transition-colors hover:bg-accent/50 disabled:opacity-50"
              >
                <div className="mb-1 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon size={12} className={color} />
                    <span className="text-xs font-semibold text-foreground">
                      {q.title}
                    </span>
                  </div>
                  <span className="text-[9px] text-muted-foreground">
                    {q.steps}
                  </span>
                </div>
                <p className="text-[10px] font-medium text-primary">
                  {q.actionText}
                </p>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
