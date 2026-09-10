# Design: Add Session ID to URL with Hash Routing

**Date**: 2026-09-10  
**Status**: Approved  
**Author**: Assistant  

## Overview

Add session ID to the URL using hash routing, with a share button and full TanStack Router integration. The URL will update when threads are selected or first messages are sent, and browser back/forward will switch threads.

## Goals

1. **URL reflects current thread**: Hash-based URL shows current session ID
2. **Shareable links**: Users can copy URL to share specific threads
3. **Browser navigation**: Back/forward buttons switch between threads
4. **Seamless integration**: Works with existing TanStack Router setup

## Non-Goals

1. **Deep linking on initial load**: App always loads last active thread, ignores URL on startup
2. **SEO optimization**: Hash-based routing not optimized for search engines
3. **Multi-tab synchronization**: Each tab maintains independent URL state

## Architecture

### Current State

- **Single route**: `/` (index.tsx)
- **Thread state**: Managed in Zustand store (`currentSessionId`)
- **Thread management**: LangGraph SDK handles thread CRUD
- **No URL routing**: Threads not represented in URL

### Proposed Changes

1. **Add dynamic route**: `/thread/$threadId` using TanStack Router
2. **Update index route**: Redirect to last active thread or show starter page
3. **Sync URL with store**: Update URL hash on thread selection/first message
4. **Add share button**: Copy current thread URL to clipboard
5. **Handle browser navigation**: Switch threads on back/forward

## Components

### 1. New Route: `src/routes/thread/$threadId.tsx`

**Purpose**: Display thread view for specific thread ID

**Behavior**:
- Extract `threadId` from URL params
- Update `currentSessionId` in Zustand store
- Render ChatPanel and InsightsPanel (same as index route)
- Handle invalid thread IDs (show error, redirect)

**Implementation**:
```typescript
export const Route = createFileRoute("/thread/$threadId")({
  component: ThreadView,
})

function ThreadView() {
  const { threadId } = Route.useParams()
  const setCurrentSessionId = useStore((s) => s.setCurrentSessionId)
  
  useEffect(() => {
    setCurrentSessionId(threadId)
  }, [threadId, setCurrentSessionId])
  
  // Render same layout as index route
}
```

### 2. Modified Route: `src/routes/index.tsx`

**Purpose**: Handle root URL, redirect to active thread

**Behavior**:
- If no threads exist: Show starter page
- If threads exist: Redirect to last active thread
- Preserve existing starter page logic

**Implementation**:
```typescript
function App() {
  const lastActiveThreadId = useStore((s) => s.lastActiveThreadId)
  
  // Redirect to last active thread if exists
  if (isAuthenticated && lastActiveThreadId) {
    return <Navigate to="/thread/$threadId" params={{ threadId: lastActiveThreadId }} />
  }
  
  // Existing starter page logic
}
```

### 3. Modified Component: `src/components/sidebar.tsx`

**Purpose**: Update thread selection to navigate to URL

**Changes**:
- `handleSelectThread`: Navigate to `/thread/${id}` using TanStack Router
- `handleNewAnalysis`: Navigate to new thread URL after creation

**Implementation**:
```typescript
const handleSelectThread = useCallback((id: string) => {
  setCurrentSessionId(id)
  config?.setActiveThreadId(id, { explicit: true })
  navigate({ to: "/thread/$threadId", params: { threadId: id } })
}, [setCurrentSessionId, config, navigate])
```

### 4. Modified Component: `src/components/chat-panel.tsx`

**Purpose**: Update URL on first message in new thread

**Changes**:
- `sendMessage`: After thread creation, navigate to new thread URL

**Implementation**:
```typescript
// In sendMessage function
if (!activeThreadId) {
  activeThreadId = await createThread()
  if (activeThreadId) {
    setCurrentSessionId(activeThreadId)
    navigate({ to: "/thread/$threadId", params: { threadId: activeThreadId } })
  }
}
```

### 5. Modified Component: `src/components/header.tsx`

**Purpose**: Add share button to copy current thread URL

**Changes**:
- Add share button with link icon
- Copy current URL to clipboard on click
- Show confirmation toast

**Implementation**:
```typescript
const handleShare = () => {
  navigator.clipboard.writeText(window.location.href)
  toast.success("Link copied to clipboard")
}
```

### 6. Modified Store: `src/lib/store.ts`

**Purpose**: Add persistence for last active thread

**Changes**:
- Add `lastActiveThreadId` state
- Update `setCurrentSessionId` to persist to localStorage
- Load `lastActiveThreadId` from localStorage on init

**Implementation**:
```typescript
// Add to interface
lastActiveThreadId: string | null

// Update implementation
currentSessionId: localStorage.getItem("lastActiveThreadId"),
setCurrentSessionId: (id) => {
  if (id) localStorage.setItem("lastActiveThreadId", id)
  set({ currentSessionId: id })
}
```

## Data Flow

### Thread Selection Flow

```
User clicks thread in sidebar
  → handleSelectThread(id) called
  → Navigate to /thread/${id} using TanStack Router
  → Update currentSessionId in store
  → URL updates to /#/thread/${id}
```

### First Message Flow

```
User sends first message in new thread
  → sendMessage() creates thread
  → Navigate to /thread/${newId}
  → URL updates to /#/thread/${newId}
```

### Browser Navigation Flow

```
User clicks browser back/forward
  → TanStack Router detects URL change
  → Route component updates currentSessionId in store
  → Thread switches automatically
```

### Share Flow

```
User clicks share button
  → Copy current URL to clipboard
  → Show toast: "Link copied to clipboard"
```

## URL Format

- **Pattern**: `/#/thread/{threadId}`
- **Example**: `/#/thread/abc123-def456-ghi789`
- **Shareable**: Yes (URL contains opaque thread ID)

## Behavior Matrix

| Action | URL Updates | Thread Switches | Notes |
|--------|-------------|-----------------|-------|
| Click thread in sidebar | Yes | Yes | Immediate |
| Send first message | Yes | Yes | After thread creation |
| Browser back/forward | Yes | Yes | Automatic |
| Open app with URL | No | No | Always loads last thread |
| Share button | N/A | N/A | Copies current URL |

## Edge Cases

### 1. Invalid Thread ID in URL
- **Scenario**: User shares URL, thread gets deleted
- **Behavior**: Show "Thread not found" message
- **Action**: Redirect to last active thread or starter page

### 2. No Threads Exist
- **Scenario**: Fresh app, no threads created
- **Behavior**: Show starter page
- **Action**: No URL change

### 3. Thread Deleted While Viewing
- **Scenario**: Thread deleted in another tab
- **Behavior**: Show error message
- **Action**: Redirect to another thread or starter page

### 4. Concurrent Tab Updates
- **Scenario**: Multiple tabs open
- **Behavior**: Each tab maintains independent URL state
- **Action**: No synchronization between tabs

## Share Button UX

### Location
- **Position**: Header, next to thread name
- **Icon**: Link/share icon from Lucide
- **Size**: Consistent with other header buttons

### Behavior
- **Click**: Copy current URL to clipboard
- **Feedback**: Show toast: "Link copied to clipboard"
- **No dialog**: Simple copy action, no confirmation needed

### Accessibility
- **Keyboard**: Accessible via Enter/Space
- **Screen reader**: "Share thread link"
- **Tooltip**: "Copy link to clipboard"

## Testing Strategy

### Unit Tests
1. Store updates: `lastActiveThreadId` persistence
2. URL parsing: Hash extraction and validation
3. Navigation: TanStack Router integration

### Integration Tests
1. Thread selection: Sidebar click → URL update
2. First message: Send → thread creation → URL update
3. Browser navigation: Back/forward → thread switch

### E2E Tests
1. Full flow: Create thread → send message → share URL
2. Browser back: Switch threads via navigation
3. Invalid URL: Handle deleted thread gracefully

## Dependencies

- **TanStack Router**: Already in use (no new dependency)
- **Zustand**: Already in use (no new dependency)
- **LangGraph SDK**: Already in use (no new dependency)
- **Lucide icons**: Already in use (no new dependency)

## Risks & Mitigations

### Risk 1: URL Changes May Break Existing Workflows
- **Mitigation**: Use hash-based routing to preserve existing behavior
- **Fallback**: Keep existing code paths intact

### Risk 2: Browser Back/Forward May Cause Unexpected State
- **Mitigation**: Thorough testing, add error boundaries
- **Fallback**: Graceful degradation to non-URL mode

### Risk 3: Share URL May Expose Sensitive Data
- **Mitigation**: Thread IDs are opaque UUIDs, no sensitive data in URL
- **Validation**: Ensure thread IDs don't contain PII

## Implementation Order

1. **Phase 1**: Add `lastActiveThreadId` to store
2. **Phase 2**: Create `/thread/$threadId` route
3. **Phase 3**: Update index route with redirect logic
4. **Phase 4**: Update sidebar navigation
5. **Phase 5**: Update chat-panel first message logic
6. **Phase 6**: Add share button to header
7. **Phase 7**: Test edge cases and error handling

## Success Criteria

1. **URL reflects current thread**: Hash shows thread ID
2. **Shareable links**: Copy URL shares specific thread
3. **Browser navigation**: Back/forward switches threads
4. **Seamless experience**: No breaking changes to existing flow
5. **Error handling**: Graceful degradation for invalid URLs
