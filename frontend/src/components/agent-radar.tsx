import { useStore } from "@/lib/store"

export function AgentRadar() {
  const { steps, currentStepNumber, totalSteps } = useStore()

  const activeStep = steps.find((s) => s.status !== "started" && s.status !== "idle")

  return (
    <div className="p-3 border-t border-border bg-card/50">
      <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
        Agent Activity
      </h3>
      {activeStep ? (
        <div className="mt-2 text-[10px]">
          <span className="font-medium">{activeStep.step}</span>: {activeStep.status}
        </div>
      ) : (
        <p className="text-[10px] text-muted-foreground">No active steps</p>
      )}
      <p className="mt-2 text-[10px] text-muted-foreground">
        Step {currentStepNumber + 1} of {totalSteps}
      </p>
    </div>
  )
}