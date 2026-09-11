import { useStore } from "@/lib/store"
import { BarChart3, TrendingUp, PieChart, Activity, Table } from "lucide-react"
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
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
]

interface ChartData {
  type: "bar" | "line" | "pie"
  title: string
  data: Record<string, unknown>[]
  xKey?: string
  yKey?: string
  nameKey?: string
  valueKey?: string
}

interface TableData {
  title: string
  columns: string[]
  rows: Record<string, unknown>[]
}

function isTableData(v: any): boolean {
  return v.type === "table"
}

interface InsightsPanelProps {
  isFullscreen?: boolean
}

export function InsightsPanel({ isFullscreen = false }: InsightsPanelProps) {
  const charts = useStore((s) => s.charts)
  const response = useStore((s) => s.response)
  const isProcessing = useStore((s) => s.isProcessing)

  // Separate charts and tables from store
  const parsedCharts: ChartData[] = charts
    .filter((c) => !isTableData(c))
    .map((c) => ({
      type: (c as any).type || "bar",
      title: (c as any).title || "Chart",
      data: (c as any).data || [],
      xKey: (c as any).xKey,
      yKey: (c as any).yKey,
      nameKey: (c as any).nameKey,
      valueKey: (c as any).valueKey,
    }))

  const tables: TableData[] = charts.filter(isTableData)

  return (
    <div
      className={`flex flex-col overflow-hidden bg-card ${
        isFullscreen ? "flex-1" : "w-1/2 min-w-[400px]"
      }`}
    >
      {/* Panel Header */}
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-primary" />
            <h3 className="text-sm font-semibold text-foreground">
              Insights & Visuals
            </h3>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-muted-foreground">
              {parsedCharts.length} chart{parsedCharts.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* Charts Area */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {parsedCharts.length === 0 && !isProcessing && (
          <div className="flex h-full flex-col items-center justify-center py-12 text-center">
            <BarChart3 size={48} className="mb-4 text-muted-foreground/30" />
            <h4 className="mb-2 text-sm font-semibold text-foreground">
              No Visualizations Yet
            </h4>
            <p className="max-w-sm text-xs text-muted-foreground">
              Ask a question that requires data analysis. Charts and insights
              will appear here.
            </p>
          </div>
        )}

        {isProcessing && parsedCharts.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center py-12 text-center">
            <div className="relative mb-4">
              <BarChart3
                size={48}
                className="animate-pulse text-muted-foreground/30"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            </div>
            <h4 className="mb-2 text-sm font-semibold text-foreground">
              Generating Insights...
            </h4>
            <p className="text-xs text-muted-foreground">
              The agent is analyzing your data.
            </p>
          </div>
        )}

        {parsedCharts.map((chart, i) => (
          <ChartCard key={i} chart={chart} />
        ))}

        {tables.map((table, i) => (
          <TableCard key={`table-${i}`} table={table} />
        ))}

        {/* Response Summary */}
        {response && (
          <div className="rounded-xl border border-border bg-card p-4">
            <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <TrendingUp size={14} className="text-primary" />
              Analysis Summary
            </h4>
            <div className="text-xs leading-relaxed whitespace-pre-wrap text-muted-foreground">
              {response}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ChartCard({ chart }: { chart: ChartData }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
        {chart.type === "bar" && (
          <BarChart3 size={14} className="text-primary" />
        )}
        {chart.type === "line" && (
          <TrendingUp size={14} className="text-primary" />
        )}
        {chart.type === "pie" && (
          <PieChart size={14} className="text-primary" />
        )}
        {chart.title}
      </h4>
      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {chart.type === "bar" ? (
            <BarChart data={chart.data}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
              />
              <XAxis
                dataKey={chart.xKey || "name"}
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
                dataKey={chart.yKey || "value"}
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          ) : chart.type === "line" ? (
            <LineChart data={chart.data}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
              />
              <XAxis
                dataKey={chart.xKey || "name"}
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
                dataKey={chart.yKey || "value"}
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--primary))" }}
              />
            </LineChart>
          ) : (
            <RechartsPieChart>
              <Pie
                data={chart.data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={3}
                dataKey={chart.valueKey || "value"}
                nameKey={chart.nameKey || "name"}
              >
                {chart.data.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Legend />
            </RechartsPieChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function TableCard({ table }: { table: any }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
        <Table size={14} className="text-primary" />
        {table.title}
      </h4>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              {table.columns.map((col: string) => (
                <th
                  key={col}
                  className="px-3 py-2 text-left font-semibold text-muted-foreground"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row: Record<string, unknown>, i: number) => (
              <tr
                key={i}
                className="border-b border-border/50 transition-colors hover:bg-muted/30"
              >
                {table.columns.map((col: string) => (
                  <td key={col} className="px-3 py-2 text-foreground">
                    {row[col] !== undefined ? String(row[col]) : "-"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
