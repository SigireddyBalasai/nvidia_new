"use client"

import { useFrontendTool } from "@copilotkit/react-core/v2"
import { z } from "zod"
import { PieChartComponent } from "@/components/pie-chart"
import { useWindowManager } from "@/components/window-manager"
import type { WindowContentProps } from "@/components/window-manager"

const PieChartSchema = z.object({
  title: z.string().describe("Title of the pie chart"),
  data: z
    .array(
      z.object({
        name: z.string().describe("Label for this slice"),
        value: z.number().describe("Numeric value for this slice"),
      })
    )
    .describe("Array of data items to display in the pie chart"),
})

interface ChartData {
  title: string
  data: { name: string; value: number }[]
}

const chartDataStore = new Map<string, ChartData>()

function PieChartWindowContent({ windowId }: WindowContentProps) {
  const chartData = chartDataStore.get(windowId)

  if (!chartData) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <span className="text-sm text-muted-foreground">Loading chart...</span>
      </div>
    )
  }

  return (
    <div className="flex h-full items-center justify-center p-4">
      <PieChartComponent data={chartData.data} className="h-[280px] w-full" outerRadius={100} />
    </div>
  )
}

let chartCounter = 0

/** Registers the renderPieChart frontend tool. */
export function PieChartTool() {
  const { registerWindow, openWindow } = useWindowManager()

  useFrontendTool({
    name: "renderPieChart",
    description:
      "Render a pie chart in a floating window. Each item needs a name (label) and value (number). Percentages are calculated automatically.",
    parameters: PieChartSchema,
    handler: async ({ title, data }) => {
      chartCounter++
      const windowId = `pie-chart-${chartCounter}`

      chartDataStore.set(windowId, { title, data })

      registerWindow({
        id: windowId,
        title,
        component: PieChartWindowContent,
      })
      openWindow(windowId)
      return ""
    },
    render: () => null,
  })

  return null
}
