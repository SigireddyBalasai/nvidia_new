import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import {
  CopilotChat,
  CopilotChatAssistantMessage,
  CopilotChatInput,
  CopilotChatUserMessage,
  CopilotThreadsDrawer,
} from "@copilotkit/react-core/v2"
import { Button } from "../components/ui/button"
import { MessageSquareIcon, PanelLeftIcon } from "lucide-react"

export const Route = createFileRoute("/")({ component: App })

function App() {
  const [showThreads, setShowThreads] = useState(false)

  return (
    <div className="flex h-svh">
      {/* Threads Drawer — slides from left */}
      <div
        className={`flex h-full flex-col border-r bg-white transition-all duration-300 ${
          showThreads ? "w-80" : "w-0 overflow-hidden"
        }`}
      >
        <CopilotThreadsDrawer />
      </div>

      {/* Chat — full width */}
      <div className="flex h-full flex-1 flex-col">
        <div className="flex items-center border-b px-4 py-2">
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => setShowThreads(!showThreads)}
            title="Threads"
          >
            <PanelLeftIcon className="size-4" />
          </Button>
          <div className="ml-2 flex items-center gap-2 text-sm font-medium">
            <MessageSquareIcon className="size-4" />
            Conversation
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          <CopilotChat
            labels={{
              chatInputPlaceholder: "Type a message...",
              welcomeMessageText: "How can I help you today?",
            }}
            messageView={{
              assistantMessage: CopilotChatAssistantMessage,
              userMessage: CopilotChatUserMessage,
            }}
            input={CopilotChatInput}
          />
        </div>
      </div>
    </div>
  )
}
