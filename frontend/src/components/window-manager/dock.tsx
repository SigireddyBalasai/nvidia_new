"use client"

import { useWindowManager } from "./context"
import type { FullWindow } from "./types"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ExternalLinkIcon } from "lucide-react"

function DockButton({ win }: { win: FullWindow }) {
  const { openWindow, restoreWindow, bringToFront } = useWindowManager()

  const handleClick = () => {
    if (!win.isOpen) {
      openWindow(win.id)
    } else if (win.isMinimized) {
      restoreWindow(win.id)
    } else {
      bringToFront(win.id)
    }
  }

  return (
    <div className="group flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleClick}
        className={cn(
          "flex-1 justify-start gap-2 px-3",
          win.isOpen && !win.isMinimized && "bg-primary/10 text-primary"
        )}
        title={win.title}
      >
        {win.icon && <span className="shrink-0 size-4">{win.icon}</span>}
        <span className="truncate">{win.title}</span>
        {win.isOpen && !win.isMinimized && (
          <span className="ml-auto size-2 rounded-full bg-primary" />
        )}
      </Button>
      {win.isOpen && (
        <Button
          variant="ghost"
          size="icon"
          className="size-7 shrink-0 opacity-0 group-hover:opacity-100"
          onClick={handleClick}
          title="Focus window"
        >
          <ExternalLinkIcon className="size-3" />
        </Button>
      )}
    </div>
  )
}

export function WindowDock() {
  const { windows } = useWindowManager()
  const entries = Array.from(windows.values())

  if (entries.length === 0) return null

  return (
    <div className="flex h-full w-48 shrink-0 flex-col border-l border-border bg-muted/30 p-2">
      <div className="mb-2 px-3 text-xs font-medium uppercase text-muted-foreground">
        Windows
      </div>
      <div className="flex flex-1 flex-col gap-1 overflow-y-auto">
        {entries.map((win) => (
          <DockButton key={win.id} win={win} />
        ))}
      </div>
    </div>
  )
}
