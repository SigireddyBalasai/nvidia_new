import { useState } from "react"
import {
  CheckCircle2,
  XCircle,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Shield,
  Send,
} from "lucide-react"

interface ActionRequest {
  name: string
  args: Record<string, unknown>
}

interface ReviewConfig {
  action_name: string
  allowed_decisions: string[]
}

interface InterruptData {
  action_requests: ActionRequest[]
  review_configs: ReviewConfig[]
}

interface InterruptApprovalCardProps {
  interrupt: InterruptData
  onApprove: () => void
  onReject: (message?: string) => void
  onRespond: (message: string) => void
}

export function InterruptApprovalCard({
  interrupt,
  onApprove,
  onReject,
  onRespond,
}: InterruptApprovalCardProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [respondText, setRespondText] = useState("")
  const [showRespondInput, setShowRespondInput] = useState(false)

  const { action_requests, review_configs } = interrupt

  const getConfigForAction = (name: string): ReviewConfig | undefined =>
    review_configs.find((rc) => rc.action_name === name)

  const canApprove = action_requests.every((ar) =>
    getConfigForAction(ar.name)?.allowed_decisions.includes("approve")
  )
  const canReject = action_requests.every((ar) =>
    getConfigForAction(ar.name)?.allowed_decisions.includes("reject")
  )
  const canRespond = action_requests.every((ar) =>
    getConfigForAction(ar.name)?.allowed_decisions.includes("respond")
  )

  return (
    <div className="max-w-[85%] overflow-hidden rounded-xl border border-amber-500/30 bg-amber-500/5">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-amber-500/10"
      >
        <Shield size={14} className="shrink-0 text-amber-500" />
        <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
          Approval Required
        </span>
        <span className="ml-1 text-[10px] text-muted-foreground">
          {action_requests.length} action{action_requests.length > 1 ? "s" : ""}
        </span>
        <div className="flex-1" />
        {isExpanded ? (
          <ChevronUp size={12} className="text-amber-500" />
        ) : (
          <ChevronDown size={12} className="text-amber-500" />
        )}
      </button>

      {/* Action details */}
      {isExpanded && (
        <div className="space-y-3 border-t border-amber-500/20 px-4 pb-4">
          {action_requests.map((action, i) => {
            const config = getConfigForAction(action.name)
            return (
              <div key={i} className="mt-3">
                <div className="mb-1.5 flex items-center gap-2">
                  <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs font-semibold text-foreground">
                    {action.name}
                  </code>
                  {config && (
                    <span className="text-[9px] text-muted-foreground">
                      {config.allowed_decisions.join(" / ")}
                    </span>
                  )}
                </div>
                <pre className="max-h-40 overflow-x-auto overflow-y-auto rounded-lg bg-muted/50 p-2.5 text-[11px] whitespace-pre-wrap text-muted-foreground">
                  {JSON.stringify(action.args, null, 2)}
                </pre>
              </div>
            )
          })}

          {/* Respond text input */}
          {showRespondInput && (
            <div className="mt-2">
              <textarea
                value={respondText}
                onChange={(e) => setRespondText(e.target.value)}
                placeholder="Type your response..."
                className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-xs focus:ring-2 focus:ring-primary/30 focus:outline-none"
                rows={2}
              />
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-1">
            {canApprove && (
              <button
                onClick={onApprove}
                className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-green-700"
              >
                <CheckCircle2 size={12} />
                Approve
              </button>
            )}
            {canReject && (
              <button
                onClick={() => onReject()}
                className="text-destructive-foreground flex items-center gap-1.5 rounded-lg bg-destructive px-3 py-1.5 text-xs font-medium transition-colors hover:bg-destructive/90"
              >
                <XCircle size={12} />
                Reject
              </button>
            )}
            {canRespond && (
              <>
                {!showRespondInput ? (
                  <button
                    onClick={() => setShowRespondInput(true)}
                    className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent"
                  >
                    <MessageSquare size={12} />
                    Respond
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (respondText.trim()) {
                        onRespond(respondText.trim())
                        setRespondText("")
                        setShowRespondInput(false)
                      }
                    }}
                    disabled={!respondText.trim()}
                    className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                  >
                    <Send size={12} />
                    Send Response
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
