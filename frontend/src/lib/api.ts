/**
 * DataForge-compatible API client backed by CopilotKit.
 * Provides the same interface as DataForge's REST API but routes through CopilotKit runtime.
 */

export interface QueryRequest {
  question: string
  vertical: "cbg" | "bfsi" | "lshc"
  session_id?: string
}

export interface QueryResponse {
  session_id: string
  status: string
}

export interface PlotlyChart {
  title?: string
  type: string
  data: Record<string, unknown>[]
  layout: Record<string, unknown>
}

export interface ProgressEvent {
  step: string
  status: string
  detail?: string
  duration_ms?: number
  model?: string
  tokens?: number
  timestamp?: number
  step_number?: number
  total_steps?: number
  agent?: string
  is_loopback?: boolean
  execution_mode?: string
}

export interface SessionInfo {
  session_id: string
  question: string
  vertical: string
  status: string
  created_at: string
  response: string | null
  charts: PlotlyChart[]
  diagnostics: Record<string, unknown>
}

// ─── Health Check ───

/**
 * Check if the LangGraph backend is reachable.
 * Probes the CopilotKit runtime info endpoint, which is served from
 * the same server route (`/api/copilotkit/$`) that chat uses.
 */
export async function checkBackendHealth(): Promise<{
  status: "ok" | "error"
  message: string
}> {
  try {
    const res = await fetch("/api/copilotkit/info", {
      method: "GET",
      signal: AbortSignal.timeout(5000),
    })

    if (res.ok) {
      return { status: "ok", message: "Backend is reachable" }
    }
    return {
      status: "error",
      message: `Backend returned ${res.status}: ${res.statusText}`,
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return { status: "error", message: "Backend connection timed out" }
    }
    return {
      status: "error",
      message: `Cannot reach backend: ${err instanceof Error ? err.message : "Unknown error"}`,
    }
  }
}

// ─── Thread-backed session management ───

/**
 * Submit a query — in CopilotKit mode, messages are sent via useCopilotChat/useAgent.
 * This function is kept for API compatibility but the actual message sending
 * happens through the CopilotKit chat interface.
 */
export async function submitQuery(req: QueryRequest): Promise<QueryResponse> {
  const sessionId = req.session_id || `df-${req.vertical}-${Date.now()}`
  return {
    session_id: sessionId,
    status: "processing",
  }
}

/**
 * Fetch model reuse stats.
 */
export async function fetchModelStats(): Promise<{
  total_models_cached: number
  total_reuses: number
  gpu_seconds_saved: number
  models: Record<string, unknown>[]
}> {
  return {
    total_models_cached: 0,
    total_reuses: 0,
    gpu_seconds_saved: 0,
    models: [],
  }
}

/**
 * Health check.
 */
export async function fetchHealth(): Promise<Record<string, unknown>> {
  return { status: "ok", mode: "copilotkit" }
}

/**
 * TTS URL for session.
 */
export function getTTSUrl(sessionId: string): string {
  return `/api/tts/${sessionId}`
}
