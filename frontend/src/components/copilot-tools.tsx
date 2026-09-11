"use client"

import {
  useFrontendTool,
  useHumanInTheLoop,
  ToolCallStatus,
} from "@copilotkit/react-core/v2"
import { z } from "zod"
import { useState } from "react"
import { MessageCircleQuestion, Send } from "lucide-react"
import { useStore } from "@/lib/store"
import { PieChartComponent } from "@/components/pie-chart"
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

export function PieChartTool() {
  useFrontendTool({
    name: "renderPieChart",
    description:
      "Render a pie chart inline. Each item needs a name (label) and value (number). Percentages are calculated automatically.",
    parameters: PieChartSchema,
    handler: async ({ title, data }) => {
      const { charts, setCharts } = useStore.getState()
      setCharts([
        ...charts,
        { type: "pie", title, data, nameKey: "name", valueKey: "value" },
      ])
      return `Rendered pie chart "${title}" with ${data.length} slices.`
    },
    render: ({ args, status }) => {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- CopilotKit passes partial args at runtime
      if (status === "inProgress" || !args.data) {
        return (
          <div className="flex items-center justify-center p-4">
            <span className="text-sm text-muted-foreground">
              Loading chart...
            </span>
          </div>
        )
      }
      return (
        <div className="flex flex-col items-center justify-center p-4">
          <PieChartComponent
            data={args.data}
            className="h-[280px] w-full"
            outerRadius={100}
          />
        </div>
      )
    },
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

export function BarChartTool() {
  useFrontendTool({
    name: "renderBarChart",
    description:
      "Render a bar chart inline. Each item needs a name (x-axis label) and value (bar height).",
    parameters: BarChartSchema,
    handler: async ({ title, data }) => {
      const { charts, setCharts } = useStore.getState()
      setCharts([
        ...charts,
        { type: "bar", title, data, xKey: "name", yKey: "value" },
      ])
      return `Rendered bar chart "${title}" with ${data.length} bars.`
    },
    render: ({ args, status }) => {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- CopilotKit passes partial args at runtime
      if (status === "inProgress" || !args.data) {
        return (
          <div className="flex items-center justify-center p-4">
            <span className="text-sm text-muted-foreground">
              Loading chart...
            </span>
          </div>
        )
      }
      return (
        <div className="flex flex-col items-center justify-center p-4">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={args.data}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
              />
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
    },
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

export function LineChartTool() {
  useFrontendTool({
    name: "renderLineChart",
    description:
      "Render a line chart inline. Each item needs a name (x-axis label) and value (y-axis point).",
    parameters: LineChartSchema,
    handler: async ({ title, data }) => {
      const { charts, setCharts } = useStore.getState()
      setCharts([
        ...charts,
        { type: "line", title, data, xKey: "name", yKey: "value" },
      ])
      return `Rendered line chart "${title}" with ${data.length} points.`
    },
    render: ({ args, status }) => {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- CopilotKit passes partial args at runtime
      if (status === "inProgress" || !args.data) {
        return (
          <div className="flex items-center justify-center p-4">
            <span className="text-sm text-muted-foreground">
              Loading chart...
            </span>
          </div>
        )
      }
      return (
        <div className="flex flex-col items-center justify-center p-4">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={args.data}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
              />
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
    },
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

export function TableTool() {
  useFrontendTool({
    name: "renderTable",
    description:
      "Render a data table inline. Provide column headers and row data as arrays of strings.",
    parameters: TableSchema,
    handler: async ({ title, columns, rows }) => {
      const { charts, setCharts } = useStore.getState()
      const objectRows = rows.map((row) => {
        const obj: Record<string, unknown> = {}
        columns.forEach((col, i) => {
          obj[col] = row[i] ?? ""
        })
        return obj
      })
      setCharts([
        ...charts,
        { type: "table", title, columns, rows: objectRows },
      ])
      return `Rendered table "${title}" with ${columns.length} columns and ${rows.length} rows.`
    },
    render: ({ args, status }) => {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- CopilotKit passes partial args at runtime
      if (status === "inProgress" || !args.columns || !args.rows) {
        return (
          <div className="flex items-center justify-center p-4">
            <span className="text-sm text-muted-foreground">
              Loading table...
            </span>
          </div>
        )
      }
      return (
        <div className="overflow-auto p-4">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                {args.columns.map((col, i) => (
                  <th
                    key={i}
                    className="px-3 py-2 text-left font-semibold text-foreground"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {args.rows.map((row, i) => (
                <tr
                  key={i}
                  className="border-b border-border/50 hover:bg-muted/50"
                >
                  {row.map((cell, j) => (
                    <td key={j} className="px-3 py-2 text-muted-foreground">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    },
  })

  return null
}

// ─── Ask User Tool (HITL) ───

const AskUserSchema = z.object({
  question: z.string().describe("The question to ask the user"),
  context: z
    .string()
    .optional()
    .describe("Optional context about why this question is being asked"),
})

export function AskUserTool() {
  useHumanInTheLoop(
    {
      name: "ask_user",
      description:
        "Ask the user a question and wait for their response before continuing.",
      parameters: AskUserSchema,
      render: ({ args, status, respond }) => {
        const [answer, setAnswer] = useState("")

        if (status === ToolCallStatus.Executing) {
          return (
            <div className="max-w-[85%] rounded-xl border border-blue-500/30 bg-blue-500/5 p-4">
              <div className="mb-3 flex items-start gap-2">
                <MessageCircleQuestion
                  size={14}
                  className="mt-0.5 shrink-0 text-blue-500"
                />
                <div>
                  <p className="mb-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
                    Question from Agent
                  </p>
                  <p className="text-sm text-foreground">{args.question}</p>
                  {args.context && (
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {args.context}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && answer.trim()) {
                      respond(answer.trim())
                      setAnswer("")
                    }
                  }}
                  placeholder="Type your answer..."
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs focus:ring-2 focus:ring-primary/30 focus:outline-none"
                />
                <button
                  onClick={() => {
                    if (answer.trim()) {
                      respond(answer.trim())
                      setAnswer("")
                    }
                  }}
                  disabled={!answer.trim()}
                  className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  <Send size={12} />
                </button>
              </div>
            </div>
          )
        }

        if (status === ToolCallStatus.Complete) {
          return null
        }

        return null
      },
    },
    []
  )

  return null
}
