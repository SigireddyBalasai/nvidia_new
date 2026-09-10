/**
 * DataForge Zustand store.
 * Global state management for the dashboard.
 * LangGraph SDK manages threads; this store manages UI state.
 */
import { create } from "zustand";

export type Vertical = "cbg" | "bfsi" | "lshc";

export interface PlotlyChart {
  data: any[];
  layout?: any;
  title?: string;
  type?: string;
  xKey?: string;
  yKey?: string;
  nameKey?: string;
  valueKey?: string;
}

export interface TableData {
  type: "table";
  title: string;
  columns: string[];
  rows: Record<string, unknown>[];
}

export type Visualization = PlotlyChart | TableData;

export type AgentStatus = "idle" | "active" | "completed" | "skipped";

export interface AgentStates {
  query: AgentStatus;
  analysis: AgentStatus;
  optimization: AgentStatus;
  insights: AgentStatus;
}

export interface StepProgress {
  step: string;
  status: "pending" | "started" | "completed" | "failed" | "skipped";
  detail?: string;
  duration_ms?: number;
  step_number?: number;
  total_steps?: number;
  agent?: string;
  is_loopback?: boolean;
}

export interface ProgressEvent {
  step?: string;
  status?: string;
  detail?: string;
  duration_ms?: number;
  step_number?: number;
  total_steps?: number;
  agent?: string;
  is_loopback?: boolean;
  execution_mode?: string;
}

const DEFAULT_AGENT_STATES: AgentStates = {
  query: "idle",
  analysis: "idle",
  optimization: "idle",
  insights: "idle",
};

interface DataForgeState {
  // ─── Vertical ───
  vertical: Vertical;
  setVertical: (v: Vertical) => void;

  // ─── Current session ───
  currentSessionId: string | null;
  setCurrentSessionId: (id: string | null) => void;
  lastActiveThreadId: string | null;

  // ─── Live Multi-Agent Execution ───
  steps: StepProgress[];
  setSteps: (s: StepProgress[]) => void;
  updateStep: (step: string, updates: Partial<StepProgress>) => void;
  resetSteps: () => void;

  currentStepNumber: number;
  totalSteps: number;
  activeAgent: string | null;
  isLoopback: boolean;
  executionMode: string | null;
  agentStates: AgentStates;
  setExecutionProgress: (evt: Partial<ProgressEvent>) => void;
  resetExecutionState: () => void;

  // ─── Results & Messages ───
  response: string | null;
  setResponse: (r: string | null) => void;
  charts: Visualization[];
  setCharts: (c: Visualization[]) => void;
  diagnostics: Record<string, unknown>;
  setDiagnostics: (d: Record<string, unknown>) => void;

  // ─── Authentication & Navigation ───
  isAuthenticated: boolean;
  user: { name: string; email: string; role: string } | null;
  login: (user?: { name: string; email: string; role: string }) => void;
  logout: () => void;

  // ─── UI state ───
  isProcessing: boolean;
  setIsProcessing: (b: boolean) => void;
  sidebarOpen: boolean;
  toggleSidebar: () => void;

  // ─── Window / Panel Layout ───
  panelLayout: "split" | "chat" | "visuals";
  setPanelLayout: (layout: "split" | "chat" | "visuals") => void;
  toggleChatFullscreen: () => void;
  toggleVisualsFullscreen: () => void;
}

export const useStore = create<DataForgeState>((set, get) => ({
  vertical: "cbg",
  setVertical: (v) => set({ vertical: v }),

  currentSessionId: null,
  setCurrentSessionId: (id) => {
    if (id && typeof window !== "undefined") {
      localStorage.setItem("lastActiveThreadId", id);
    }
    set({ currentSessionId: id });
  },
  lastActiveThreadId: typeof window !== "undefined"
    ? localStorage.getItem("lastActiveThreadId")
    : null,

  steps: [],
  setSteps: (s) => set({ steps: s }),
  updateStep: (step, updates) =>
    set((state) => {
      const exists = state.steps.some((s) => s.step === step);
      if (!exists) {
        return { steps: [...state.steps, { step, status: updates.status || "started", ...updates }] };
      }
      return {
        steps: state.steps.map((s) =>
          s.step === step ? { ...s, ...updates } : s
        ),
      };
    }),
  resetSteps: () => set({ steps: [] }),

  currentStepNumber: 0,
  totalSteps: 5,
  activeAgent: null,
  isLoopback: false,
  executionMode: null,
  agentStates: { ...DEFAULT_AGENT_STATES },

  setExecutionProgress: (evt) => {
    const currentMode = evt.execution_mode || get().executionMode;
    const currentStep = evt.step_number ?? get().currentStepNumber;
    const total = evt.total_steps ?? get().totalSteps;
    const isLoop = Boolean(evt.is_loopback);
    const agent = evt.agent || evt.step;

    const newAgentStates: AgentStates = { ...get().agentStates };

    if (currentMode === "sql_only") {
      newAgentStates.analysis = "skipped";
      newAgentStates.optimization = "skipped";
    } else if (currentMode === "optimization_only") {
      newAgentStates.analysis = "skipped";
      if (newAgentStates.optimization === "skipped") newAgentStates.optimization = "idle";
    } else if (currentMode === "ml_analysis") {
      newAgentStates.optimization = "skipped";
      if (newAgentStates.analysis === "skipped") newAgentStates.analysis = "idle";
    } else if (currentMode === "compound_hero") {
      if (newAgentStates.analysis === "skipped") newAgentStates.analysis = "idle";
      if (newAgentStates.optimization === "skipped") newAgentStates.optimization = "idle";
    }

    if (agent === "planner") {
      newAgentStates.query = "active";
    } else if (agent === "query_agent" || agent === "query") {
      newAgentStates.query = evt.status === "completed" ? "completed" : "active";
      if (evt.status === "completed") {
        if (currentMode === "optimization_only") {
          newAgentStates.optimization = "active";
        } else if (newAgentStates.analysis !== "skipped") {
          newAgentStates.analysis = "active";
        }
      }
    } else if (agent === "analysis_agent" || agent === "stat_reviewer" || agent === "analysis") {
      if (newAgentStates.analysis !== "skipped") {
        newAgentStates.analysis = evt.status === "completed" ? "completed" : "active";
        if (evt.status === "completed" && currentMode === "compound_hero") {
          newAgentStates.optimization = "active";
        }
      }
    } else if (agent === "optimization_agent" || agent === "optimization") {
      if (currentMode === "compound_hero" || currentMode === "optimization_only") {
        newAgentStates.optimization = evt.status === "completed" ? "completed" : "active";
      } else {
        newAgentStates.optimization = "skipped";
      }
    } else if (agent === "insights_agent" || agent === "insights") {
      newAgentStates.insights = evt.status === "completed" ? "completed" : "active";
    }

    set({
      currentStepNumber: currentStep,
      totalSteps: total,
      activeAgent: agent || null,
      isLoopback: isLoop,
      executionMode: currentMode,
      agentStates: newAgentStates,
    });
  },

  resetExecutionState: () =>
    set({
      steps: [],
      currentStepNumber: 0,
      totalSteps: 5,
      activeAgent: null,
      isLoopback: false,
      executionMode: null,
      agentStates: { ...DEFAULT_AGENT_STATES },
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
      localStorage.removeItem("lastActiveThreadId");
    }
    set({
      isAuthenticated: false,
      user: null,
      currentSessionId: null,
      lastActiveThreadId: null,
    });
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
    set((s) => ({ panelLayout: s.panelLayout === "visuals" ? "split" : "visuals" })),
}));