import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router"
import { CopilotKit } from "@copilotkit/react-core"
import appCss from "../styles.css?url"

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
        title: "DataForge - Agentic Analytics",
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
      <div className="w-full max-w-md p-6 rounded-xl border border-border bg-card shadow-lg">
        <h1 className="text-2xl font-bold text-foreground mb-2">404</h1>
        <p className="text-muted-foreground">Page not found.</p>
      </div>
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
        <CopilotKit runtimeUrl="/api/copilotkit">
          {children}
        </CopilotKit>
        <Scripts />
      </body>
    </html>
  )
}