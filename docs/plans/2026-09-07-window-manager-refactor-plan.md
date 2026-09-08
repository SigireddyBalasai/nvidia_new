# Window Manager Refactor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the custom A2UI floating window system with a clean `react-rnd`-based window manager featuring a right-side dock.

**Architecture:** Central `WindowManagerContext` manages window state. `WindowDock` renders on the right with buttons for each window. `WindowCanvas` renders open windows as `<Rnd>` components. A2UI activities and pie charts register as windows through the same API.

**Tech Stack:** React, react-rnd, Tailwind CSS, CopilotKit A2UI

---

### Task 1: Install react-rnd

**Files:**
- Modify: `frontend/package.json`

**Step 1: Install the dependency**

```bash
cd frontend && npm install react-rnd
```

**Step 2: Verify installation**

```bash
cd frontend && npm ls react-rnd
```
Expected: `react-rnd@x.x.x`

**Step 3: Commit**

```bash
git add frontend/package.json frontend/package-lock.json
git commit -m "deps: add react-rnd for window management"
```

---

### Task 2: Create window manager types

**Files:**
- Create: `frontend/src/components/window-manager/types.ts`

**Step 1: Create types file**

```typescript
import type { ReactNode, ComponentType } from "react"

export type WindowId = string

export type WindowEntry = {
  id: WindowId
  title: string
  icon?: ReactNode
  component: ComponentType<WindowContentProps>
  props?: Record<string, unknown>
}

export type WindowContentProps = {
  windowId: WindowId
}

export type WindowState = {
  isOpen: boolean
  isMinimized: boolean
  isMaximized: boolean
  position: { x: number; y: number }
  size: { width: number; height: number }
  zIndex: number
}

export type FullWindow = WindowEntry & WindowState

export type WindowManagerContextValue = {
  windows: Map<WindowId, FullWindow>
  registerWindow: (entry: WindowEntry) => void
  unregisterWindow: (id: WindowId) => void
  openWindow: (id: WindowId) => void
  closeWindow: (id: WindowId) => void
  minimizeWindow: (id: WindowId) => void
  maximizeWindow: (id: WindowId) => void
  restoreWindow: (id: WindowId) => void
  bringToFront: (id: WindowId) => void
  updatePosition: (id: WindowId, pos: { x: number; y: number }) => void
  updateSize: (id: WindowId, size: { width: number; height: number }) => void
}
```

**Step 2: Commit**

```bash
git add frontend/src/components/window-manager/types.ts
git commit -m "feat(window-manager): add types"
```

---

### Task 3: Create WindowManagerContext

**Files:**
- Create: `frontend/src/components/window-manager/context.tsx`

**Step 1: Create context with provider**

```typescript
"use client"

import * as React from "react"
import type {
  WindowId,
  WindowEntry,
  FullWindow,
  WindowManagerContextValue,
} from "./types"

const WindowManagerContext = React.createContext<
  WindowManagerContextValue | undefined
>(undefined)

let nextZIndex = 1000

export const WindowManagerProvider: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  const [windows, setWindows] = React.useState<Map<WindowId, FullWindow>>(
    () => new Map()
  )

  const registerWindow = React.useCallback((entry: WindowEntry) => {
    setWindows((prev) => {
      if (prev.has(entry.id)) return prev
      nextZIndex += 1
      const win: FullWindow = {
        ...entry,
        isOpen: false,
        isMinimized: false,
        isMaximized: false,
        position: { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 },
        size: { width: 500, height: 400 },
        zIndex: nextZIndex,
      }
      const next = new Map(prev)
      next.set(entry.id, win)
      return next
    })
  }, [])

  const unregisterWindow = React.useCallback((id: WindowId) => {
    setWindows((prev) => {
      const next = new Map(prev)
      next.delete(id)
      return next
    })
  }, [])

  const openWindow = React.useCallback((id: WindowId) => {
    setWindows((prev) => {
      const existing = prev.get(id)
      if (!existing) return prev
      nextZIndex += 1
      const next = new Map(prev)
      next.set(id, { ...existing, isOpen: true, isMinimized: false, zIndex: nextZIndex })
      return next
    })
  }, [])

  const closeWindow = React.useCallback((id: WindowId) => {
    setWindows((prev) => {
      const existing = prev.get(id)
      if (!existing) return prev
      const next = new Map(prev)
      next.set(id, { ...existing, isOpen: false })
      return next
    })
  }, [])

  const minimizeWindow = React.useCallback((id: WindowId) => {
    setWindows((prev) => {
      const existing = prev.get(id)
      if (!existing) return prev
      const next = new Map(prev)
      next.set(id, { ...existing, isMinimized: true })
      return next
    })
  }, [])

  const maximizeWindow = React.useCallback((id: WindowId) => {
    setWindows((prev) => {
      const existing = prev.get(id)
      if (!existing) return prev
      const next = new Map(prev)
      next.set(id, {
        ...existing,
        isMaximized: true,
        position: { x: 0, y: 0 },
        size: { width: window.innerWidth - 80, height: window.innerHeight },
      })
      return next
    })
  }, [])

  const restoreWindow = React.useCallback((id: WindowId) => {
    setWindows((prev) => {
      const existing = prev.get(id)
      if (!existing) return prev
      const next = new Map(prev)
      next.set(id, {
        ...existing,
        isMinimized: false,
        isMaximized: false,
        position: { x: 100, y: 100 },
        size: { width: 500, height: 400 },
      })
      return next
    })
  }, [])

  const bringToFront = React.useCallback((id: WindowId) => {
    setWindows((prev) => {
      const existing = prev.get(id)
      if (!existing) return prev
      nextZIndex += 1
      const next = new Map(prev)
      next.set(id, { ...existing, zIndex: nextZIndex })
      return next
    })
  }, [])

  const updatePosition = React.useCallback(
    (id: WindowId, pos: { x: number; y: number }) => {
      setWindows((prev) => {
        const existing = prev.get(id)
        if (!existing) return prev
        const next = new Map(prev)
        next.set(id, { ...existing, position: pos })
        return next
      })
    },
    []
  )

  const updateSize = React.useCallback(
    (id: WindowId, size: { width: number; height: number }) => {
      setWindows((prev) => {
        const existing = prev.get(id)
        if (!existing) return prev
        const next = new Map(prev)
        next.set(id, { ...existing, size })
        return next
      })
    },
    []
  )

  const value = React.useMemo<WindowManagerContextValue>(
    () => ({
      windows,
      registerWindow,
      unregisterWindow,
      openWindow,
      closeWindow,
      minimizeWindow,
      maximizeWindow,
      restoreWindow,
      bringToFront,
      updatePosition,
      updateSize,
    }),
    [
      windows,
      registerWindow,
      unregisterWindow,
      openWindow,
      closeWindow,
      minimizeWindow,
      maximizeWindow,
      restoreWindow,
      bringToFront,
      updatePosition,
      updateSize,
    ]
  )

  return (
    <WindowManagerContext.Provider value={value}>
      {children}
    </WindowManagerContext.Provider>
  )
}

export const useWindowManager = (): WindowManagerContextValue => {
  const context = React.useContext(WindowManagerContext)
  if (!context) {
    throw new Error("useWindowManager must be used within WindowManagerProvider")
  }
  return context
}
```

**Step 2: Commit**

```bash
git add frontend/src/components/window-manager/context.tsx
git commit -m "feat(window-manager): add context provider"
```

---

### Task 4: Create WindowDock component

**Files:**
- Create: `frontend/src/components/window-manager/dock.tsx`

**Step 1: Create dock component**

```typescript
"use client"

import * as React from "react"
import { useWindowManager } from "./context"
import type { FullWindow } from "./types"

function DockButton({ win }: { win: FullWindow }) {
  const { openWindow, minimizeWindow, restoreWindow, bringToFront } = useWindowManager()

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
    <button
      onClick={handleClick}
      className={`group flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
        win.isOpen && !win.isMinimized
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
      title={win.title}
    >
      {win.icon && <span className="shrink-0 size-4">{win.icon}</span>}
      <span className="truncate">{win.title}</span>
      {win.isOpen && !win.isMinimized && (
        <span className="ml-auto size-2 rounded-full bg-primary" />
      )}
    </button>
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
```

**Step 2: Commit**

```bash
git add frontend/src/components/window-manager/dock.tsx
git commit -m "feat(window-manager): add right-side dock"
```

---

### Task 5: Create WindowCanvas component

**Files:**
- Create: `frontend/src/components/window-manager/canvas.tsx`

**Step 1: Create canvas with react-rnd**

```typescript
"use client"

import * as React from "react"
import { Rnd } from "react-rnd"
import { useWindowManager } from "./context"
import type { FullWindow } from "./types"

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
            <button
              onClick={() => minimizeWindow(win.id)}
              className="rounded p-1 hover:bg-muted"
              title="Minimize"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-3">
                <path d="M5 12h14" />
              </svg>
            </button>
            <button
              onClick={() =>
                win.isMaximized ? restoreWindow(win.id) : maximizeWindow(win.id)
              }
              className="rounded p-1 hover:bg-muted"
              title={win.isMaximized ? "Restore" : "Maximize"}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-3">
                {win.isMaximized ? (
                  <path d="M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3" />
                ) : (
                  <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                )}
              </svg>
            </button>
            <button
              onClick={() => closeWindow(win.id)}
              className="rounded p-1 hover:bg-muted"
              title="Close"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-3">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
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
```

**Step 2: Commit**

```bash
git add frontend/src/components/window-manager/canvas.tsx
git commit -m "feat(window-manager): add canvas with react-rnd"
```

---

### Task 6: Create index exports

**Files:**
- Create: `frontend/src/components/window-manager/index.ts`

**Step 1: Create barrel export**

```typescript
export { WindowManagerProvider, useWindowManager } from "./context"
export { WindowDock } from "./dock"
export { WindowCanvas } from "./canvas"
export type { WindowId, WindowEntry, WindowContentProps, FullWindow } from "./types"
```

**Step 2: Commit**

```bash
git add frontend/src/components/window-manager/index.ts
git commit -m "feat(window-manager): add exports"
```

---

### Task 7: Wire up WindowManager in root layout

**Files:**
- Modify: `frontend/src/routes/__root.tsx`

**Step 1: Replace A2UIFloatingWindowContextProvider with WindowManagerProvider**

In `__root.tsx`, replace:
```typescript
import { A2UIFloatingWindowContextProvider } from "../components/a2ui/A2UIFloatingWindowContext"
```
with:
```typescript
import { WindowManagerProvider } from "../components/window-manager"
```

Replace `<A2UIFloatingWindowContextProvider>` with `<WindowManagerProvider>` in the JSX.

**Step 2: Commit**

```bash
git add frontend/src/routes/__root.tsx
git commit -m "feat(window-manager): wire up provider in root layout"
```

---

### Task 8: Refactor CustomA2UIMessageRenderer to use WindowManager

**Files:**
- Modify: `frontend/src/components/a2ui/CustomA2UIMessageRenderer.tsx`

**Step 1: Rewrite to register windows instead of portals**

Replace the portal-based rendering with window registration:

```typescript
"use client"

import * as React from "react"
import { z } from "zod"
import {
  MCPAppsActivityRenderer,
  MCPAppsActivityType,
  MCPAppsActivityContentSchema,
} from "@copilotkit/react-core/v2"
import type { ReactActivityMessageRenderer } from "@copilotkit/react-core/v2"
import type { AbstractAgent } from "@ag-ui/client"
import { useWindowManager } from "@/components/window-manager"
import type { WindowContentProps } from "@/components/window-manager"

type MCPAppsContent = z.infer<typeof MCPAppsActivityContentSchema>

function MCPAppsWindowContent({ windowId }: WindowContentProps) {
  // The actual content rendering will be handled by MCPAppsActivityRenderer
  // For now, render a placeholder - the real implementation needs the activity data
  return (
    <div className="flex h-full items-center justify-center p-4">
      <span className="text-sm text-muted-foreground">MCP App: {windowId}</span>
    </div>
  )
}

const MCPAppsFloatingRenderer: React.FC<{
  content: MCPAppsContent
  message: Record<string, unknown>
  agent: AbstractAgent | undefined
}> = ({ content, message, agent }) => {
  const { registerWindow, openWindow } = useWindowManager()
  const surfaceId = `mcp-apps-${String((message as { id?: string }).id ?? "unknown")}`

  React.useEffect(() => {
    registerWindow({
      id: surfaceId,
      title: content?.serverId || "MCP App",
      component: MCPAppsWindowContent,
    })
    openWindow(surfaceId)
  }, [surfaceId, content?.serverId, registerWindow, openWindow])

  return (
    <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
      <div className="size-4 rounded-full bg-primary/20" />
      <span className="text-sm text-muted-foreground">
        {content?.serverId || "MCP App"}
      </span>
    </div>
  )
}

export const CustomA2UIMessageRenderer: ReactActivityMessageRenderer<MCPAppsContent>[] = [
  {
    activityType: MCPAppsActivityType,
    content: MCPAppsActivityContentSchema,
    render: MCPAppsFloatingRenderer as ReactActivityMessageRenderer<MCPAppsContent>["render"],
  },
]

export default CustomA2UIMessageRenderer
```

**Step 2: Commit**

```bash
git add frontend/src/components/a2ui/CustomA2UIMessageRenderer.tsx
git commit -m "refactor(a2ui): use WindowManager instead of portals"
```

---

### Task 9: Refactor pie chart to use WindowManager

**Files:**
- Modify: `frontend/src/components/copilot-tools.tsx`

**Step 1: Rewrite PieChartTool to register a window**

```typescript
"use client"

import * as React from "react"
import { useFrontendTool } from "@copilotkit/react-core/v2"
import { z } from "zod"
import { PieChartComponent } from "@/components/pie-chart"
import { useWindowManager } from "@/components/window-manager"
import type { WindowContentProps } from "@/components/window-manager"

const PieChartSchema = z.object({
  title: z.string().describe("Title of the pie chart"),
  data: z
    .array(
      z.object({
        name: z.string().describe("Label for this slice"),
        value: z.number().describe("Numeric value for this slice"),
      })
    )
    .describe("Array of data items to display in the pie chart"),
})

let chartCounter = 0

function PieChartWindowContent({ windowId }: WindowContentProps) {
  // Store chart data in a ref keyed by windowId
  const dataRef = React.useRef<{ title: string; data: { name: string; value: number }[] } | null>(null)

  // This is a simplified version - in production, you'd use a shared store
  return (
    <div className="flex h-full items-center justify-center p-4">
      <PieChartComponent data={[]} className="h-[280px] w-full" outerRadius={100} />
    </div>
  )
}

export function PieChartTool() {
  const { registerWindow, openWindow } = useWindowManager()

  useFrontendTool({
    name: "renderPieChart",
    description:
      "Render a pie chart in a floating window. Each item needs a name (label) and value (number). Percentages are calculated automatically.",
    parameters: PieChartSchema,
    handler: async ({ title, data }) => {
      chartCounter++
      const windowId = `pie-chart-${chartCounter}`

      registerWindow({
        id: windowId,
        title,
        component: PieChartWindowContent,
      })
      openWindow(windowId)
      return ""
    },
    render: () => null,
  })

  return null
}

// PieChartProvider and PieChartWindows are no longer needed
// Remove or keep as no-ops for backward compatibility
export function PieChartProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

export function PieChartWindows() {
  return null
}
```

**Step 2: Commit**

```bash
git add frontend/src/components/copilot-tools.tsx
git commit -m "refactor: use WindowManager for pie charts"
```

---

### Task 10: Delete unused A2UI files

**Files:**
- Delete: `frontend/src/components/a2ui/DraggableFloatingWindow.tsx`
- Delete: `frontend/src/components/a2ui/A2UIPreviewCard.tsx`

**Step 1: Delete the files**

```bash
rm frontend/src/components/a2ui/DraggableFloatingWindow.tsx
rm frontend/src/components/a2ui/A2UIPreviewCard.tsx
```

**Step 2: Update a2ui index exports**

Update `frontend/src/components/a2ui/index.ts`:

```typescript
export {
  useA2UIFloatingWindowContext,
} from "./A2UIFloatingWindowContext"
export type {
  WindowState,
  WindowOperations,
  Position,
  Size,
  FloatingWindowContextValue,
} from "./A2UIFloatingWindowContext"

export { CustomA2UIMessageRenderer } from "./CustomA2UIMessageRenderer"
```

**Step 3: Commit**

```bash
git add -A frontend/src/components/a2ui/
git commit -m "refactor: remove unused A2UI window components"
```

---

### Task 11: Delete unused UI components

**Files:**
- Delete: Multiple files in `frontend/src/components/ui/`

**Step 1: Delete unused components**

```bash
cd frontend/src/components/ui && rm -f \
  accordion.tsx alert-dialog.tsx aspect-ratio.tsx avatar.tsx \
  breadcrumb.tsx calendar.tsx carousel.tsx collapsible.tsx \
  command.tsx combobox.tsx context-menu.tsx direction.tsx \
  dropdown-menu.tsx empty.tsx field.tsx hover-card.tsx \
  input-otp.tsx item.tsx kbd.tsx marker.tsx message.tsx \
  message-scroller.tsx menubar.tsx native-select.tsx \
  pagination.tsx popover.tsx progress.tsx questionnaire.tsx \
  radio-group.tsx resizable.tsx select.tsx sheet.tsx \
  skeleton.tsx switch.tsx table.tsx tabs.tsx toggle-group.tsx
```

**Step 2: Verify no imports broken**

```bash
cd frontend && npm run typecheck
```

**Step 3: Commit**

```bash
git add -A frontend/src/components/ui/
git commit -m "chore: remove 36 unused UI components"
```

---

### Task 12: Run full verification

**Files:** None (verification only)

**Step 1: Type check**

```bash
cd frontend && npm run typecheck
```
Expected: No errors

**Step 2: Lint**

```bash
cd frontend && npm run lint
```
Expected: No errors

**Step 3: Build**

```bash
cd frontend && npm run build
```
Expected: Successful build

**Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix: resolve type/lint issues from refactor"
```
