# Threads Migration: localStorage → LangGraph SDK direct (no CopilotKit Intelligence)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace browser localStorage thread management with LangGraph SDK direct calls so selecting a sidebar thread loads its actual persisted message history, with all CRUD operations server-side. No premium CopilotKit Intelligence feature.

**Architecture:** Two layers correlated by a shared `threadId`: (1) `@langchain/langgraph-sdk` from the frontend manages thread metadata (name, archived) directly via LangGraph's thread APIs, (2) LangGraph Platform's `ServerRuntime` stores graph checkpoints per `thread_id`. The runtime at `routes/api/copilotkit.$.ts` keeps `LangGraphAgent` and `InMemoryAgentRunner` unchanged. Sidebar uses `@langchain/langgraph-sdk` for list + create + rename + delete + archive. `useCopilotChatConfiguration`'s `setActiveThreadId(id, { explicit: true })` switches threads and replays history.

**Tech Stack:** `@langchain/langgraph-sdk` (install), `@copilotkit/react-core/v2` (`useCopilotChatConfiguration`, `useAgent`), `@copilotkit/runtime` (`LangGraphAgent`, `InMemoryAgentRunner`), `@tanstack/react-router` (existing), zustand store (existing).

---

## File Map

| File | Action |
| --- | --- |
| `frontend/package.json` | Modify — add `@langchain/langgraph-sdk` |
| `frontend/src/lib/langgraph-threads.ts` | Create — `useLangGraphThreads` hook wrapping LangGraph SDK |
| `frontend/src/components/sidebar.tsx` | Rewrite — replace `useThreadManagement` + localStorage with `useLangGraphThreads` |
| `frontend/src/components/chat-panel.tsx` | Modify — sync active `threadId` onto agent before imperative sends |
| `frontend/src/lib/store.ts` | Minor — update stale comment about CopilotKit threads |
| `frontend/src/lib/api.ts` | Modify — deprecate/remove stub session functions |
| `frontend/src/routes/api/copilotkit.$.ts` | Revert — remove CopilotKit Intelligence additions from earlier attempt |
| `docs/plans/2026-09-09-threads-langgraph-migration-design.md` | Already written — source of truth |

---

### Task 1: Install `@langchain/langgraph-sdk` and create thread hook

**Files:** `frontend/package.json`, `frontend/src/lib/langgraph-threads.ts`

- [ ] **Step 1: Install the package**

Run from `/home/balasai/tcs/nvidia/nvidia_new/frontend`:
```bash
pnpm add @langchain/langgraph-sdk
```

- [ ] **Step 2: Create `frontend/src/lib/langgraph-threads.ts`**

Create a hook that wraps LangGraph SDK for thread CRUD:

```ts
import { useCallback, useEffect, useState } from "react";
import { Client } from "@langchain/langgraph-sdk";

const LANGGRAPH_URL = import.meta.env.VITE_LANGGRAPH_DEPLOYMENT_URL || "http://localhost:2024";
const client = new Client({ apiUrl: LANGGRAPH_URL });

export interface LangGraphThread {
  thread_id: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  status: string;
}

export function useLangGraphThreads() {
  const [threads, setThreads] = useState<LangGraphThread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchThreads = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await client.threads.search({ metadata: { agentId: "default" } });
      setThreads(result as LangGraphThread[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch threads");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createThread = useCallback(async (name?: string) => {
    try {
      const thread = await client.threads.create({
        metadata: { agentId: "default", name: name || "New Analysis" },
      });
      await fetchThreads();
      return thread.thread_id;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create thread");
      return null;
    }
  }, [fetchThreads]);

  const renameThread = useCallback(async (threadId: string, name: string) => {
    try {
      await client.threads.update(threadId, { metadata: { name } });
      await fetchThreads();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to rename thread");
    }
  }, [fetchThreads]);

  const archiveThread = useCallback(async (threadId: string) => {
    try {
      await client.threads.update(threadId, { metadata: { archived: true } });
      await fetchThreads();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to archive thread");
    }
  }, [fetchThreads]);

  const deleteThread = useCallback(async (threadId: string) => {
    try {
      await client.threads.delete(threadId);
      await fetchThreads();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete thread");
    }
  }, [fetchThreads]);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  return {
    threads,
    isLoading,
    error,
    createThread,
    renameThread,
    archiveThread,
    deleteThread,
    refresh: fetchThreads,
  };
}
```

- [ ] **Step 3: Verify typecheck**

Run `npx tsc --noEmit`. Fix any import/type errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/package.json frontend/src/lib/langgraph-threads.ts && git commit -m "feat(threads): add LangGraph SDK thread management hook"
```

---

### Task 2: Sidebar — replace localStorage with `useLangGraphThreads`

**Files:** `frontend/src/components/sidebar.tsx`

- [ ] **Step 1: Rewrite `useThreadManagement` using `useLangGraphThreads`**

Replace the entire `useThreadManagement` hook. Import `useLangGraphThreads` from `@/lib/langgraph-threads`, `useCopilotChatConfiguration` from `@copilotkit/react-core/v2`, `useState` for active thread id, `useCallback` from `react`. Keep `Thread` interface and icons.

```tsx
import { useLangGraphThreads } from "@/lib/langgraph-threads";
import { useCopilotChatConfiguration } from "@copilotkit/react-core/v2";
import { useState, useCallback } from "react";

function useThreadManagement() {
  const { threads: rawThreads, isLoading, error, createThread, renameThread, archiveThread, deleteThread } = useLangGraphThreads();
  const config = useCopilotChatConfiguration();
  const [activeId, setActiveId] = useState<string | null>(null);

  // Map LangGraph threads to sidebar Thread interface
  const threads = rawThreads
    .filter((t) => !(t.metadata as Record<string, unknown>)?.archived)
    .map((t) => ({
      id: t.thread_id,
      name: (t.metadata as Record<string, unknown>)?.name as string || "New Analysis",
      archived: false,
      createdAt: new Date(t.created_at).getTime(),
      updatedAt: new Date(t.updated_at).getTime(),
      lastRunAt: new Date(t.updated_at).getTime(),
    }));

  const handleCreate = useCallback(async () => {
    const id = await createThread("New Analysis");
    if (id) {
      setActiveId(id);
      config?.setActiveThreadId(id, { explicit: true });
    }
  }, [createThread, config]);

  const selectThread = useCallback((id: string) => {
    setActiveId(id);
    config?.setActiveThreadId(id, { explicit: true });
  }, [config]);

  const handleRename = useCallback(async (id: string, name: string) => {
    await renameThread(id, name);
  }, [renameThread]);

  const handleArchive = useCallback(async (id: string) => {
    await archiveThread(id);
  }, [archiveThread]);

  const handleDelete = useCallback(async (id: string) => {
    await deleteThread(id);
    if (id === activeId) {
      setActiveId(null);
    }
  }, [deleteThread, activeId]);

  return {
    threads,
    isLoading,
    error,
    activeId,
    createThread: handleCreate,
    selectThread,
    handleRename,
    handleArchive,
    handleDelete,
  };
}
```

- [ ] **Step 2: Update `Sidebar` component to use new hook**

Replace the destructured values in `Sidebar`:
```tsx
const { threads, isLoading, error, activeId, createThread, selectThread, handleRename, handleArchive, handleDelete } = useThreadManagement();
```

Update `handleNewAnalysis` to call `createThread()`:
```tsx
const handleNewAnalysis = () => {
  createThread();
};
```

- [ ] **Step 3: Update thread list rendering**

Thread items now use `threads` from `useLangGraphThreads` (which returns `Thread[]` with `id`, `name`, `archived`, `createdAt`, `updatedAt`, `lastRunAt`). Update `onClick` to call `selectThread(t.id)`, `onDelete` to call `handleDelete(t.id)`, `onRename` to call `handleRename(t.id, name)`.

- [ ] **Step 4: Remove localStorage imports**

Ensure no `localStorage` references remain in `sidebar.tsx`. Remove the `useEffect` that reads/writes `dataforge-threads`.

- [ ] **Step 5: Verify typecheck**

Run `npx tsc --noEmit`. Fix any type errors.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/sidebar.tsx && git commit -m "feat(sidebar): replace localStorage with LangGraph SDK threads"
```

---

### Task 3: Chat panel — sync active thread id

**Files:** `frontend/src/components/chat-panel.tsx`

- [ ] **Step 1: Add `useCopilotChatConfiguration` import and thread sync**

Add to existing imports from `@copilotkit/react-core/v2`:
```ts
import { useAgent, useCopilotKit, useCopilotChatConfiguration } from "@copilotkit/react-core/v2";
```

Inside `ChatPanel`, add:
```tsx
const config = useCopilotChatConfiguration();
const vertical = useStore((s) => s.vertical);
const setIsProcessing = useStore((s) => s.setIsProcessing);
const { agent } = useAgent({ agentId: "default" });
const { copilotkit } = useCopilotKit();
```

- [ ] **Step 2: Sync active thread before imperative send**

In `sendMessage`, before `agent.addMessage(...)`, set the thread id on the agent:
```tsx
const sendMessage = useCallback(async (content: string) => {
  if (!content.trim() || agent.isRunning) return;
  // ...health check...
  agent.threadId = activeId || agent.threadId; // ensure agent uses active thread
  agent.addMessage({ id: `user-${Date.now()}`, role: "user", content: content.trim() });
  await copilotkit.runAgent({ agent });
  // ...
}, [agent, copilotkit, activeId]);
```

- [ ] **Step 3: Wire `activeId` into component**

Pass `activeId` from the sidebar (or from store) into `ChatPanel` so it can sync the agent thread. The sidebar calls `selectThread(id)` which calls `config.setActiveThreadId(id, { explicit: true })`, and `ChatPanel` reads `activeId` to set `agent.threadId` before sends.

- [ ] **Step 4: Verify typecheck**

`npx tsc --noEmit`.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/chat-panel.tsx && git commit -m "feat(chat): sync active thread id to agent for history replay"
```

---

### Task 4: Cleanup stub session functions and store comments

**Files:** `frontend/src/lib/api.ts`, `frontend/src/lib/store.ts`

- [ ] **Step 1: Deprecate stub session functions in `api.ts`**

Mark `createSession`, `fetchSessions`, `fetchSession`, `createSSEStream` as deprecated with JSDoc `@deprecated` and have them return empty/stub values with a console warning, or remove entirely if nothing imports them. Check imports first:
```ts
// Check if any file imports these:
// rg -rn "createSession\|fetchSessions\|fetchSession\|createSSEStream" frontend/src/
```
If unimported, remove them entirely. Otherwise mark `@deprecated`.

- [ ] **Step 2: Update `store.ts` comment**

Change the header comment from "CopilotKit handles threads — this store manages UI state" to "LangGraph SDK manages threads; this store manages UI state".

- [ ] **Step 3: Commit**

```bash
git add frontend/src/lib/api.ts frontend/src/lib/store.ts && git commit -m "refactor(cleanup): deprecate stub session functions, update store comments"
```

---

### Task 5: Revert runtime — remove CopilotKit Intelligence

**Files:** `frontend/src/routes/api/copilotkit.$.ts`

- [ ] **Step 1: Remove `CopilotKitIntelligence` from runtime**

Revert the runtime to its original state — remove `CopilotKitIntelligence` import and the `intelligence` / `identifyUser` parameters. Keep `LangGraphAgent` and `InMemoryAgentRunner`:

```ts
import { createFileRoute } from "@tanstack/react-router"
import {
  CopilotRuntime,
  createCopilotRuntimeHandler,
  InMemoryAgentRunner,
} from "@copilotkit/runtime/v2"
import { LangGraphAgent } from "@copilotkit/runtime/langgraph"

const LANGGRAPH_DEPLOYMENT_URL =
  process.env.LANGGRAPH_DEPLOYMENT_URL || "http://localhost:2024"
const LANGSMITH_API_KEY = process.env.LANGSMITH_API_KEY || ""

const langGraphAgent = new LangGraphAgent({
  deploymentUrl: LANGGRAPH_DEPLOYMENT_URL,
  langsmithApiKey: LANGSMITH_API_KEY,
  graphId: "agent",
})

const runtime = new CopilotRuntime({
  agents: { default: langGraphAgent },
  runner: new InMemoryAgentRunner(),
})

const handler = createCopilotRuntimeHandler({
  runtime,
  basePath: "/api/copilotkit",
})

export const Route = createFileRoute("/api/copilotkit/$")({
  server: {
    handlers: {
      GET: async ({ request }) => handler(request),
      POST: async ({ request }) => handler(request),
    },
  },
})
```

- [ ] **Step 2: Verify typecheck**

`npx tsc --noEmit`.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/routes/api/copilotkit.$.ts && git commit -m "refactor(runtime): revert CopilotKit Intelligence — use LangGraph SDK direct"
```

---

### Task 6: Verification

- [ ] **Step 1: Full typecheck**

Run from `/home/balasai/tcs/nvidia/nvidia_new/frontend`:
```
npx tsc --noEmit
```
Fix all errors.

- [ ] **Step 2: Lint**

```
npx eslint
```
Fix all lint errors.

- [ ] **Step 3: Vitest suite**

```
npx vitest run
```
Fix any test failures.

- [ ] **Step 4: Manual smoke test**

Start the runtime (`uv run langgraph dev --port 2024`), then start the frontend (`pnpm dev`). Verify:
1. New thread created via sidebar → appears in thread list with LangGraph-assigned UUID
2. Send a message → reload page → history replays when thread is selected
3. Switch threads → correct history each
4. Rename/archive/delete → reflected correctly
5. No `dataforge-threads` localStorage reads/writes

---

### Task 7: Commit and docs

- [ ] **Step 1: Final commit**

```bash
git add -A && git commit -m "feat(threads): migrate from localStorage to LangGraph SDK threads"
```

- [ ] **Step 2: Update `docs/plans/2026-09-09-threads-langgraph-migration-design.md`** with any deviations from plan.

---

## Acceptance Criteria

- No `localStorage["dataforge-threads"]` reads/writes in `src/`
- No `df-${Date.now()}` thread ID minting
- `@langchain/langgraph-sdk` drives the sidebar thread list
- `setActiveThreadId(id, { explicit: true })` switches threads and replays history
- `createThread()` creates new threads with LangGraph UUIDs
- Runtime has NO CopilotKit Intelligence (premium feature not used)
- `npx tsc --noEmit`, `npx eslint`, `npx vitest run` all pass
- Threads persist across page reload (verified manually)
