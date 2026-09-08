# A2UI Floating Window Design

## Overview
Render agent-generated UI components (a2ui output) in a draggable floating window with a preview in the chat, instead of only inline in chat messages.

## Requirements
- **Trigger**: Floating window appears automatically when agent renders a2ui components
- **Behavior**: Fully draggable anywhere on screen
- **Preview**: Small preview card in chat that opens the floating window
- **Content**: Agent-generated UI components (forms, charts, cards, tables)

## Architecture

### Component Structure
```
CopilotKitProvider (with custom renderActivityMessages)
  └── CustomA2UIMessageRenderer
        ├── Inline Preview (in chat message)
        └── Portal → DraggableFloatingWindow
              └── A2UIProvider + A2UIRenderer (full surface)
```

### Key Components

#### 1. `A2UIFloatingWindowContext` (React Context)
Manages global state for all floating windows:
- `windows: Map<surfaceId, WindowState>`
- `WindowState`: { surfaceId, operations, isOpen, position, size, zIndex }
- Actions: `openWindow`, `closeWindow`, `updatePosition`, `updateSize`, `bringToFront`

#### 2. `DraggableFloatingWindow` Component
- Renders via React Portal to `document.body`
- Draggable header with title, minimize/close buttons
- Resizable (bottom-right handle)
- Contains `A2UIProvider` + `A2UIRenderer` for the surface
- Manages own position/size state, syncs to context

#### 3. `CustomA2UIMessageRenderer` 
Extends `createA2UIMessageRenderer`:
- Returns renderer object with custom `render` function
- `render` returns:
  - **Inline**: Preview card showing surface title + "Open in Window" button
  - **Portal**: `DraggableFloatingWindow` for each surface (when open)

#### 4. `A2UIPreviewCard` Component
- Compact preview of a2ui surface
- Shows surface title/icon
- "Open in Window" button
- Click to open floating window

### Data Flow
1. Agent generates a2ui operations → `a2ui-surface` activity message
2. `CustomA2UIMessageRenderer` receives activity content
3. Extracts operations grouped by `surfaceId`
4. Stores operations in `A2UIFloatingWindowContext`
5. Renders inline `A2UIPreviewCard` for each surface
6. When user clicks "Open" (or auto-open), sets `isOpen=true` in context
7. `DraggableFloatingWindow` reads from context, renders full surface via portal

### Auto-Open Behavior
- On first render of a new surface, auto-open the floating window
- Subsequent surfaces: add to context, user can open via preview card
- Window persists across agent turns (operations update in place)

### Integration Points
- **CopilotKitProvider**: Add custom renderer to `renderActivityMessages`
- **Root Layout**: Wrap app with `A2UIFloatingWindowProvider`
- **Styles**: Add floating window CSS (z-index, shadows, animations)

## Technical Details

### Custom Renderer Implementation
```typescript
const customA2UIRenderer = createA2UIMessageRenderer({
  theme,
  catalog,
  loadingComponent,
  recovery,
  // Custom render function that returns preview + portal
  render: ({ content, agent }) => {
    // Extract operations, store in context
    // Return preview cards inline
    // Portal renders DraggableFloatingWindow components
  }
});
```

### Portal Rendering
```tsx
// In CustomA2UIMessageRenderer render function
return (
  <>
    {/* Inline previews */}
    {surfaces.map(surface => (
      <A2UIPreviewCard key={surface.id} surface={surface} />
    ))}
    
    {/* Portal to floating windows */}
    {Array.from(openWindows).map(window => (
      createPortal(
        <DraggableFloatingWindow surfaceId={window.surfaceId} />,
        document.body
      )
    ))}
  </>
)
```

### Draggable Window Implementation
- Use `react-draggable` or custom drag logic with `onMouseDown`/`onMouseMove`/`onMouseUp`
- Constrain to viewport bounds
- Persist position in context
- Handle z-index stacking (bring to front on focus)

## File Structure
```
frontend/src/
├── components/
│   ├── a2ui/
│   │   ├── A2UIFloatingWindowContext.tsx    # Context + state management
│   │   ├── DraggableFloatingWindow.tsx       # Portal-based window component
│   │   ├── A2UIPreviewCard.tsx               # Inline preview component
│   │   ├── CustomA2UIMessageRenderer.tsx     # Custom activity renderer
│   │   └── index.ts                          # Exports
│   └── ui/
│       └── ...existing components
├── routes/
│   └── __root.tsx                            # Updated with provider
└── ...
```

## Success Criteria
- [ ] Floating window opens automatically on first a2ui surface
- [ ] Window is fully draggable anywhere on screen
- [ ] Window is resizable
- [ ] Inline preview shows in chat messages
- [ ] Multiple surfaces can be open simultaneously
- [ ] Window state persists across agent turns
- [ ] No regression in existing chat functionality