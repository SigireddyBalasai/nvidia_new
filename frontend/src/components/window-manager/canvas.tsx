"use client"

import { Rnd } from "react-rnd"
import { useWindowManager } from "./context"
import type { FullWindow } from "./types"
import { Button } from "@/components/ui/button"

function WindowFrame({ win }: { win: FullWindow }) {
  const {
    closeWindow,
    minimizeWindow,
    maximizeWindow,
    restoreWindow,
    bringToFront,
    updatePosition,
    updateSize,
  } = useWindowManager()

  if (!win.isOpen || win.isMinimized) return null

  const Content = win.component

  return (
    <Rnd
      size={{ width: win.size.width, height: win.size.height }}
      position={{ x: win.position.x, y: win.position.y }}
      onDragStop={(_, data) => {
        updatePosition(win.id, { x: data.x, y: data.y })
      }}
      onResizeStop={(_, __, ref, ____, pos) => {
        updateSize(win.id, {
          width: parseInt(ref.style.width),
          height: parseInt(ref.style.height),
        })
        updatePosition(win.id, pos)
      }}
      onMouseDown={() => bringToFront(win.id)}
      dragHandleClassName="window-drag-handle"
      minWidth={200}
      minHeight={150}
      bounds="parent"
    >
      <div
        className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-background shadow-lg"
        style={{ zIndex: win.zIndex }}
      >
        {/* Title bar */}
        <div className="window-drag-handle flex cursor-grab items-center border-b border-border bg-muted/50 px-4 py-2 active:cursor-grabbing">
          <span className="truncate text-sm font-medium">{win.title}</span>
          <div className="ml-auto flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={() => minimizeWindow(win.id)}
              title="Minimize"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-3">
                <path d="M5 12h14" />
              </svg>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={() =>
                win.isMaximized ? restoreWindow(win.id) : maximizeWindow(win.id)
              }
              title={win.isMaximized ? "Restore" : "Maximize"}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-3">
                {win.isMaximized ? (
                  <path d="M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3" />
                ) : (
                  <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                )}
              </svg>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={() => closeWindow(win.id)}
              title="Close"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-3">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          <Content windowId={win.id} />
        </div>
      </div>
    </Rnd>
  )
}

export function WindowCanvas() {
  const { windows } = useWindowManager()
  const entries = Array.from(windows.values())

  return (
    <div className="relative flex-1 overflow-hidden">
      {entries.map((win) => (
        <WindowFrame key={win.id} win={win} />
      ))}
    </div>
  )
}
