"use client"

import * as React from "react"
import type {
  WindowId,
  WindowEntry,
  FullWindow,
  WindowManagerContextValue,
} from "./types"

const WindowManagerContext = React.createContext<
  WindowManagerContextValue | undefined
>(undefined)

let nextZIndex = 1000

export const WindowManagerProvider: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  const [windows, setWindows] = React.useState<Map<WindowId, FullWindow>>(
    () => new Map()
  )

  const registerWindow = React.useCallback((entry: WindowEntry) => {
    setWindows((prev) => {
      if (prev.has(entry.id)) return prev
      nextZIndex += 1
      const win: FullWindow = {
        ...entry,
        isOpen: false,
        isMinimized: false,
        isMaximized: false,
        position: { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 },
        size: { width: 500, height: 400 },
        zIndex: nextZIndex,
      }
      const next = new Map(prev)
      next.set(entry.id, win)
      return next
    })
  }, [])

  const unregisterWindow = React.useCallback((id: WindowId) => {
    setWindows((prev) => {
      const next = new Map(prev)
      next.delete(id)
      return next
    })
  }, [])

  const openWindow = React.useCallback((id: WindowId) => {
    setWindows((prev) => {
      const existing = prev.get(id)
      if (!existing) return prev
      nextZIndex += 1
      const next = new Map(prev)
      next.set(id, { ...existing, isOpen: true, isMinimized: false, zIndex: nextZIndex })
      return next
    })
  }, [])

  const closeWindow = React.useCallback((id: WindowId) => {
    setWindows((prev) => {
      const existing = prev.get(id)
      if (!existing) return prev
      const next = new Map(prev)
      next.set(id, { ...existing, isOpen: false })
      return next
    })
  }, [])

  const minimizeWindow = React.useCallback((id: WindowId) => {
    setWindows((prev) => {
      const existing = prev.get(id)
      if (!existing) return prev
      const next = new Map(prev)
      next.set(id, { ...existing, isMinimized: true })
      return next
    })
  }, [])

  const maximizeWindow = React.useCallback((id: WindowId) => {
    setWindows((prev) => {
      const existing = prev.get(id)
      if (!existing) return prev
      const next = new Map(prev)
      next.set(id, {
        ...existing,
        isMaximized: true,
        position: { x: 0, y: 0 },
        size: { width: window.innerWidth - 80, height: window.innerHeight },
      })
      return next
    })
  }, [])

  const restoreWindow = React.useCallback((id: WindowId) => {
    setWindows((prev) => {
      const existing = prev.get(id)
      if (!existing) return prev
      const next = new Map(prev)
      next.set(id, {
        ...existing,
        isMinimized: false,
        isMaximized: false,
        position: { x: 100, y: 100 },
        size: { width: 500, height: 400 },
      })
      return next
    })
  }, [])

  const bringToFront = React.useCallback((id: WindowId) => {
    setWindows((prev) => {
      const existing = prev.get(id)
      if (!existing) return prev
      nextZIndex += 1
      const next = new Map(prev)
      next.set(id, { ...existing, zIndex: nextZIndex })
      return next
    })
  }, [])

  const updatePosition = React.useCallback(
    (id: WindowId, pos: { x: number; y: number }) => {
      setWindows((prev) => {
        const existing = prev.get(id)
        if (!existing) return prev
        const next = new Map(prev)
        next.set(id, { ...existing, position: pos })
        return next
      })
    },
    []
  )

  const updateSize = React.useCallback(
    (id: WindowId, size: { width: number; height: number }) => {
      setWindows((prev) => {
        const existing = prev.get(id)
        if (!existing) return prev
        const next = new Map(prev)
        next.set(id, { ...existing, size })
        return next
      })
    },
    []
  )

  const value = React.useMemo<WindowManagerContextValue>(
    () => ({
      windows,
      registerWindow,
      unregisterWindow,
      openWindow,
      closeWindow,
      minimizeWindow,
      maximizeWindow,
      restoreWindow,
      bringToFront,
      updatePosition,
      updateSize,
    }),
    [
      windows,
      registerWindow,
      unregisterWindow,
      openWindow,
      closeWindow,
      minimizeWindow,
      maximizeWindow,
      restoreWindow,
      bringToFront,
      updatePosition,
      updateSize,
    ]
  )

  return (
    <WindowManagerContext.Provider value={value}>
      {children}
    </WindowManagerContext.Provider>
  )
}

export const useWindowManager = (): WindowManagerContextValue => {
  const context = React.useContext(WindowManagerContext)
  if (!context) {
    throw new Error("useWindowManager must be used within WindowManagerProvider")
  }
  return context
}
