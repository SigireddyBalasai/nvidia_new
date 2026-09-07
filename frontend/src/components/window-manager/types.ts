import type { ReactNode, ComponentType } from "react"

export type WindowId = string

export type WindowEntry = {
  id: WindowId
  title: string
  icon?: ReactNode
  component: ComponentType<WindowContentProps>
  props?: Record<string, unknown>
}

export type WindowContentProps = {
  windowId: WindowId
}

export type WindowState = {
  isOpen: boolean
  isMinimized: boolean
  isMaximized: boolean
  position: { x: number; y: number }
  size: { width: number; height: number }
  zIndex: number
}

export type FullWindow = WindowEntry & WindowState

export type WindowManagerContextValue = {
  windows: Map<WindowId, FullWindow>
  registerWindow: (entry: WindowEntry) => void
  unregisterWindow: (id: WindowId) => void
  openWindow: (id: WindowId) => void
  closeWindow: (id: WindowId) => void
  minimizeWindow: (id: WindowId) => void
  maximizeWindow: (id: WindowId) => void
  restoreWindow: (id: WindowId) => void
  bringToFront: (id: WindowId) => void
  updatePosition: (id: WindowId, pos: { x: number; y: number }) => void
  updateSize: (id: WindowId, size: { width: number; height: number }) => void
}
