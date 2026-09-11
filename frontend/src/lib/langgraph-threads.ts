import { useCallback, useEffect, useRef, useState } from "react"

const LANGGRAPH_URL =
  import.meta.env.VITE_LANGGRAPH_DEPLOYMENT_URL || "http://localhost:2024"

let client: any = null

async function getClient() {
  if (!client) {
    const module = await import("@langchain/langgraph-sdk")
    client = new module.Client({ apiUrl: LANGGRAPH_URL })
  }
  return client
}

export function useLangGraphThreads() {
  const [threads, setThreads] = useState<
    { id: string; name: string; archived: boolean; createdAt: number; updatedAt: number; lastRunAt: number }[]
  >([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const clientRef = useRef<any>(null)

  // Initialize client on mount
  useEffect(() => {
    ;(async () => {
      clientRef.current = await getClient()
    })()
  }, [])

  const fetchThreads = useCallback(async () => {
    if (!clientRef.current) return
    setIsLoading(true)
    setError(null)
    try {
      const client = clientRef.current
      const raw = await client.threads.search({
        metadata: { agentId: "default" },
        limit: 200,
        sortBy: "updated_at",
        sortOrder: "desc",
      })
      const mapped = raw.threads?.map((t: any) => ({
        id: t.thread_id,
        name:
          (t.metadata?.name as string) ||
          `Analysis ${new Date(t.created_at).toLocaleDateString()}`,
        archived: (t.metadata?.archived as boolean) || false,
        createdAt: new Date(t.created_at).getTime(),
        updatedAt: new Date(t.updated_at).getTime(),
        lastRunAt: new Date(t.state_updated_at || t.updated_at).getTime(),
      })) || []
      setThreads(mapped)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch threads")
    } finally {
      setIsLoading(false)
    }
  }, [])

  const createThread = useCallback(
    async (name?: string): Promise<string | null> => {
      if (!clientRef.current) return null
      try {
        const client = clientRef.current
        const now = new Date()
        const defaultName =
          name ||
          `Analysis ${now.toLocaleDateString()} ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
        const meta: { agentId: string; name: string } = {
          agentId: "default",
          name: defaultName,
        }
        const thread: any = await client.threads.create({ metadata: meta })
        await fetchThreads()
        return thread.thread_id
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to create thread")
        return null
      }
    },
    [fetchThreads]
  )

  const renameThread = useCallback(
    async (threadId: string, name: string) => {
      if (!clientRef.current) return
      try {
        const client = clientRef.current
        await client.threads.update(threadId, { metadata: { name } })
        await fetchThreads()
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to rename thread")
      }
    },
    [fetchThreads]
  )

  const archiveThread = useCallback(
    async (threadId: string) => {
      if (!clientRef.current) return
      try {
        const client = clientRef.current
        await client.threads.update(threadId, { metadata: { archived: true } })
        await fetchThreads()
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to archive thread")
      }
    },
    [fetchThreads]
  )

  const deleteThread = useCallback(
    async (threadId: string) => {
      if (!clientRef.current) return
      try {
        const client = clientRef.current
        await client.threads.delete(threadId)
        await fetchThreads()
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to delete thread")
      }
    },
    [fetchThreads]
  )

  const fetchThreadMessages = useCallback(
    async (threadId: string): Promise<any[]> => {
      if (!clientRef.current) return []
      try {
        const client = clientRef.current
        const state = await client.threads.getState(threadId)
        const values = state.values as Record<string, unknown> | undefined
        return (values?.messages ?? []) as any[]
      } catch (e) {
        console.error("Failed to fetch thread messages:", e)
        return []
      }
    },
    []
  )

  useEffect(() => {
    fetchThreads()
  }, [fetchThreads])

  return {
    threads,
    isLoading,
    error,
    createThread,
    renameThread,
    archiveThread,
    deleteThread,
    fetchThreadMessages,
    refresh: fetchThreads,
  }
}