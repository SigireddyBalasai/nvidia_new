import { useStore } from "@/lib/store"
import {
  Database,
  Cpu,
  Target,
  BarChart3,
  RotateCcw,
} from "lucide-react"

interface AgentMeta {
  id: "query" | "analysis" | "optimization" | "insights"
  name: string
  shortRole: string
  icon: typeof Database
  activeBorder: string
  glowShadow: string
  iconActiveBg: string
}

const AGENTS: AgentMeta[] = [
  {
    id: "query",
    name: "Query Agent",
    shortRole: "Text2SQL & Vector RAG",
    icon: Database,
    activeBorder:
      "border-cyan-500/80 dark:border-cyan-400/70 bg-cyan-500/[0.06] dark:bg-cyan-500/10",
    glowShadow:
      "shadow-[0_0_20px_rgba(6,182,212,0.25)] dark:shadow-[0_0_24px_rgba(6,182,212,0.35)]",
    iconActiveBg: "bg-cyan-500/20 text-cyan-600 dark:text-cyan-400",
  },
  {
    id: "analysis",
    name: "Analysis Agent",
    shortRole: "ML Models & Anomaly Detection",
    icon: Cpu,
    activeBorder:
      "border-indigo-500/80 dark:border-indigo-400/70 bg-indigo-500/[0.06] dark:bg-indigo-500/10",
    glowShadow:
      "shadow-[0_0_20px_rgba(99,102,241,0.25)] dark:shadow-[0_0_24px_rgba(129,140,248,0.35)]",
    iconActiveBg: "bg-indigo-500/20 text-indigo-600 dark:text-indigo-400",
  },
  {
    id: "optimization",
    name: "Optimization Agent",
    shortRole: "EOQ & Safety-Stock Policy",
    icon: Target,
    activeBorder:
      "border-amber-500/80 dark:border-amber-400/70 bg-amber-500/[0.06] dark:bg-amber-500/10",
    glowShadow:
      "shadow-[0_0_20px_rgba(245,158,11,0.25)] dark:shadow-[0_0_24px_rgba(245,158,11,0.35)]",
    iconActiveBg: "bg-amber-500/20 text-amber-600 dark:text-amber-400",
  },
  {
    id: "insights",
    name: "Insights Agent",
    shortRole: "Executive Briefing & Visuals",
    icon: BarChart3,
    activeBorder:
      "border-emerald-500/80 dark:border-emerald-400/70 bg-emerald-500/[0.06] dark:bg-emerald-500/10",
    glowShadow:
      "shadow-[0_0_20px_rgba(16,185,129,0.25)] dark:shadow-[0_0_24px_rgba(16,185,129,0.35)]",
    iconActiveBg: "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400",
  },
]

export function AgentRadar() {
  const agentStates = useStore((s) => s.agentStates)
  const isLoopback = useStore((s) => s.isLoopback)
  const isProcessing = useStore((s) => s.isProcessing)
  const executionMode = useStore((s) => s.executionMode)
  const currentStepNumber = useStore((s) => s.currentStepNumber)
  const totalSteps = useStore((s) => s.totalSteps)

  if (
    !isProcessing &&
    Object.values(agentStates).every((st) => st === "idle")
  ) {
    return null
  }

  const effectiveStep = Math.max(1, currentStepNumber)
  const total = totalSteps || 5

  return (
    <div className="relative mx-4 mb-3 overflow-hidden rounded-xl border border-border/80 bg-card p-4 shadow-md transition-all duration-300">
      {/* Background ambient gradient glow */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-indigo-500/5 to-emerald-500/5" />

      {/* Top Header bar */}
      <div className="relative mb-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-primary" />
          <span className="text-[11px] font-bold tracking-wider text-foreground uppercase">
            Multi-Agent Orchestration Radar
          </span>
        </div>
        <div className="flex items-center gap-3">
          {executionMode && (
            <span className="rounded border border-border/50 bg-secondary px-2 py-0.5 font-mono text-[9px] text-secondary-foreground">
              {executionMode}
            </span>
          )}
          <span className="font-mono text-[10px] text-muted-foreground">
            Step {effectiveStep}/{total}
          </span>
          {isLoopback && (
            <div className="flex items-center gap-1 text-amber-500">
              <RotateCcw size={10} className="animate-spin" />
              <span className="text-[9px] font-semibold">LOOPBACK</span>
            </div>
          )}
        </div>
      </div>

      {/* Agent Cards Grid */}
      <div className="relative grid grid-cols-4 gap-2.5">
        {AGENTS.map((agent) => {
          const status = agentStates[agent.id]
          const isActive = status === "active"
          const isCompleted = status === "completed"
          const isSkipped = status === "skipped"
          const Icon = agent.icon

          return (
            <div
              key={agent.id}
              className={`relative rounded-lg border p-2.5 transition-all duration-300 ${
                isActive
                  ? `${agent.activeBorder} ${agent.glowShadow}`
                  : isCompleted
                    ? "border-green-500/40 bg-green-500/[0.04]"
                    : isSkipped
                      ? "border-border/40 bg-muted/20 opacity-50"
                      : "border-border/60 bg-card/50"
              }`}
            >
              <div className="mb-1.5 flex items-center gap-2">
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded transition-colors ${
                    isActive
                      ? agent.iconActiveBg
                      : isCompleted
                        ? "bg-green-500/20 text-green-600 dark:text-green-400"
                        : isSkipped
                          ? "bg-muted text-muted-foreground"
                          : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  <Icon size={12} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[10px] font-bold text-foreground">
                    {agent.name}
                  </p>
                  <p className="truncate text-[8px] text-muted-foreground">
                    {agent.shortRole}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <div
                  className={`h-1.5 flex-1 overflow-hidden rounded-full ${
                    isActive ? "bg-secondary" : "bg-secondary/50"
                  }`}
                >
                  {isActive && (
                    <div className="animate-progress h-full rounded-full bg-primary" />
                  )}
                  {isCompleted && (
                    <div className="h-full rounded-full bg-green-500" />
                  )}
                </div>
                <span className="font-mono text-[8px] text-muted-foreground uppercase">
                  {isSkipped ? "SKIP" : status}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
