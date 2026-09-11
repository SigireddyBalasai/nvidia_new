/**
 * DataForge Zustand store.
 * Global state management for the dashboard.
 * LangGraph SDK manages threads; this store manages UI state.
 */
import { create } from "zustand"

export interface DataForgeState {
  // ─── Vertical ───
  vertical: string
  setVertical: (v: string) => void

  // ─── Current session ───
  currentSessionId: string | null
  setCurrentSessionId: (id: string | null) => void
  lastActiveThreadId: string | null

  // ─── Live Multi-Agent Execution ───
  steps: { step: string; status: string; detail?: string; duration_ms?: number }[]
  setSteps: (s: { step: string; status: string }[]) => void
  updateStep: (step: string, updates: Partial<{ step: string; status: string }>) => void
  resetSteps: () => void

  currentStepNumber: number
  totalSteps: number
  activeAgent: string | null
  isLoopback: boolean
  executionMode: string | null
  agentStates: Record<string, string>
  setExecutionProgress: (evt: Partial<{ step?: string; status?: string; detail?: string; duration_ms?: number; step_number?: number; total_steps?: number; agent?: string; is_loopback?: boolean; execution_mode?: string }>) => void
  resetExecutionState: () => void

  // ─── Results & Messages ───
  response: string | null
  setResponse: (r: string | null) => void
  charts: any[]
  setCharts: (c: any[]) => void
  diagnostics: Record<string, unknown>
  setDiagnostics: (d: Record<string, unknown>) => void

  // ─── Authentication & Navigation ───
  isAuthenticated: boolean
  user: { name: string; email: string; role: string } | null
  login: (user?: { name: string; email: string; role: string }) => void
  logout: () => void

  // ─── UI state ───
  isProcessing: boolean
  setIsProcessing: (b: boolean) => void
  sidebarOpen: boolean
  toggleSidebar: () => void

  // ─── Window / Panel Layout ───
  panelLayout: "split" | "chat" | "visuals"
  setPanelLayout: (layout: "split" | "chat" | "visuals") => void
  toggleChatFullscreen: () => void
  toggleVisualsFullscreen: () => void
}

export const useStore = create<DataForgeState>((set, get) => ({
  vertical: "cbg",
  setVertical: (v) => set({ vertical: v }),

  currentSessionId: null,
  setCurrentSessionId: (id) => {
    if (id && typeof window !== "undefined") {
      localStorage.setItem("lastActiveThreadId", id)
    }
    set({ currentSessionId: id })
  },
  lastActiveThreadId:
    typeof window !== "undefined"
      ? localStorage.getItem("lastActiveThreadId")
      : null,

  steps: [],
  setSteps: (s) => set({ steps: s }),
  updateStep: (step, updates) =>
    set((state) => {
      const exists = state.steps.some((s) => s.step === step)
      if (!exists) {
        return {
          steps: [
            ...state.steps,
            { step, status: updates.status || "started", ...updates },
          ],
        }
      }
      return {
        steps: state.steps.map((s) =>
          s.step === step ? { ...s, ...updates } : s
        ),
      }
    }),
  resetSteps: () => set({ steps: [] }),

  currentStepNumber: 0,
  totalSteps: 5,
  activeAgent: null,
  isLoopback: false,
  executionMode: null,
  agentStates: { query: "idle", analysis: "idle", optimization: "idle", insights: "idle" },

  setExecutionProgress: (evt) => {
    const currentMode = evt.execution_mode || get().executionMode
    const currentStep = evt.step_number ?? get().currentStepNumber
    const total = evt.total_steps ?? get().totalSteps
    const isLoop = Boolean(evt.is_loopback)
    const agent = evt.agent || evt.step

    const newAgentStates: Record<string, string> = { ...get().agentStates }

    if (currentMode === "sql_only") {
      newAgentStates.analysis = "skipped"
      newAgentStates.optimization = "skipped"
    } else if (currentMode === "optimization_only") {
      newAgentStates.analysis = "skipped"
      if (newAgentStates.optimization === "skipped")
        newAgentStates.optimization = "idle"
    } else if (currentMode === "ml_analysis") {
      newAgentStates.optimization = "skipped"
      if (newAgentStates.analysis === "skipped")
        newAgentStates.analysis = "idle"
    } else if (currentMode === "compound_hero") {
      if (newAgentStates.analysis === "skipped")
        newAgentStates.analysis = "idle"
      if (newAgentStates.optimization === "skipped")
        newAgentStates.optimization = "idle"
    }

    if (agent === "planner") {
      newAgentStates.query = "active"
    } else if (agent === "query_agent" || agent === "query") {
      newAgentStates.query = evt.status === "completed" ? "completed" : "active"
      if (evt.status === "completed") {
        if (currentMode === "optimization_only") {
          newAgentStates.optimization = "active"
        } else if (newAgentStates.analysis !== "skipped") {
          newAgentStates.analysis = "active"
        }
      }
    } else if (
      agent === "analysis_agent" ||
      agent === "stat_reviewer" ||
      agent === "analysis"
    ) {
      if (newAgentStates.analysis !== "skipped") {
        newAgentStates.analysis =
          evt.status === "completed" ? "completed" : "active"
        if (evt.status === "completed" && currentMode === "compound_hero") {
          newAgentStates.optimization = "active"
        }
      }
    } else if (agent === "optimization_agent" || agent === "optimization") {
      if (
        currentMode === "compound_hero" ||
        currentMode === "optimization_only"
      ) {
        newAgentStates.optimization =
          evt.status === "completed" ? "completed" : "active"
      } else {
        newAgentStates.optimization = "skipped"
      }
    } else if (agent === "insights_agent" || agent === "insights") {
      newAgentStates.insights =
        evt.status === "completed" ? "completed" : "active"
    }

    set({
      currentStepNumber: currentStep,
      totalSteps: total,
      activeAgent: agent || null,
      isLoopback: isLoop,
      executionMode: currentMode,
      agentStates: newAgentStates,
    })
  },

  resetExecutionState: () =>
    set({
      steps: [],
      currentStepNumber: 0,
      totalSteps: 5,
      activeAgent: null,
      isLoopback: false,
      executionMode: null,
      agentStates: { query: "idle", analysis: "idle", optimization: "idle", insights: "idle" },
    }),

  response: null,
  setResponse: (r) => set({ response: r }),
  charts: [],
  setCharts: (c) => set({ charts: c }),
  diagnostics: {},
  setDiagnostics: (d) => set({ diagnostics: d }),

  // ─── Authentication state & actions ───
  isAuthenticated: false,
  user: null,
  login: (userData) =>
    set({
      isAuthenticated: true,
      user: userData || {
        name: "Alex Sterling",
        email: "alex.sterling@enterprise.com",
        role: "Chief Financial Officer",
      },
    }),
  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("lastActiveThreadId")
    }
    set({
      isAuthenticated: false,
      user: null,
      currentSessionId: null,
      lastActiveThreadId: null,
    })
  },

  isProcessing: false,
  setIsProcessing: (b) => set({ isProcessing: b }),
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  panelLayout: "split",
  setPanelLayout: (layout) => set({ panelLayout: layout }),
  toggleChatFullscreen: () =>
    set((s) => ({ panelLayout: s.panelLayout === "chat" ? "split" : "chat" })),
  toggleVisualsFullscreen: () =>
    set((s) => ({
      panelLayout: s.panelLayout === "visuals" ? "split" : "visuals",
    }))}))