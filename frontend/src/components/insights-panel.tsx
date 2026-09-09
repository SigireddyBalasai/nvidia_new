import { useStore } from "@/lib/store"
import { BarChart3, TrendingUp, PieChart, Activity } from "lucide-react"
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

interface InsightsPanelProps {
  isFullscreen?: boolean
}

export function InsightsPanel({ isFullscreen = false }: InsightsPanelProps) {
  const charts = useStore((s) => s.charts)
  const response = useStore((s) => s.response)
  const isProcessing = useStore((s) => s.isProcessing)

  // Parse charts from store
  const parsedCharts: ChartData[] = charts.map((c) => ({
    type: (c as any).type || "bar",
    title: (c as any).title || "Chart",
    data: c.data || [],
    xKey: (c as any).xKey,
    yKey: (c as any).yKey,
    nameKey: (c as any).nameKey,
    valueKey: (c as any).valueKey,
  }))

  return (
    <div
      className={`flex flex-col bg-card overflow-hidden ${
        isFullscreen ? "flex-1" : "w-1/2 min-w-[400px]"
      }`}
    >
      {/* Panel Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Insights & Visuals</h3>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-muted-foreground">
              {parsedCharts.length} chart{parsedCharts.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* Charts Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {parsedCharts.length === 0 && !isProcessing && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <BarChart3 size={48} className="mb-4 text-muted-foreground/30" />
            <h4 className="text-sm font-semibold text-foreground mb-2">
              No Visualizations Yet
            </h4>
            <p className="text-xs text-muted-foreground max-w-sm">
              Ask a question that requires data analysis. Charts and insights will appear here.
            </p>
          </div>
        )}

        {isProcessing && parsedCharts.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="relative mb-4">
              <BarChart3 size={48} className="text-muted-foreground/30 animate-pulse" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              </div>
            </div>
            <h4 className="text-sm font-semibold text-foreground mb-2">
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

        {/* Response Summary */}
        {response && (
          <div className="rounded-xl border border-border bg-card p-4">
            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <TrendingUp size={14} className="text-primary" />
              Analysis Summary
            </h4>
            <div className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
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
      <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        {chart.type === "bar" && <BarChart3 size={14} className="text-primary" />}
        {chart.type === "line" && <TrendingUp size={14} className="text-primary" />}
        {chart.type === "pie" && <PieChart size={14} className="text-primary" />}
        {chart.title}
      </h4>
      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {chart.type === "bar" ? (
            <BarChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
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
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
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