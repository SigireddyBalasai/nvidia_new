import { useCallback, useEffect, useRef, useState } from "react";
import { Client } from "@langchain/langgraph-sdk";
import type { Thread, Metadata } from "@langchain/langgraph-sdk";

const LANGGRAPH_URL =
  import.meta.env.VITE_LANGGRAPH_DEPLOYMENT_URL || "http://localhost:2024";

function getClient() {
  return new Client({ apiUrl: LANGGRAPH_URL });
}

export interface SidebarThread {
  id: string;
  name: string;
  archived: boolean;
  createdAt: number;
  updatedAt: number;
  lastRunAt: number;
}

export function useLangGraphThreads() {
  const [threads, setThreads] = useState<SidebarThread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const clientRef = useRef(getClient());

  const fetchThreads = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const client = clientRef.current;
      const raw: Thread[] = await client.threads.search({
        metadata: { agentId: "default" },
        limit: 200,
        sortBy: "updated_at",
        sortOrder: "desc",
      });
      const mapped: SidebarThread[] = raw.map((t) => ({
        id: t.thread_id,
        name: (t.metadata?.name as string) || `Analysis ${new Date(t.created_at).toLocaleDateString()}`,
        archived: (t.metadata?.archived as boolean) || false,
        createdAt: new Date(t.created_at).getTime(),
        updatedAt: new Date(t.updated_at).getTime(),
        lastRunAt: new Date(t.state_updated_at || t.updated_at).getTime(),
      }));
      setThreads(mapped);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch threads");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createThread = useCallback(
    async (name?: string): Promise<string | null> => {
      try {
        const client = clientRef.current;
        const now = new Date();
        const defaultName = name || `Analysis ${now.toLocaleDateString()} ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
        const meta: Metadata = {
          agentId: "default",
          name: defaultName,
        };
        const thread: Thread = await client.threads.create({ metadata: meta });
        await fetchThreads();
        return thread.thread_id;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to create thread");
        return null;
      }
    },
    [fetchThreads],
  );

  const renameThread = useCallback(
    async (threadId: string, name: string) => {
      try {
        const client = clientRef.current;
        await client.threads.update(threadId, { metadata: { name } });
        await fetchThreads();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to rename thread");
      }
    },
    [fetchThreads],
  );

  const archiveThread = useCallback(
    async (threadId: string) => {
      try {
        const client = clientRef.current;
        await client.threads.update(threadId, { metadata: { archived: true } });
        await fetchThreads();
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Failed to archive thread",
        );
      }
    },
    [fetchThreads],
  );

  const deleteThread = useCallback(
    async (threadId: string) => {
      try {
        const client = clientRef.current;
        await client.threads.delete(threadId);
        await fetchThreads();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to delete thread");
      }
    },
    [fetchThreads],
  );

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
