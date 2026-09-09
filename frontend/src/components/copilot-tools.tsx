"use client"

import { useFrontendTool } from "@copilotkit/react-core/v2"
import { z } from "zod"
import { PieChartComponent } from "@/components/pie-chart"
import { useWindowManager } from "@/components/window-manager"
import type { WindowContentProps } from "@/components/window-manager"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts"

// ─── Shared Chart Data Store ───

interface ChartData {
  title: string
  data: { name: string; value: number }[]
  type: "pie" | "bar" | "line"
  xKey?: string
  yKey?: string
}

const chartDataStore = new Map<string, ChartData>()
let chartCounter = 0

// ─── Pie Chart Tool ───

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

      chartDataStore.set(windowId, { title, data, type: "pie" })

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

// ─── Bar Chart Tool ───

const BarChartSchema = z.object({
  title: z.string().describe("Title of the bar chart"),
  data: z
    .array(
      z.object({
        name: z.string().describe("Label for this bar (x-axis)"),
        value: z.number().describe("Numeric value for this bar (y-axis)"),
      })
    )
    .describe("Array of data items to display in the bar chart"),
})

function BarChartWindowContent({ windowId }: WindowContentProps) {
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
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData.data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              fontSize: "12px",
            }}
          />
          <Bar
            dataKey="value"
            fill="hsl(var(--primary))"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function BarChartTool() {
  const { registerWindow, openWindow } = useWindowManager()

  useFrontendTool({
    name: "renderBarChart",
    description:
      "Render a bar chart in a floating window. Each item needs a name (x-axis label) and value (bar height).",
    parameters: BarChartSchema,
    handler: async ({ title, data }) => {
      chartCounter++
      const windowId = `bar-chart-${chartCounter}`

      chartDataStore.set(windowId, { title, data, type: "bar" })

      registerWindow({
        id: windowId,
        title,
        component: BarChartWindowContent,
      })
      openWindow(windowId)
      return ""
    },
    render: () => null,
  })

  return null
}

// ─── Line Chart Tool ───

const LineChartSchema = z.object({
  title: z.string().describe("Title of the line chart"),
  data: z
    .array(
      z.object({
        name: z.string().describe("Label for this point (x-axis)"),
        value: z.number().describe("Numeric value for this point (y-axis)"),
      })
    )
    .describe("Array of data items to display in the line chart"),
})

function LineChartWindowContent({ windowId }: WindowContentProps) {
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
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData.data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              fontSize: "12px",
            }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{ fill: "hsl(var(--primary))" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function LineChartTool() {
  const { registerWindow, openWindow } = useWindowManager()

  useFrontendTool({
    name: "renderLineChart",
    description:
      "Render a line chart in a floating window. Each item needs a name (x-axis label) and value (y-axis point).",
    parameters: LineChartSchema,
    handler: async ({ title, data }) => {
      chartCounter++
      const windowId = `line-chart-${chartCounter}`

      chartDataStore.set(windowId, { title, data, type: "line" })

      registerWindow({
        id: windowId,
        title,
        component: LineChartWindowContent,
      })
      openWindow(windowId)
      return ""
    },
    render: () => null,
  })

  return null
}

// ─── Table Tool ───

const TableSchema = z.object({
  title: z.string().describe("Title of the table"),
  columns: z
    .array(z.string().describe("Column header name"))
    .describe("Array of column headers"),
  rows: z
    .array(z.array(z.string().describe("Cell value")))
    .describe("Array of rows, each row is an array of cell values"),
})

interface TableData {
  title: string
  columns: string[]
  rows: string[][]
}

const tableDataStore = new Map<string, TableData>()

function TableWindowContent({ windowId }: WindowContentProps) {
  const tableData = tableDataStore.get(windowId)

  if (!tableData) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <span className="text-sm text-muted-foreground">Loading table...</span>
      </div>
    )
  }

  return (
    <div className="flex h-full overflow-auto p-4">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border">
            {tableData.columns.map((col, i) => (
              <th
                key={i}
                className="text-left py-2 px-3 font-semibold text-foreground"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tableData.rows.map((row, i) => (
            <tr
              key={i}
              className="border-b border-border/50 hover:bg-muted/50"
            >
              {row.map((cell, j) => (
                <td key={j} className="py-2 px-3 text-muted-foreground">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function TableTool() {
  const { registerWindow, openWindow } = useWindowManager()

  useFrontendTool({
    name: "renderTable",
    description:
      "Render a data table in a floating window. Provide column headers and row data as arrays of strings.",
    parameters: TableSchema,
    handler: async ({ title, columns, rows }) => {
      chartCounter++
      const windowId = `table-${chartCounter}`

      tableDataStore.set(windowId, { title, columns, rows })

      registerWindow({
        id: windowId,
        title,
        component: TableWindowContent,
      })
      openWindow(windowId)
      return ""
    },
    render: () => null,
  })

  return null
}