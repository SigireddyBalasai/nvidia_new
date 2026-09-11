import { useState } from "react"
import {
  Database,
  TrendingUp,
  Target,
  ArrowRight,
  Eye,
  EyeOff,
  Cpu,
} from "lucide-react"
import { useNavigate } from "@tanstack/react-router"
import { useStore } from "@/lib/store"
import { useLangGraphThreads } from "@/lib/langgraph-threads"

const DEFAULT_EMAIL = "admin@dataforge.ai"
const DEFAULT_PASSWORD = "dataforge2026"

interface StarterPageProps {
  onEnterApp?: () => void
}

export function StarterPage({ onEnterApp }: StarterPageProps) {
  const login = useStore((s) => s.login)
  const setCurrentSessionId = useStore((s) => s.setCurrentSessionId)
  const { createThread } = useLangGraphThreads()
  const navigate = useNavigate()

  const [email, setEmail] = useState(DEFAULT_EMAIL)
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    // Strict validation: check default password
    if (!password || password.trim() !== DEFAULT_PASSWORD) {
      setErrorMessage("Invalid credentials. Please try again.")
      return
    }

    setIsLoggingIn(true)

    login({
      name: email.split("@")[0].replace(".", " ").toUpperCase(),
      email: email || DEFAULT_EMAIL,
      role: "Enterprise Executive",
    })

    // Auto-create a thread and navigate to workspace
    const threadId = await createThread("New Analysis")
    if (threadId) {
      setCurrentSessionId(threadId)
      navigate({ to: "/thread/$threadId", params: { threadId } })
    }

    setIsLoggingIn(false)

    if (onEnterApp) onEnterApp()
  }

  return (
    <div className="relative flex min-h-screen flex-col justify-between bg-[#fafbfc] font-sans text-slate-900 selection:bg-slate-200 selection:text-slate-900">
      {/* ─── Top Header ─── */}
      <header className="sticky top-0 z-30 w-full shrink-0 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 select-none">
              <span className="text-lg font-bold tracking-tight text-slate-900">
                Data<span className="font-bold text-emerald-600">Forge</span>
              </span>
              <span
                className="h-1.5 w-1.5 rounded-full bg-emerald-500"
                title="System Operational"
              />
            </div>
            <span className="hidden h-4 w-[1px] bg-slate-200 sm:inline-block" />
            <span className="hidden items-center gap-1.5 text-xs font-medium text-slate-500 sm:inline-flex">
              CUDA-X &bull; NIM Microservices
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>OpenShell Sandbox Active</span>
            </div>
          </div>
        </div>
      </header>

      {/* ─── Main Hero Section ─── */}
      <main className="relative z-10 mx-auto my-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-6 py-6 lg:py-8">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-12">
          {/* ─── LEFT COLUMN ─── */}
          <div className="space-y-4 lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
              <Cpu size={13} className="text-emerald-600" />
              <span>NVIDIA Accelerated Decision Engine</span>
            </div>

            <h1 className="text-3xl leading-[1.16] font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-[40px]">
              Autonomous Decision Layer <br />
              <span className="text-emerald-700">
                with NVIDIA Accelerated Computing
              </span>
            </h1>

            <p className="max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">
              Transform natural language into GPU-accelerated SQL, predictive
              ML, and cuOpt linear programs (LP) &mdash; powered by NVIDIA
              CUDA-X, NIM, and OpenShell.
            </p>

            {/* ─── 4 Feature Cards (UNIFORM Clean Color) ─── */}
            <div className="grid max-w-xl grid-cols-1 gap-3 pt-1 sm:grid-cols-2">
              {/* Card 1: GPU SQL (cuDF & CUDA-X) */}
              <div className="group rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-sm transition-colors hover:border-[#76b900]/60">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-[#497800] transition-transform group-hover:scale-105">
                    <Database size={16} />
                  </div>
                  <span className="rounded border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-[9px] font-bold text-slate-700">
                    cuDF &bull; CUDA-X
                  </span>
                </div>
                <h3 className="mb-1 text-xs font-bold text-slate-900">
                  Sub-Second Vectorized SQL
                </h3>
                <p className="text-[11px] leading-snug text-slate-500">
                  Zero-shot translation executed in GPU VRAM across 100M+ rows
                  in &lt;0.8s.
                </p>
              </div>

              {/* Card 2: Causal ML */}
              <div className="group rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-sm transition-colors hover:border-[#76b900]/60">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-[#497800] transition-transform group-hover:scale-105">
                    <TrendingUp size={16} />
                  </div>
                  <span className="rounded border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-[9px] font-bold text-slate-700">
                    Causal ML &bull; 95% CI
                  </span>
                </div>
                <h3 className="mb-1 text-xs font-bold text-slate-900">
                  Driver Attribution & ML
                </h3>
                <p className="text-[11px] leading-snug text-slate-500">
                  Isolates revenue variance drivers and simulates counterfactual
                  What-If policies.
                </p>
              </div>

              {/* Card 3: cuOpt Solver */}
              <div className="group rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-sm transition-colors hover:border-[#76b900]/60">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-[#497800] transition-transform group-hover:scale-105">
                    <Target size={16} />
                  </div>
                  <span className="rounded border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-[9px] font-bold text-slate-700">
                    cuOpt &bull; LP/MIP
                  </span>
                </div>
                <h3 className="mb-1 text-xs font-bold text-slate-900">
                  Prescriptive Solver (LP/MIP)
                </h3>
                <p className="text-[11px] leading-snug text-slate-500">
                  GPU-accelerated mathematical programming for optimal safety
                  stock and logistics.
                </p>
              </div>

              {/* Card 4: Multi-Agent Orchestration */}
              <div className="group rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-sm transition-colors hover:border-[#76b900]/60">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-[#497800] transition-transform group-hover:scale-105">
                    <Cpu size={16} />
                  </div>
                  <span className="rounded border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-[9px] font-bold text-slate-700">
                    Multi-Agent
                  </span>
                </div>
                <h3 className="mb-1 text-xs font-bold text-slate-900">
                  Orchestration Layer
                </h3>
                <p className="text-[11px] leading-snug text-slate-500">
                  Autonomous agent pipeline coordinates Query → Analysis →
                  Optimization → Insights.
                </p>
              </div>
            </div>
          </div>

          {/* ─── RIGHT COLUMN: Login Card ─── */}
          <div className="lg:col-span-5">
            <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50">
              <div className="mb-6 text-center">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-[10px] font-semibold text-slate-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Secure Access
                </div>
                <h2 className="text-lg font-bold text-slate-900">
                  Sign in to DataForge
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Enterprise credentials required
                </p>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 focus:outline-none"
                    placeholder="admin@dataforge.ai"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 pr-10 text-sm text-slate-900 transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 focus:outline-none"
                      placeholder="Enter password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {errorMessage && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
                    {errorMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span>
                    {isLoggingIn ? "Setting up..." : "Access DataForge"}
                  </span>
                  <ArrowRight size={14} />
                </button>
              </form>

              <div className="mt-4 border-t border-slate-100 pt-4">
                <p className="text-center text-[10px] text-slate-400">
                  Protected by NVIDIA OpenShell &bull; Enterprise SSO Available
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ─── Footer ─── */}
      <footer className="w-full shrink-0 border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <p className="text-[10px] text-slate-400">
            &copy; 2026 DataForge &mdash; Powered by NVIDIA CUDA-X, NIM, cuDF,
            cuOpt
          </p>
          <div className="flex items-center gap-4">
            <span className="text-[10px] text-slate-400">v2.4.0</span>
            <span className="h-3 w-[1px] bg-slate-200" />
            <span className="text-[10px] text-slate-400">GPU-Accelerated</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
