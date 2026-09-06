---
type: architecture
title: Frontend Architecture
description: React/TypeScript frontend stack — TanStack Start, routing, CopilotChat UI, and shadcn/ui component library.
tags: [frontend, react, tanstack, copilotkit, ui]
verified:
  - by: openwiki/0.5.0
    at: 2026-09-06T06:03:50.304Z
sources:
  - id: openwiki-source-8935a2e27b970adbe227da7a
    resource: repo://frontend/src/routes/__root.tsx
  - id: openwiki-source-9f5539a7e20f01ba005bcfb6
    resource: repo://frontend/src/routes/index.tsx
  - id: openwiki-source-378e3cf05ab0d05d335c68d5
    resource: repo://frontend/vite.config.ts
generated: { by: "opencode", at: "2026-09-06T06:03:50.304Z" }
---

# Frontend Architecture

The frontend is a React 19 application built with TanStack Start, providing a chat interface to the deep agent via CopilotKit.

## Stack

| Layer | Technology |
|-------|------------|
| Framework | TanStack Start (SSR-capable React framework) |
| Routing | TanStack Router (file-based) |
| UI Components | shadcn/ui (61 components) |
| Styling | Tailwind CSS v4 |
| Build | Vite 8 with `@tanstack/react-start/plugin/vite` |
| Chat | CopilotKit (`@copilotkit/react-core`, `@copilotkit/react-ui`) |
| Package Manager | Bun |

## Vite Configuration

`frontend/vite.config.ts` configures three plugins:

1. **devtools()** — TanStack devtools for development
2. **tailwindcss()** — Tailwind CSS v4 integration via `@tailwindcss/vite`
3. **tanstackStart()** — TanStack Start SSR framework
4. **viteReact()** — React Fast Refresh

## Routing

File-based routing via TanStack Router:

- `__root.tsx` — Root layout with `<html>`, `<head>`, `<body>`, CopilotKit provider, and devtools
- `index.tsx` — Home route with resizable split panel and `<CopilotChat />`
- `api/copilotkit.$.ts` — Catch-all API route for CopilotKit runtime

## Layout

The root layout (`__root.tsx`):

1. Sets HTML meta (charset, viewport, title)
2. Loads CopilotKit CSS and app CSS
3. Wraps children in `<CopilotKit runtimeUrl="/api/copilotkit">`
4. Adds `<TooltipProvider>` from shadcn/ui
5. Includes TanStack devtools with Router plugin

## Home Page

The index route (`index.tsx`) renders a `ResizablePanelGroup`:

- **Left panel** (70% default): placeholder content area
- **Right panel** (30% default): `<CopilotChat />` from CopilotKit

Users interact with the agent through the resizable chat panel.

## Key Dependencies

| Package | Purpose |
|---------|---------|
| `@copilotkit/react-core` | CopilotKit React context and hooks |
| `@copilotkit/react-ui` | Pre-built `<CopilotChat />` component |
| `@tanstack/react-router` | File-based routing |
| `@tanstack/react-start` | SSR framework |
| `shadcn` | Component generator CLI |
| `@base-ui/react` | Headless UI primitives |
| `recharts` | Charting (available for data visualization) |
| `lucide-react` | Icon library |

## Component Library

The `frontend/src/components/ui/` directory contains 61 shadcn/ui components including accordion, alert, button, card, dialog, dropdown-menu, input, select, table, tabs, toast, tooltip, and many more. These provide a consistent, accessible UI foundation.
