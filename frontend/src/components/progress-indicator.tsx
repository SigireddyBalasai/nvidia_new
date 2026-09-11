import { useStore } from "@/lib/store"
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  SkipForward,
} from "lucide-react"

export function ProgressIndicator() {
  const steps = useStore((s) => s.steps)
  const isProcessing = useStore((s) => s.isProcessing)

  if (!isProcessing && steps.length === 0) {
    return null
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "started":
        return <Loader2 size={10} className="animate-spin text-primary" />
      case "completed":
        return <CheckCircle2 size={10} className="text-green-500" />
      case "failed":
        return <XCircle size={10} className="text-destructive" />
      case "skipped":
        return <SkipForward size={10} className="text-muted-foreground" />
      default:
        return <Clock size={10} className="text-muted-foreground" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "started":
        return "text-primary"
      case "completed":
        return "text-green-500"
      case "failed":
        return "text-destructive"
      case "skipped":
        return "text-muted-foreground"
      default:
        return "text-muted-foreground"
    }
  }

  return (
    <div className="px-4 pb-3">
      <div className="space-y-1.5">
        {steps.map((step) => (
          <div
            key={step.step}
            className="flex items-center gap-2 rounded-md border border-border/40 bg-card/50 px-2 py-1"
          >
            {getStatusIcon(step.status)}
            <div className="min-w-0 flex-1">
              <p
                className={`text-[10px] font-medium ${getStatusColor(step.status)} truncate`}
              >
                {step.step}
              </p>
              {step.detail && (
                <p className="truncate text-[8px] text-muted-foreground">
                  {step.detail}
                </p>
              )}
            </div>
            {step.duration_ms !== undefined && (
              <span className="font-mono text-[8px] text-muted-foreground">
                {step.duration_ms}ms
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
