import {
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  ArrowLeft,
  GitFork,
  ExternalLink,
  Link,
} from "lucide-react"
import { useNavigate } from "@tanstack/react-router"
import { useStore } from "@/lib/store"
import type { Vertical } from "@/lib/store"

const VERTICALS: { id: Vertical; label: string; emoji: string }[] = [
  { id: "cbg", label: "Consumer Goods", emoji: "🛒" },
  { id: "bfsi", label: "Banking & Finance", emoji: "🏦" },
  { id: "lshc", label: "Life Sciences", emoji: "🧬" },
]

export function Header() {
  const vertical = useStore((s) => s.vertical)
  const setVertical = useStore((s) => s.setVertical)
  const sidebarOpen = useStore((s) => s.sidebarOpen)
  const toggleSidebar = useStore((s) => s.toggleSidebar)
  const user = useStore((s) => s.user)
  const logout = useStore((s) => s.logout)
  const navigate = useNavigate()

  const handleReturnToPortal = () => {
    logout()
    navigate({ to: "/" })
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    console.log("Link copied to clipboard")
  }

  return (
    <header className="flex shrink-0 items-center justify-between border-b border-border bg-card px-4 py-2.5">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          {sidebarOpen ? (
            <PanelLeftClose size={18} />
          ) : (
            <PanelLeftOpen size={18} />
          )}
        </button>

        {/* Modern clean DataForge logo branding */}
        <div className="flex items-center gap-2 select-none">
          <span className="text-base font-bold tracking-tight text-foreground">
            Data<span className="font-bold text-primary">Forge</span>
          </span>
          <span
            className="h-1.5 w-1.5 rounded-full bg-emerald-500"
            title="System Operational"
          />
        </div>

        {/* Direct Back to Portal Button */}
        <button
          onClick={handleReturnToPortal}
          className="ml-1 flex items-center gap-1.5 rounded-lg border border-border/60 px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          title="Return to Product Portal"
        >
          <ArrowLeft size={13} />
          <span className="hidden sm:inline">Back to Portal</span>
        </button>

        {/* NeMo Traces & Observability New Tab Button */}
        <a
          href="/traces"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-xs font-semibold text-cyan-400 shadow-sm transition-all hover:bg-cyan-500/20"
          title="Open NVIDIA NeMo Switchyard & Relay Traces Dashboard in a new tab"
        >
          <GitFork size={13} className="text-cyan-400" />
          <span className="hidden md:inline">NeMo Traces</span>
          <ExternalLink size={11} className="text-cyan-400/80" />
        </a>

        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          title="Copy link to clipboard"
        >
          <Link size={14} />
          <span>Share</span>
        </button>
      </div>

      <div className="flex items-center gap-3">
        {/* Industry Vertical Selector */}
        <div className="flex items-center gap-1 rounded-lg bg-secondary p-0.5">
          {VERTICALS.map((v) => (
            <button
              key={v.id}
              onClick={() => setVertical(v.id)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                vertical === v.id
                  ? "bg-card font-semibold text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>{v.emoji}</span>
              <span className="hidden md:inline">{v.label}</span>
            </button>
          ))}
        </div>

        {/* User Account / Sign Out */}
        <div className="flex items-center gap-2 border-l border-border/60 pl-2">
          <div className="hidden flex-col items-end lg:flex">
            <span className="text-[11px] leading-tight font-semibold text-foreground">
              {user?.name || "Enterprise User"}
            </span>
            <span className="text-[9px] leading-none text-muted-foreground">
              {user?.role || "Analytics"}
            </span>
          </div>
          <button
            onClick={handleReturnToPortal}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            title="Sign Out / Return to Product Overview"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </header>
  )
}
