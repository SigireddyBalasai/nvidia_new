"use client"

import * as React from "react"

export type WindowOperations =
  | "resize"
  | "move"
  | "close"
  | "minimize"
  | "maximize"

export type Position = {
  x: number
  y: number
}

export type Size = {
  width: number
  height: number
}

export type WindowState = {
  surfaceId: string
  operations: WindowOperations[]
  isOpen: boolean
  isMinimized: boolean
  isMaximized: boolean
  position: Position
  size: Size
  zIndex: number
  savedPosition?: Position
  savedSize?: Size
}

export type WindowId = string

export type FloatingWindowContextValue = {
  windows: Map<WindowId, WindowState>
  a2uiOperations: Map<WindowId, Record<string, unknown>[]>
  openWindow: (
    surfaceId: WindowId,
    initialPosition?: Position,
    initialSize?: Size
  ) => void
  closeWindow: (surfaceId: WindowId) => void
  minimizeWindow: (surfaceId: WindowId) => void
  maximizeWindow: (surfaceId: WindowId) => void
  restoreWindow: (surfaceId: WindowId) => void
  updatePosition: (surfaceId: WindowId, position: Position) => void
  updateSize: (surfaceId: WindowId, size: Size) => void
  bringToFront: (surfaceId: WindowId) => void
  setOperations: (surfaceId: WindowId, operations: WindowOperations[]) => void
  setA2UIOperations: (surfaceId: WindowId, operations: Record<string, unknown>[]) => void
}

const A2UIFloatingWindowContext = React.createContext<
  FloatingWindowContextValue | undefined
>(undefined)

let nextZIndex = 1000

export const A2UIFloatingWindowContextProvider: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  const [windows, setWindows] = React.useState<Map<WindowId, WindowState>>(
    () => new Map()
  )

  const [a2uiOperations, setA2uiOperations] = React.useState<
    Map<WindowId, Record<string, unknown>[]>
  >(() => new Map())

  const openWindow = React.useCallback(
    (
      surfaceId: WindowId,
      initialPosition?: Position,
      initialSize?: Size
    ) => {
      setWindows((prev) => {
        if (prev.has(surfaceId)) return prev
        nextZIndex += 1
        const newWindow: WindowState = {
          surfaceId,
          operations: ["resize", "move", "close"],
          isOpen: true,
          isMinimized: false,
          isMaximized: false,
          position: initialPosition ?? { x: 100, y: 100 },
          size: initialSize ?? { width: 400, height: 300 },
          zIndex: nextZIndex,
        }
        const next = new Map(prev)
        next.set(surfaceId, newWindow)
        return next
      })
    },
    []
  )

  const closeWindow = React.useCallback((surfaceId: WindowId) => {
    setWindows((prev) => {
      if (!prev.has(surfaceId)) return prev
      const next = new Map(prev)
      next.delete(surfaceId)
      return next
    })
  }, [])

  const updatePosition = React.useCallback(
    (surfaceId: WindowId, position: Position) => {
      setWindows((prev) => {
        const existing = prev.get(surfaceId)
        if (!existing) return prev
        const next = new Map(prev)
        next.set(surfaceId, { ...existing, position })
        return next
      })
    },
    []
  )

  const updateSize = React.useCallback(
    (surfaceId: WindowId, size: Size) => {
      setWindows((prev) => {
        const existing = prev.get(surfaceId)
        if (!existing) return prev
        const next = new Map(prev)
        next.set(surfaceId, { ...existing, size })
        return next
      })
    },
    []
  )

  const bringToFront = React.useCallback((surfaceId: WindowId) => {
    setWindows((prev) => {
      const existing = prev.get(surfaceId)
      if (!existing) return prev
      nextZIndex += 1
      const next = new Map(prev)
      next.set(surfaceId, { ...existing, zIndex: nextZIndex })
      return next
    })
  }, [])

  const minimizeWindow = React.useCallback((surfaceId: WindowId) => {
    setWindows((prev) => {
      const existing = prev.get(surfaceId)
      if (!existing) return prev
      const next = new Map(prev)
      next.set(surfaceId, { ...existing, isMinimized: true })
      return next
    })
  }, [])

  const maximizeWindow = React.useCallback((surfaceId: WindowId) => {
    setWindows((prev) => {
      const existing = prev.get(surfaceId)
      if (!existing) return prev
      const next = new Map(prev)
      next.set(surfaceId, {
        ...existing,
        isMaximized: true,
        savedPosition: { ...existing.position },
        savedSize: { ...existing.size },
        position: { x: 0, y: 0 },
        size: {
          width: typeof window !== "undefined" ? window.innerWidth : 1200,
          height: typeof window !== "undefined" ? window.innerHeight : 800,
        },
      })
      return next
    })
  }, [])

  const restoreWindow = React.useCallback((surfaceId: WindowId) => {
    setWindows((prev) => {
      const existing = prev.get(surfaceId)
      if (!existing) return prev
      const next = new Map(prev)
      next.set(surfaceId, {
        ...existing,
        isMinimized: false,
        isMaximized: false,
        position: existing.savedPosition ?? { x: 100, y: 100 },
        size: existing.savedSize ?? { width: 400, height: 300 },
        savedPosition: undefined,
        savedSize: undefined,
      })
      return next
    })
  }, [])

  const setOperations = React.useCallback(
    (surfaceId: WindowId, operations: WindowOperations[]) => {
      setWindows((prev) => {
        const existing = prev.get(surfaceId)
        if (!existing) return prev
        const next = new Map(prev)
        next.set(surfaceId, { ...existing, operations })
        return next
      })
    },
    []
  )

  const setA2UIOperations = React.useCallback(
    (surfaceId: WindowId, operations: Record<string, unknown>[]) => {
      setA2uiOperations((prev) => {
        const next = new Map(prev)
        next.set(surfaceId, operations)
        return next
      })
    },
    []
  )

  const value = React.useMemo<FloatingWindowContextValue>(
    () => ({
      windows,
      a2uiOperations,
      openWindow,
      closeWindow,
      minimizeWindow,
      maximizeWindow,
      restoreWindow,
      updatePosition,
      updateSize,
      bringToFront,
      setOperations,
      setA2UIOperations,
    }),
    [
      windows,
      a2uiOperations,
      openWindow,
      closeWindow,
      minimizeWindow,
      maximizeWindow,
      restoreWindow,
      updatePosition,
      updateSize,
      bringToFront,
      setOperations,
      setA2UIOperations,
    ]
  )

  return (
    <A2UIFloatingWindowContext.Provider value={value}>
      {children}
    </A2UIFloatingWindowContext.Provider>
  )
}

export const useA2UIFloatingWindowContext =
  (): FloatingWindowContextValue => {
    const context = React.useContext(A2UIFloatingWindowContext)
    if (!context) {
      throw new Error(
        "useA2UIFloatingWindowContext must be used within A2UIFloatingWindowContextProvider"
      )
    }
    return context
  }

export { A2UIFloatingWindowContext }
