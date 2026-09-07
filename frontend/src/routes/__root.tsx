import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router"
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools"
import { TanStackDevtools } from "@tanstack/react-devtools"
import { CopilotKit } from "@copilotkit/react-core"
import { CustomA2UIMessageRenderer } from "../components/a2ui/CustomA2UIMessageRenderer"
import { WindowManagerProvider } from "../components/window-manager"
import { PieChartTool } from "../components/copilot-tools"
import appCss from "../styles.css?url"
import { TooltipProvider } from "../components/ui/tooltip"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../components/ui/card"
import { AlertTriangleIcon } from "lucide-react"

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "TanStack Start Starter",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  notFoundComponent: () => (
    <main className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangleIcon data-icon="inline-start" />
            404
          </CardTitle>
          <CardDescription>Page not found</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            The requested page could not be found.
          </p>
        </CardContent>
      </Card>
    </main>
  ),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <WindowManagerProvider>
          <CopilotKit
            runtimeUrl="/api/copilotkit"
            renderActivityMessages={CustomA2UIMessageRenderer}
          >
            <PieChartTool />
            <TooltipProvider>{children}</TooltipProvider>
          </CopilotKit>
        </WindowManagerProvider>
        <TanStackDevtools
          config={{
            position: "bottom-right",
          }}
          plugins={[
            {
              name: "Tanstack Router",
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
