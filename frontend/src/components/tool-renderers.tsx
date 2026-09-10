import { useFrontendTool } from "@copilotkit/react-core/v2"
import { z } from "zod"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  LineChart,
  PieChart,
  Pie,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { useState } from "react"
import { BarChart2, ChevronDown, ChevronUp, Loader2, CheckCircle2, XCircle, Table2 } from "lucide-react"

// ─── Color palette (matches dataforge-charts.tsx) ───

const AXIS_TICK = { fontSize: 11, fill: "hsl(var(--muted-foreground))" } as const
const TOOLTIP_STYLE = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  fontSize: "12px",
} as const
const GRID_STROKE = "hsl(var(--border))"
const ACCENT = "#6366f1"
const SUCCESS = "#10b981"
const DANGER = "#ef4444"
const WARNING = "#f59e0b"
const SERIES_COLORS = [ACCENT, SUCCESS, DANGER, WARNING, "#8b5cf6", "#06b6d4", "#ec4899"]

// ─── Shared shell ───

function ChartShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center p-2">
      <ResponsiveContainer width="100%" height={240}>
        {children}
      </ResponsiveContainer>
    </div>
  )
}

function ToolStatusBadge({ status }: { status: string }) {
  if (status === "inProgress" || status === "executing") {
    return <Loader2 size={12} className="animate-spin text-blue-500" />
  }
  if (status === "error") {
    return <XCircle size={12} className="text-destructive" />
  }
  return <CheckCircle2 size={12} className="text-green-500" />
}

// ─── 1. render_table / rendertable ───

const TableSchema = z.object({
  title: z.string().optional(),
  columns: z.array(z.union([z.string(), z.object({ name: z.string(), accessor: z.string() })])).optional(),
  rows: z.array(z.record(z.union([z.string(), z.number(), z.boolean(), z.null()]))).optional(),
  data: z.array(z.record(z.union([z.string(), z.number(), z.boolean(), z.null()]))).optional(),
})

function TableRenderer({ parameters, status }: { parameters: z.infer<typeof TableSchema>; status: string }) {
  const [isExpanded, setIsExpanded] = useState(true)
  const rows = parameters.rows || parameters.data || []
  const cols = parameters.columns || (rows.length > 0 ? Object.keys(rows[0]) : [])

  const normalizedCols = cols.map((c) =>
    typeof c === "string" ? { name: c, accessor: c } : c
  )

  return (
    <div className="max-w-[80%] rounded-xl border border-border bg-card overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-secondary/30 transition-colors"
      >
        <ToolStatusBadge status={status} />
        <Table2 size={14} className="text-muted-foreground shrink-0" />
        <span className="text-xs font-medium text-foreground">
          {parameters.title || "Table"}
        </span>
        <span className="text-[10px] text-muted-foreground ml-auto">
          {rows.length} rows
        </span>
        <div className="flex-1" />
        {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>
      {isExpanded && rows.length > 0 && (
        <div className="overflow-x-auto border-t border-border">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted/50">
                {normalizedCols.map((col) => (
                  <th
                    key={col.accessor}
                    className="px-3 py-2 text-left font-semibold text-muted-foreground whitespace-nowrap"
                  >
                    {col.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 50).map((row, i) => (
                <tr key={i} className="border-t border-border/50 hover:bg-muted/20">
                  {normalizedCols.map((col) => (
                    <td key={col.accessor} className="px-3 py-1.5 text-foreground whitespace-nowrap">
                      {row[col.accessor] != null ? String(row[col.accessor]) : "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length > 50 && (
            <p className="text-[10px] text-muted-foreground text-center py-1">
              Showing 50 of {rows.length} rows
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── 2. render_chart / renderchart ───

const ChartSchema = z.object({
  title: z.string().optional(),
  chart_type: z.string().optional(),
  type: z.string().optional(),
  data: z.array(z.record(z.union([z.string(), z.number(), z.boolean(), z.null()]))).optional(),
  x_key: z.string().optional(),
  xKey: z.string().optional(),
  y_key: z.string().optional(),
  yKey: z.string().optional(),
  name_key: z.string().optional(),
  nameKey: z.string().optional(),
  value_key: z.string().optional(),
  valueKey: z.string().optional(),
})

function ChartRenderer({ parameters, status }: { parameters: z.infer<typeof ChartSchema>; status: string }) {
  const [isExpanded, setIsExpanded] = useState(true)
  const chartType = parameters.chart_type || parameters.type || "bar"
  const data = parameters.data || []
  const xKey = parameters.x_key || parameters.xKey || Object.keys(data[0] || {})[0] || "name"
  const yKey = parameters.y_key || parameters.yKey || Object.keys(data[0] || {})[1] || "value"
  const nameKey = parameters.name_key || parameters.nameKey
  const valueKey = parameters.value_key || parameters.valueKey

  const renderChart = () => {
    if (data.length === 0) return null

    if (chartType === "pie") {
      const labelKey = nameKey || xKey
      const valKey = valueKey || yKey
      return (
        <ChartShell>
          <PieChart>
            <Pie
              data={data}
              dataKey={valKey}
              nameKey={labelKey}
              cx="50%"
              cy="50%"
              outerRadius={90}
              label
            >
              {data.map((_, i) => (
                <Cell key={i} fill={SERIES_COLORS[i % SERIES_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={TOOLTIP_STYLE} />
          </PieChart>
        </ChartShell>
      )
    }

    if (chartType === "scatter") {
      return (
        <ChartShell>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
            <XAxis dataKey={xKey} tick={AXIS_TICK} />
            <YAxis dataKey={yKey} tick={AXIS_TICK} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Scatter data={data} fill={ACCENT} />
          </ScatterChart>
        </ChartShell>
      )
    }

    if (chartType === "line" || chartType === "area") {
      const Comp = chartType === "area" ? ComposedChart : LineChart
      return (
        <ChartShell>
          <Comp data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
            <XAxis dataKey={xKey} tick={AXIS_TICK} />
            <YAxis tick={AXIS_TICK} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            {nameKey && valueKey ? (
              // Multiple series via nameKey
              [...new Set(data.map((d) => String(d[nameKey])))].map((series, i) => (
                <Line
                  key={series}
                  type="monotone"
                  dataKey={valueKey}
                  name={series}
                  stroke={SERIES_COLORS[i % SERIES_COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                  data={data.filter((d) => String(d[nameKey]) === series)}
                />
              ))
            ) : (
              <Line type="monotone" dataKey={yKey} stroke={ACCENT} strokeWidth={2.5} dot={{ fill: ACCENT }} />
            )}
          </Comp>
        </ChartShell>
      )
    }

    // Default: bar
    return (
      <ChartShell>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
          <XAxis dataKey={xKey} tick={AXIS_TICK} />
          <YAxis tick={AXIS_TICK} />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Bar dataKey={yKey} fill={ACCENT} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartShell>
    )
  }

  return (
    <div className="max-w-[80%] rounded-xl border border-border bg-card overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-secondary/30 transition-colors"
      >
        <ToolStatusBadge status={status} />
        <BarChart2 size={14} className="text-muted-foreground shrink-0" />
        <span className="text-xs font-medium text-foreground">
          {parameters.title || `${chartType} chart`}
        </span>
        <div className="flex-1" />
        {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>
      {isExpanded && (
        <div className="border-t border-border">
          {renderChart()}
        </div>
      )}
    </div>
  )
}

// ─── 3. Fallback renderer for unregistered tools ───

function FallbackRenderer({ name, parameters, status, result }: any) {
  const [isExpanded, setIsExpanded] = useState(false)
  return (
    <div className="max-w-[80%] rounded-xl border border-border bg-card overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-secondary/30 transition-colors"
      >
        <ToolStatusBadge status={status} />
        <span className="text-xs font-medium text-foreground">{name}</span>
        <div className="flex-1" />
        {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>
      {isExpanded && (
        <div className="px-4 py-2 border-t border-border text-xs text-muted-foreground space-y-1">
          {Object.keys(parameters || {}).length > 0 && (
            <pre className="whitespace-pre-wrap overflow-x-auto">{JSON.stringify(parameters, null, 2)}</pre>
          )}
          {result && (
            <pre className="whitespace-pre-wrap overflow-x-auto text-foreground">{result}</pre>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Mount all renderers ───

export function ToolRenderers() {
  useFrontendTool({
    name: "render_table",
    description: "Render a table",
    parameters: TableSchema,
    handler: async () => "Table rendered",
    render: ({ args, status }) => <TableRenderer parameters={args} status={status} />,
  })

  useFrontendTool({
    name: "rendertable",
    description: "Render a table",
    parameters: TableSchema,
    handler: async () => "Table rendered",
    render: ({ args, status }) => <TableRenderer parameters={args} status={status} />,
  })

  useFrontendTool({
    name: "render_chart",
    description: "Render a chart",
    parameters: ChartSchema,
    handler: async () => "Chart rendered",
    render: ({ args, status }) => <ChartRenderer parameters={args} status={status} />,
  })

  useFrontendTool({
    name: "renderchart",
    description: "Render a chart",
    parameters: ChartSchema,
    handler: async () => "Chart rendered",
    render: ({ args, status }) => <ChartRenderer parameters={args} status={status} />,
  })

  return null
}
