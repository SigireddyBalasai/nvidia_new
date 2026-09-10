import { PanelLeftClose, PanelLeftOpen, LogOut, ArrowLeft, GitFork, ExternalLink, Link } from "lucide-react";
import { useStore  } from "@/lib/store";
import type {Vertical} from "@/lib/store";

const VERTICALS: { id: Vertical; label: string; emoji: string }[] = [
  { id: "cbg", label: "Consumer Goods", emoji: "🛒" },
  { id: "bfsi", label: "Banking & Finance", emoji: "🏦" },
  { id: "lshc", label: "Life Sciences", emoji: "🧬" },
];

export function Header() {
  const vertical = useStore((s) => s.vertical);
  const setVertical = useStore((s) => s.setVertical);
  const sidebarOpen = useStore((s) => s.sidebarOpen);
  const toggleSidebar = useStore((s) => s.toggleSidebar);
  const user = useStore((s) => s.user);
  const logout = useStore((s) => s.logout);

  const handleReturnToPortal = () => {
    logout();
    if (typeof window !== "undefined") {
      window.history.pushState({ view: "starter" }, "", "/");
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    console.log("Link copied to clipboard");
  };

  return (
    <header className="flex items-center justify-between border-b border-border bg-card px-4 py-2.5 shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
        </button>

        {/* Modern clean DataForge logo branding */}
        <div className="flex items-center gap-2 select-none">
          <span className="text-base font-bold tracking-tight text-foreground">
            Data<span className="text-primary font-bold">Forge</span>
          </span>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" title="System Operational" />
        </div>

        {/* Direct Back to Portal Button */}
        <button
          onClick={handleReturnToPortal}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary border border-border/60 transition-colors ml-1"
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
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 transition-all shadow-sm"
          title="Open NVIDIA NeMo Switchyard & Relay Traces Dashboard in a new tab"
        >
          <GitFork size={13} className="text-cyan-400" />
          <span className="hidden md:inline">NeMo Traces</span>
          <ExternalLink size={11} className="text-cyan-400/80" />
        </a>

        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title="Copy link to clipboard"
        >
          <Link size={14} />
          <span>Share</span>
        </button>
      </div>


      <div className="flex items-center gap-3">
        {/* Industry Vertical Selector */}
        <div className="flex items-center gap-1 bg-secondary rounded-lg p-0.5">
          {VERTICALS.map((v) => (
            <button
              key={v.id}
              onClick={() => setVertical(v.id)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                vertical === v.id
                  ? "bg-card text-foreground shadow-sm font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>{v.emoji}</span>
              <span className="hidden md:inline">{v.label}</span>
            </button>
          ))}
        </div>

        {/* User Account / Sign Out */}
        <div className="flex items-center gap-2 pl-2 border-l border-border/60">
          <div className="hidden lg:flex flex-col items-end">
            <span className="text-[11px] font-semibold text-foreground leading-tight">
              {user?.name || "Enterprise User"}
            </span>
            <span className="text-[9px] text-muted-foreground leading-none">
              {user?.role || "Analytics"}
            </span>
          </div>
          <button
            onClick={handleReturnToPortal}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            title="Sign Out / Return to Product Overview"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </header>
  );
}