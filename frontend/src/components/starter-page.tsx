import { useState } from "react";
import {
  Database,
  TrendingUp,
  Target,
  ArrowRight,
  Eye,
  EyeOff,
  Cpu,
} from "lucide-react";
import { useStore } from "@/lib/store";

const DEFAULT_EMAIL = "admin@dataforge.ai";
const DEFAULT_PASSWORD = "dataforge2026";

interface StarterPageProps {
  onEnterApp?: () => void;
}

export function StarterPage({ onEnterApp }: StarterPageProps) {
  const login = useStore((s) => s.login);

  const [email, setEmail] = useState(DEFAULT_EMAIL);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Strict validation: check default password
    if (!password || password.trim() !== DEFAULT_PASSWORD) {
      setErrorMessage(`Invalid credentials. Default password is: ${DEFAULT_PASSWORD}`);
      return;
    }

    login({
      name: email.split("@")[0].replace(".", " ").toUpperCase(),
      email: email || DEFAULT_EMAIL,
      role: "Enterprise Executive",
    });

    // Update browser history so back button behaves properly
    if (typeof window !== "undefined") {
      window.history.pushState({ app: "dataforge", view: "workspace" }, "", "/#workspace");
    }

    if (onEnterApp) onEnterApp();
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-900 flex flex-col justify-between selection:bg-slate-200 selection:text-slate-900 relative font-sans">
      {/* ─── Top Header ─── */}
      <header className="w-full border-b border-slate-200 bg-white sticky top-0 z-30 shrink-0">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 select-none">
              <span className="text-lg font-bold tracking-tight text-slate-900">
                Data<span className="text-emerald-600 font-bold">Forge</span>
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" title="System Operational" />
            </div>
            <span className="hidden sm:inline-block h-4 w-[1px] bg-slate-200" />
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
              CUDA-X &bull; NIM Microservices
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-medium text-slate-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>OpenShell Sandbox Active</span>
            </div>
          </div>
        </div>
      </header>

      {/* ─── Main Hero Section ─── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-6 lg:py-8 my-auto relative z-10 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* ─── LEFT COLUMN ─── */}
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <Cpu size={13} className="text-emerald-600" />
              <span>NVIDIA Accelerated Decision Engine</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-[40px] font-extrabold text-slate-900 tracking-tight leading-[1.16]">
              Autonomous Decision Layer <br />
              <span className="text-emerald-700">
                with NVIDIA Accelerated Computing
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-600 max-w-xl leading-relaxed">
              Transform natural language into GPU-accelerated SQL, predictive ML, and cuOpt linear programs (LP) &mdash; powered by NVIDIA CUDA-X, NIM, and OpenShell.
            </p>

            {/* ─── 4 Feature Cards (UNIFORM Clean Color) ─── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl pt-1">
              {/* Card 1: GPU SQL (cuDF & CUDA-X) */}
              <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-sm hover:border-[#76b900]/60 transition-colors group">
                <div className="flex items-center justify-between mb-2">
                  <div className="h-8 w-8 rounded-lg bg-slate-100 text-[#497800] flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Database size={16} />
                  </div>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold border border-slate-200">
                    cuDF &bull; CUDA-X
                  </span>
                </div>
                <h3 className="text-xs font-bold text-slate-900 mb-1">Sub-Second Vectorized SQL</h3>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Zero-shot translation executed in GPU VRAM across 100M+ rows in &lt;0.8s.
                </p>
              </div>

              {/* Card 2: Causal ML */}
              <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-sm hover:border-[#76b900]/60 transition-colors group">
                <div className="flex items-center justify-between mb-2">
                  <div className="h-8 w-8 rounded-lg bg-slate-100 text-[#497800] flex items-center justify-center group-hover:scale-105 transition-transform">
                    <TrendingUp size={16} />
                  </div>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold border border-slate-200">
                    Causal ML &bull; 95% CI
                  </span>
                </div>
                <h3 className="text-xs font-bold text-slate-900 mb-1">Driver Attribution & ML</h3>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Isolates revenue variance drivers and simulates counterfactual What-If policies.
                </p>
              </div>

              {/* Card 3: cuOpt Solver */}
              <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-sm hover:border-[#76b900]/60 transition-colors group">
                <div className="flex items-center justify-between mb-2">
                  <div className="h-8 w-8 rounded-lg bg-slate-100 text-[#497800] flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Target size={16} />
                  </div>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold border border-slate-200">
                    cuOpt &bull; LP/MIP
                  </span>
                </div>
                <h3 className="text-xs font-bold text-slate-900 mb-1">Prescriptive Solver (LP/MIP)</h3>
                <p className="text-[11px] text-slate-500 leading-snug">
                  GPU-accelerated mathematical programming for optimal safety stock and logistics.
                </p>
              </div>

              {/* Card 4: Multi-Agent Orchestration */}
              <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-sm hover:border-[#76b900]/60 transition-colors group">
                <div className="flex items-center justify-between mb-2">
                  <div className="h-8 w-8 rounded-lg bg-slate-100 text-[#497800] flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Cpu size={16} />
                  </div>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold border border-slate-200">
                    Multi-Agent
                  </span>
                </div>
                <h3 className="text-xs font-bold text-slate-900 mb-1">Orchestration Layer</h3>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Autonomous agent pipeline coordinates Query → Analysis → Optimization → Insights.
                </p>
              </div>
            </div>
          </div>

          {/* ─── RIGHT COLUMN: Login Card ─── */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 p-6 max-w-md mx-auto">
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-semibold text-slate-600 mb-3">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Secure Access
                </div>
                <h2 className="text-lg font-bold text-slate-900">Sign in to DataForge</h2>
                <p className="text-xs text-slate-500 mt-1">Enterprise credentials required</p>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                    placeholder="admin@dataforge.ai"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-2.5 pr-10 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                      placeholder="Enter password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {errorMessage && (
                  <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                    {errorMessage}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors shadow-sm"
                >
                  <span>Access DataForge</span>
                  <ArrowRight size={14} />
                </button>
              </form>

              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-[10px] text-slate-400 text-center">
                  Protected by NVIDIA OpenShell &bull; Enterprise SSO Available
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ─── Footer ─── */}
      <footer className="w-full border-t border-slate-200 bg-white shrink-0">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <p className="text-[10px] text-slate-400">
            &copy; 2026 DataForge &mdash; Powered by NVIDIA CUDA-X, NIM, cuDF, cuOpt
          </p>
          <div className="flex items-center gap-4">
            <span className="text-[10px] text-slate-400">v2.4.0</span>
            <span className="h-3 w-[1px] bg-slate-200" />
            <span className="text-[10px] text-slate-400">GPU-Accelerated</span>
          </div>
        </div>
      </footer>
    </div>
  );
}