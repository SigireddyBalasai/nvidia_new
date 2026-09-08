# Window Manager Refactor Design

## Goal

Replace the custom A2UI floating window system with a clean, library-backed window manager using `react-rnd`, featuring a right-side dock for window access.

## Current State

- `A2UIFloatingWindowContext.tsx` — custom window state management (267 lines)
- `DraggableFloatingWindow.tsx` — custom drag/resize with mouse events (234 lines)
- `CustomA2UIMessageRenderer.tsx` — duplicate drag/resize logic for MCP apps (282 lines)
- `A2UIPreviewCard.tsx` — preview cards for surfaces (79 lines)
- `copilot-tools.tsx` — pie chart floating windows with duplicate drag logic (159 lines)

**Problems:**
- Duplicate drag/resize mouse event handlers across 3 files
- No centralized window registry
- Each component manages its own window state independently
- 46 unused UI components in `components/ui/`

## Target Architecture

```
┌────────────────────────────────┬──────────┐
│                                │          │
│        CANVAS                  │   DOCK   │
│                                │          │
│  ┌──────────┐  ┌──────────┐   │  [Win1]  │
│  │ Window 1 │  │ Window 2 │   │  [Win2]  │
│  │ (rnd)    │  │ (rnd)    │   │  [Win3]  │
│  └──────────┘  └──────────┘   │          │
│                                │          │
│  ┌──────────────────────┐     │          │
│  │     Window 3         │     │          │
│  │     (rnd)            │     │          │
│  └──────────────────────┘     │          │
└────────────────────────────────┴──────────┘
```

## Components

### 1. `WindowManagerContext` (refactored from `A2UIFloatingWindowContext`)

```typescript
type WindowEntry = {
  id: string
  title: string
  icon?: React.ReactNode
  component: React.ComponentType<WindowContentProps>
  props?: Record<string, unknown>
}

type WindowState = {
  isOpen: boolean
  isMinimized: boolean
  isMaximized: boolean
  position: { x: number; y: number }
  size: { width: number; height: number }
  zIndex: number
}

type WindowManagerContextValue = {
  windows: Map<string, WindowEntry & WindowState>
  registerWindow: (entry: WindowEntry) => void
  unregisterWindow: (id: string) => void
  openWindow: (id: string) => void
  closeWindow: (id: string) => void
  minimizeWindow: (id: string) => void
  maximizeWindow: (id: string) => void
  restoreWindow: (id: string) => void
  bringToFront: (id: string) => void
  updatePosition: (id: string, pos: { x: number; y: number }) => void
  updateSize: (id: string, size: { width: number; height: number }) => void
}
```

### 2. `WindowDock` (new)

Right-side dock component:
- Lists all registered windows as buttons
- Click toggles open/minimize
- Visual indicator for open vs minimized windows
- Drag from dock to set initial window position

### 3. `WindowCanvas` (new)

Main canvas area:
- Renders all open windows as `<Rnd>` components
- Handles drag, resize via `react-rnd`
- Minimize collapses to dock, maximize fills canvas
- z-index stacking on click

### 4. `WindowManager` (new)

Root provider combining context + dock + canvas:
- Wraps `WindowManagerContextProvider`
- Renders `WindowDock` (right) and `WindowCanvas` (center)

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/window-manager/context.tsx` | Window state context |
| `src/components/window-manager/dock.tsx` | Right-side dock |
| `src/components/window-manager/canvas.tsx` | RND window renderer |
| `src/components/window-manager/index.ts` | Exports |
| `src/components/window-manager/types.ts` | Shared types |

## Files to Delete

| File | Reason |
|------|--------|
| `src/components/a2ui/DraggableFloatingWindow.tsx` | Replaced by react-rnd |
| `src/components/a2ui/A2UIPreviewCard.tsx` | Replaced by dock |

## Files to Refactor

| File | Changes |
|------|---------|
| `src/components/a2ui/A2UIFloatingWindowContext.tsx` | Replace with `window-manager/context.tsx` |
| `src/components/a2ui/CustomA2UIMessageRenderer.tsx` | Use WindowManager instead of portals + duplicate drag |
| `src/components/copilot-tools.tsx` | Use WindowManager instead of custom PieChartWindow |
| `src/routes/__root.tsx` | Wrap with `WindowManager` instead of `A2UIFloatingWindowContextProvider` |
| `src/components/a2ui/index.ts` | Update exports |

## Dependencies

- Add: `react-rnd` (drag + resize)
- Remove: None (react-draggable and react-resizable are transitive deps of react-rnd)

## UI Component Cleanup

Delete unused components from `src/components/ui/`:
- accordion, alert-dialog, aspect-ratio, avatar, breadcrumb, calendar, carousel
- collapsible, command, combobox, context-menu, direction, dropdown-menu
- empty, field, hover-card, input-otp, item, kbd, marker, message
- message-scroller, menubar, native-select, pagination, popover, progress
- questionnaire, radio-group, resizable, select, sheet, skeleton
- switch, table, tabs, toggle-group

Keep only: button, card, badge, chart, dialog, input, label, separator, textarea, tooltip

## Success Criteria

- All A2UI windows render via `react-rnd`
- Dock shows all registered windows on the right
- Click dock button toggles window open/minimize
- Drag, resize, minimize, maximize all work
- No duplicate drag/resize code
- All unused UI components removed
- Existing functionality (pie charts, MCP apps) still works
