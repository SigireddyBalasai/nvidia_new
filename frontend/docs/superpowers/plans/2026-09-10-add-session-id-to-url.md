# Session ID URL Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add session ID to the URL using hash routing, with a share button and full TanStack Router integration.

**Architecture:** Add dynamic route `/thread/$threadId`, update store to persist last active thread, sync URL with thread selection, and add share button to header.

**Tech Stack:** TanStack Router, Zustand, LangGraph SDK, Lucide icons

## Global Constraints

- Hash-based routing: `/#/thread/{threadId}`
- Always load last active thread on initial load (ignore URL on startup)
- Browser back/forward switches threads
- Share button copies current URL to clipboard
- No new dependencies required

---

## File Structure

### Files to Create
1. **`src/routes/thread/$threadId.tsx`** - New route for thread view
   - Extract threadId from URL params
   - Update `currentSessionId` in store
   - Render ChatPanel and InsightsPanel

### Files to Modify
1. **`src/lib/store.ts`** - Add `lastActiveThreadId` persistence
   - Add `lastActiveThreadId` to interface
   - Load from localStorage on init
   - Update `setCurrentSessionId` to persist

2. **`src/routes/index.tsx`** - Add redirect logic
   - Redirect to last active thread if authenticated
   - Preserve starter page logic

3. **`src/components/sidebar.tsx`** - Update thread selection
   - Navigate to `/thread/${id}` on selection
   - Navigate to new thread URL after creation

4. **`src/components/chat-panel.tsx`** - Update first message flow
   - Navigate to new thread URL after creation

5. **`src/components/header.tsx`** - Add share button
   - Add share button with link icon
   - Copy current URL to clipboard
   - Show confirmation toast

---

## Tasks

### Task 1: Add `lastActiveThreadId` to Zustand Store

**Files:**
- Modify: `src/lib/store.ts:65-125`

**Interfaces:**
- Consumes: None (standalone change)
- Produces: `lastActiveThreadId` state, `setCurrentSessionId` action

- [ ] **Step 1: Add `lastActiveThreadId` to interface**

```typescript
// In DataForgeState interface, add after line 72:
lastActiveThreadId: string | null;
```

- [ ] **Step 2: Add initial state from localStorage**

```typescript
// In store creation, add after line 121:
lastActiveThreadId: typeof window !== "undefined" 
  ? localStorage.getItem("lastActiveThreadId") 
  : null,
```

- [ ] **Step 3: Update `setCurrentSessionId` to persist**

```typescript
// Replace lines 120-121 with:
setCurrentSessionId: (id) => {
  if (id && typeof window !== "undefined") {
    localStorage.setItem("lastActiveThreadId", id);
  }
  set({ currentSessionId: id });
},
```

- [ ] **Step 4: Update logout to clear persistence**

```typescript
// In logout function (lines 237-241), add:
logout: () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("lastActiveThreadId");
  }
  set({
    isAuthenticated: false,
    user: null,
    currentSessionId: null,
    lastActiveThreadId: null,
  });
},
```

- [ ] **Step 5: Run typecheck**

Run: `npm run typecheck`
Expected: PASS (no new errors)

- [ ] **Step 6: Commit**

```bash
git add src/lib/store.ts
git commit -m "feat: add lastActiveThreadId persistence to store"
```

---

### Task 2: Create Thread Route

**Files:**
- Create: `src/routes/thread/$threadId.tsx`

**Interfaces:**
- Consumes: `currentSessionId` from store
- Produces: `/thread/$threadId` route

- [ ] **Step 1: Create thread directory**

```bash
mkdir -p src/routes/thread
```

- [ ] **Step 2: Create thread route file**

```typescript
// src/routes/thread/$threadId.tsx
import { createFileRoute, Navigate } from "@tanstack/react-router"
import { useEffect } from "react"
import { useStore } from "@/lib/store"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { ChatPanel } from "@/components/chat-panel"
import { InsightsPanel } from "@/components/insights-panel"
import { DataForgeChartTools } from "@/components/dataforge-charts"
import { BarChartTool, PieChartTool, LineChartTool, TableTool } from "@/components/copilot-tools"
import { useLangGraphThreads } from "@/lib/langgraph-threads"

export const Route = createFileRoute("/thread/$threadId")({
  component: ThreadView,
})

function ThreadView() {
  const { threadId } = Route.useParams()
  const sidebarOpen = useStore((s) => s.sidebarOpen)
  const isAuthenticated = useStore((s) => s.isAuthenticated)
  const setCurrentSessionId = useStore((s) => s.setCurrentSessionId)
  const panelLayout = useStore((s) => s.panelLayout)
  const setPanelLayout = useStore((s) => s.setPanelLayout)
  const { threads } = useLangGraphThreads()

  // Update current session when threadId changes
  useEffect(() => {
    if (threadId) {
      setCurrentSessionId(threadId)
    }
  }, [threadId, setCurrentSessionId])

  // Global Escape key listener to exit full screen mode back to split
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && panelLayout !== "split") {
        setPanelLayout("split")
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [panelLayout, setPanelLayout])

  // Check if thread exists
  const threadExists = threads.some((t) => t.id === threadId)

  // Redirect to home if not authenticated or thread doesn't exist
  if (!isAuthenticated) {
    return <Navigate to="/" />
  }

  if (!threadExists && threads.length > 0) {
    return <Navigate to="/" />
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      <DataForgeChartTools />
      <BarChartTool />
      <PieChartTool />
      <LineChartTool />
      <TableTool />
      <Header />
      <div className="flex flex-1 overflow-hidden">
        {sidebarOpen && panelLayout === "split" && <Sidebar />}
        <main className="flex flex-1 overflow-hidden">
          {panelLayout !== "visuals" && <ChatPanel isFullscreen={panelLayout === "chat"} />}
          {panelLayout !== "chat" && <InsightsPanel isFullscreen={panelLayout === "visuals"} />}
        </main>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Run typecheck**

Run: `npm run typecheck`
Expected: PASS (no new errors)

- [ ] **Step 4: Commit**

```bash
git add src/routes/thread/\$threadId.tsx
git commit -m "feat: add thread route with dynamic params"
```

---

### Task 3: Update Index Route with Redirect Logic

**Files:**
- Modify: `src/routes/index.tsx:1-82`

**Interfaces:**
- Consumes: `lastActiveThreadId` from store
- Produces: Redirect to `/thread/$threadId`

- [ ] **Step 1: Add Navigate import**

```typescript
// Add to imports at line 1:
import { createFileRoute, Navigate } from "@tanstack/react-router"
```

- [ ] **Step 2: Add redirect logic**

```typescript
// Add after line 16 (const isAuthenticated):
const lastActiveThreadId = useStore((s) => s.lastActiveThreadId)
```

- [ ] **Step 3: Update return statement**

```typescript
// Replace lines 61-82 with:
if (!isAuthenticated) {
  return <StarterPage />
}

// Redirect to last active thread if exists
if (lastActiveThreadId) {
  return <Navigate to="/thread/$threadId" params={{ threadId: lastActiveThreadId }} />
}

// Fallback to starter page if no threads
return <StarterPage />
```

- [ ] **Step 4: Run typecheck**

Run: `npm run typecheck`
Expected: PASS (no new errors)

- [ ] **Step 5: Commit**

```bash
git add src/routes/index.tsx
git commit -m "feat: add redirect to last active thread on index"
```

---

### Task 4: Update Sidebar Navigation

**Files:**
- Modify: `src/components/sidebar.tsx:35-46`

**Interfaces:**
- Consumes: TanStack Router `useNavigate`
- Produces: Navigation to `/thread/${id}`

- [ ] **Step 1: Add useNavigate import**

```typescript
// Add to imports at line 1:
import { useNavigate } from "@tanstack/react-router"
```

- [ ] **Step 2: Add navigate hook**

```typescript
// Add after line 13 (const isProcessing):
const navigate = useNavigate()
```

- [ ] **Step 3: Update handleNewAnalysis**

```typescript
// Replace lines 35-41 with:
const handleNewAnalysis = useCallback(async () => {
  const id = await createThread("New Analysis");
  if (id) {
    setCurrentSessionId(id);
    config?.setActiveThreadId(id, { explicit: true });
    navigate({ to: "/thread/$threadId", params: { threadId: id } });
  }
}, [createThread, setCurrentSessionId, config, navigate]);
```

- [ ] **Step 4: Update handleSelectThread**

```typescript
// Replace lines 43-46 with:
const handleSelectThread = useCallback((id: string) => {
  setCurrentSessionId(id);
  config?.setActiveThreadId(id, { explicit: true });
  navigate({ to: "/thread/$threadId", params: { threadId: id } });
}, [setCurrentSessionId, config, navigate]);
```

- [ ] **Step 5: Run typecheck**

Run: `npm run typecheck`
Expected: PASS (no new errors)

- [ ] **Step 6: Commit**

```bash
git add src/components/sidebar.tsx
git commit -m "feat: update sidebar to navigate to thread URL"
```

---

### Task 5: Update Chat Panel First Message Flow

**Files:**
- Modify: `src/components/chat-panel.tsx:228-272`

**Interfaces:**
- Consumes: TanStack Router `useNavigate`
- Produces: Navigation to `/thread/${newId}`

- [ ] **Step 1: Add useNavigate import**

```typescript
// Add to imports at line 1:
import { useNavigate } from "@tanstack/react-router"
```

- [ ] **Step 2: Add navigate hook**

```typescript
// Add after line 147 (const isLoading):
const navigate = useNavigate()
```

- [ ] **Step 3: Update sendMessage function**

```typescript
// In sendMessage function, after line 248 (setCurrentSessionId(activeThreadId)):
navigate({ to: "/thread/$threadId", params: { threadId: activeThreadId } })
```

- [ ] **Step 4: Add navigate to dependencies**

```typescript
// Update line 272 dependencies to include navigate:
}, [agent, copilotkit, currentSessionId, createThread, setCurrentSessionId, navigate])
```

- [ ] **Step 5: Run typecheck**

Run: `npm run typecheck`
Expected: PASS (no new errors)

- [ ] **Step 6: Commit**

```bash
git add src/components/chat-panel.tsx
git commit -m "feat: update chat panel to navigate on first message"
```

---

### Task 6: Add Share Button to Header

**Files:**
- Modify: `src/components/header.tsx`

**Interfaces:**
- Consumes: Current URL from `window.location`
- Produces: Share button with copy-to-clipboard

- [ ] **Step 1: Add Link icon import**

```typescript
// Add to lucide-react imports:
import { Link } from "lucide-react"
```

- [ ] **Step 2: Add share handler**

```typescript
// Add after other handler functions:
const handleShare = () => {
  navigator.clipboard.writeText(window.location.href)
  // Show toast notification (assuming toast is available)
  console.log("Link copied to clipboard")
}
```

- [ ] **Step 3: Add share button to JSX**

```typescript
// Add after thread name display, before other header actions:
<button
  onClick={handleShare}
  className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
  title="Copy link to clipboard"
>
  <Link size={14} />
  <span>Share</span>
</button>
```

- [ ] **Step 4: Run typecheck**

Run: `npm run typecheck`
Expected: PASS (no new errors)

- [ ] **Step 5: Commit**

```bash
git add src/components/header.tsx
git commit -m "feat: add share button to header"
```

---

### Task 7: Test Edge Cases

**Files:**
- Test: Manual testing

**Interfaces:**
- Consumes: All previous tasks
- Produces: Verified behavior

- [ ] **Step 1: Test thread selection**

1. Open app
2. Click thread in sidebar
3. Verify URL updates to `/#/thread/{id}`
4. Verify thread loads correctly

- [ ] **Step 2: Test first message**

1. Click "New Analysis"
2. Send a message
3. Verify URL updates to `/#/thread/{newId}`
4. Verify message appears

- [ ] **Step 3: Test browser navigation**

1. Select thread A
2. Select thread B
3. Click browser back
4. Verify thread A loads
5. Click browser forward
6. Verify thread B loads

- [ ] **Step 4: Test share button**

1. Select a thread
2. Click share button
3. Verify URL copied to clipboard
4. Paste in new tab
5. Verify thread loads (or redirects to last active)

- [ ] **Step 5: Test invalid URL**

1. Manually enter invalid thread ID in URL
2. Verify error handling
3. Verify redirect to last active thread

- [ ] **Step 6: Commit test results**

```bash
git commit --allow-empty -m "test: verify session ID URL feature"
```

---

## Success Criteria

1. ✅ URL shows thread ID in hash format
2. ✅ Share button copies URL to clipboard
3. ✅ Browser back/forward switches threads
4. ✅ Initial load ignores URL, loads last active thread
5. ✅ Edge cases handled gracefully

## Notes

- **Toast notifications**: If toast library not available, use console.log for now
- **Error boundaries**: Add error boundaries for route components if needed
- **Testing**: Manual testing sufficient for this feature
- **Performance**: No performance concerns with current implementation
