# Thread Migration: localStorage → LangGraph-persisted Threads — Design

Date: 2026-09-09
Status: Approved

## Problem

`frontend/src/components/sidebar.tsx` manages analysis sessions in browser
`localStorage` (`dataforge-threads`) with custom `df-${Date.now()}` ids.
These threads are disconnected from chat: `chat-panel.tsx` uses headless
`useAgent({ agentId: "default" })` with its own auto-minted thread, so
selecting a sidebar session never loads its history. Nothing is persisted
server-side: the runtime (`routes/api/copilotkit.$.ts`) uses
`InMemoryAgentRunner` with no `intelligence`, and `graph.py` configures no
checkpointer. History is lost on reload/restart.

## Goal (agreed)

- Sidebar threads become real persisted threads; selecting one loads its
  actual message history in chat.
- Keep all actions: create / list / switch / delete + rename + archive.
- Threads and history saved on the LangGraph side (native persistence),
  not just the browser.
- Clean break: existing `localStorage` sessions are dropped, not migrated.

## Architecture (LangGraph SDK direct, no CopilotKit Intelligence)

| Layer | Stores | Managed by |
| --- | --- | --- |
| LangGraph SDK | Thread metadata (name, archived) + full AG-UI event history | `@langchain/langgraph-sdk` from frontend |
| LangGraph Platform | Graph checkpoints / state per `thread_id` | `ServerRuntime` in `graph.py` (already persistent) |

Thread metadata (name, archived) is stored via LangGraph SDK's `threads.update()`.
Full conversation history is stored by LangGraph Platform's `ServerRuntime` as graph
checkpoints. The frontend calls LangGraph SDK directly for thread CRUD; `useAgent`
with `threadId` loads history from LangGraph. No CopilotKit Intelligence premium
feature required.

## Changes

### 1. Frontend — `sidebar.tsx`

- Delete `useThreadManagement` and all `localStorage` access.
- Install `@langchain/langgraph-sdk` and create a `useLangGraphThreads` hook
  that calls LangGraph SDK directly for thread CRUD (create, list, rename,
  delete, archive). This replaces `useThreads` from CopilotKit (which requires
  Intelligence premium).
- Active thread lives in zustand `currentSessionId` (now a UUID threadId).
  Switching calls `config.setActiveThreadId(id, { explicit: true })` so history
  replays; new chat creates a thread via LangGraph SDK.
- Thread list is fetched via `langGraphClient.threads.search()` on mount.

### 2. Frontend — `chat-panel.tsx`, `__root.tsx`, `store.ts`, `api.ts`

- `chat-panel.tsx`: sync active thread id onto the agent
  (`agent.threadId = id` before imperative sends; `setActiveThreadId` for
  UI switches) and let `connectAgent()` replay persisted events.
- `store.ts`: keep `currentSessionId` as the thread id; update the stale
  "CopilotKit handles threads" comment to describe the new source of truth.
- `api.ts`: deprecate/remove the stub session functions (`createSession`,
  `fetchSessions`, `fetchSession`, `createSSEStream`) once sidebar no
  longer imports them.

### 3. Runtime — `routes/api/copilotkit.$.ts`

- Keep `LangGraphAgent({ deploymentUrl, graphId: "agent" })` and
  `InMemoryAgentRunner`. No CopilotKit Intelligence.
- Thread persistence is handled by LangGraph Platform's `ServerRuntime`
  natively; the frontend uses `@langchain/langgraph-sdk` to manage thread
  metadata (name, archived) directly via LangGraph's thread APIs.

### 4. LangGraph side — `src/deep_agent/graph.py`

- No code change in v1: the CopilotKit `threadId` already arrives via
  `config.configurable.thread_id` (sandbox is already keyed per thread).
  Thread persistence is handled by LangGraph Platform's `ServerRuntime`
  natively.

### 5. Config

- `LANGGRAPH_DEPLOYMENT_URL` already in `.env.example` — no changes needed.
- No `CPK_INTELLIGENCE_API_KEY` required (not using premium Intelligence).

## Error handling

- Mutations are pessimistic (resolve on server confirm, reject on failure):
  surface network / thread-not-found / auth / 15s-timeout errors in the
  sidebar instead of the current `console.error`-only path.
- 409 thread-locked: one active run per thread (tunable `lockTtlSeconds` /
  heartbeat); block sends on a running thread with a visible state.
- WS drop: thread list goes stale until auto-reconnect; reload or
  thread-reselect replays missed events.

## Verification

- New thread → send → reload → history replays.
- Switch threads → correct history each; second tab syncs without polling.
- Rename/archive/delete reflect everywhere; archived hidden by default.
- No `dataforge-threads` reads/writes; no `df-` id minting.
- `pnpm typecheck`, `lint`, existing `vitest` suite.

## Non-goals

- Migrating old `localStorage` sessions.
- Per-user auth (`identifyUser` static demo only).
- Explicit Postgres checkpointer in `graph.py`.
- Confirmation dialogs for archive/delete (app should add its own).
