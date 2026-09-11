import { useFrontendTool } from "@copilotkit/react-core/v2"
import { z } from "zod"
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  aggregateCategory,
  aggregateTimeSeries,
  buildNetwork,
  scatterPoints,
  simulationCurve,
  waterfallSegments,
} from "@/lib/dataforge-charts"

// ─── Shared look & feel (matches existing chart tools) ───

const AXIS_TICK = {
  fontSize: 11,
  fill: "hsl(var(--muted-foreground))",
} as const
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

const RowSchema = z.record(
  z.string(),
  z.union([z.string(), z.number(), z.boolean(), z.null()])
)

function LoadingFallback({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center p-4">
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  )
}

function ChartShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center p-4">
      <ResponsiveContainer width="100%" height={300}>
        {children}
      </ResponsiveContainer>
    </div>
  )
}

function ChartTitle({ title }: { title: string }) {
  return (
    <h4 className="px-4 pt-3 text-sm font-semibold text-foreground">{title}</h4>
  )
}

// ─── 1. Time series ───

const TimeSeriesSchema = z.object({
  title: z.string().describe("Title of the time series chart"),
  rows: z
    .array(RowSchema)
    .describe(
      "Raw data rows with a date column and a numeric metric column (max ~300 rows)"
    ),
  dateCol: z
    .string()
    .optional()
    .describe("Date column name; auto-detected if omitted"),
  metricCol: z
    .string()
    .optional()
    .describe("Metric column name; auto-detected if omitted"),
})

export function TimeSeriesChartTool() {
  useFrontendTool({
    name: "renderTimeSeriesChart",
    description:
      "Render a historical trend line chart from data rows (e.g. revenue over time). Aggregates a numeric metric by date. Use for trends, declines, growth and seasonality.",
    parameters: TimeSeriesSchema,
    handler: async ({ title, rows, dateCol, metricCol }) => {
      const built = aggregateTimeSeries(rows, dateCol, metricCol)
      if (!built)
        return "Not enough date/metric data to build a time series (need 2+ dated points)."
      return `Rendered time series "${title}" with ${built.points.length} points.`
    },
    render: ({ args, status }) => {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- CopilotKit passes partial args at runtime
      if (status === "inProgress" || !args.rows)
        return <LoadingFallback label="Loading chart..." />
      const built = aggregateTimeSeries(args.rows, args.dateCol, args.metricCol)
      if (!built) return null
      return (
        <div>
          <ChartTitle title={args.title} />
          <ChartShell>
            <LineChart data={built.points}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
              <XAxis dataKey="name" tick={AXIS_TICK} minTickGap={24} />
              <YAxis tick={AXIS_TICK} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Line
                type="monotone"
                dataKey="value"
                name={built.metricCol}
                stroke={SUCCESS}
                strokeWidth={2.5}
                dot={{ fill: SUCCESS }}
              />
            </LineChart>
          </ChartShell>
        </div>
      )
    },
  })
  return null
}

// ─── 2. Forecast with confidence band ───

const ForecastSchema = z.object({
  title: z.string().describe("Title of the forecast chart"),
  forecast: z
    .array(z.number())
    .describe("Point forecast values per future period"),
  lower: z
    .array(z.number())
    .optional()
    .describe("Lower 95% confidence bound per period"),
  upper: z
    .array(z.number())
    .optional()
    .describe("Upper 95% confidence bound per period"),
})

export function ForecastChartTool() {
  useFrontendTool({
    name: "renderForecastChart",
    description:
      "Render an ML demand forecast horizon with optional 95% confidence band. Use for predictions, projections and what-if baselines.",
    parameters: ForecastSchema,
    handler: async ({ title, forecast }) => {
      if (forecast.length === 0) return "Forecast array is empty."
      return `Rendered forecast "${title}" with ${forecast.length} periods.`
    },
    render: ({ args, status }) => {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- CopilotKit passes partial args at runtime
      if (status === "inProgress" || !args.forecast)
        return <LoadingFallback label="Loading chart..." />
      if (args.forecast.length === 0) return null
      const rows = args.forecast.map((value, i) => ({
        period: `Period +${i + 1}`,
        value,
        lower: args.lower?.[i] ?? null,
        upper: args.upper?.[i] ?? null,
      }))
      return (
        <div>
          <ChartTitle title={args.title} />
          <ChartShell>
            <ComposedChart data={rows}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
              <XAxis dataKey="period" tick={AXIS_TICK} />
              <YAxis tick={AXIS_TICK} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Area
                type="monotone"
                dataKey="upper"
                name="Upper 95%"
                stroke="transparent"
                fill={ACCENT}
                fillOpacity={0.15}
                connectNulls
              />
              <Area
                type="monotone"
                dataKey="lower"
                name="Lower 95%"
                stroke="transparent"
                fill={ACCENT}
                fillOpacity={0.15}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="value"
                name="Projected"
                stroke={ACCENT}
                strokeWidth={2.5}
                dot={{ fill: ACCENT }}
              />
            </ComposedChart>
          </ChartShell>
        </div>
      )
    },
  })
  return null
}

// ─── 3. Category breakdown ───

const CategorySchema = z.object({
  title: z.string().describe("Title of the breakdown chart"),
  rows: z
    .array(RowSchema)
    .describe(
      "Raw data rows with a category column and a numeric metric column (max ~300 rows)"
    ),
  catCol: z
    .string()
    .optional()
    .describe("Category column name; auto-detected if omitted"),
  metricCol: z
    .string()
    .optional()
    .describe("Metric column name; auto-detected if omitted"),
})

export function CategoryChartTool() {
  useFrontendTool({
    name: "renderCategoryChart",
    description:
      "Render a bar chart breaking a metric down by category (product, region, segment, channel). Use for top-N rankings and distribution comparisons.",
    parameters: CategorySchema,
    handler: async ({ title, rows, catCol, metricCol }) => {
      const built = aggregateCategory(rows, catCol, metricCol)
      if (!built)
        return "Could not find a category + numeric column pair in the rows."
      return `Rendered category breakdown "${title}" with ${built.points.length} categories.`
    },
    render: ({ args, status }) => {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- CopilotKit passes partial args at runtime
      if (status === "inProgress" || !args.rows)
        return <LoadingFallback label="Loading chart..." />
      const built = aggregateCategory(args.rows, args.catCol, args.metricCol)
      if (!built) return null
      return (
        <div>
          <ChartTitle title={args.title} />
          <ChartShell>
            <BarChart data={built.points}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
              <XAxis
                dataKey="name"
                tick={AXIS_TICK}
                interval={0}
                angle={-18}
                dy={10}
                height={52}
              />
              <YAxis tick={AXIS_TICK} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="value" fill={ACCENT} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartShell>
        </div>
      )
    },
  })
  return null
}

// ─── 4. Bivariate scatter ───

const ScatterSchema = z.object({
  title: z.string().describe("Title of the scatter chart"),
  rows: z
    .array(RowSchema)
    .describe(
      "Raw data rows with at least two numeric columns (max ~300 rows)"
    ),
  xCol: z
    .string()
    .optional()
    .describe("X-axis column; auto-detected if omitted"),
  yCol: z
    .string()
    .optional()
    .describe("Y-axis column; auto-detected if omitted"),
  labelCol: z.string().optional().describe("Label column for hover tooltips"),
})

export function ScatterChartTool() {
  useFrontendTool({
    name: "renderScatterChart",
    description:
      "Render a bivariate scatter plot showing the relationship between two numeric drivers (e.g. stockouts vs revenue). Use for correlation and driver analysis.",
    parameters: ScatterSchema,
    handler: async ({ title, rows, xCol, yCol, labelCol }) => {
      const built = scatterPoints(rows, xCol, yCol, labelCol)
      if (!built)
        return "Need 3+ rows with two numeric columns for a scatter plot."
      return `Rendered scatter plot "${title}" with ${built.points.length} points.`
    },
    render: ({ args, status }) => {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- CopilotKit passes partial args at runtime
      if (status === "inProgress" || !args.rows)
        return <LoadingFallback label="Loading chart..." />
      const built = scatterPoints(
        args.rows,
        args.xCol,
        args.yCol,
        args.labelCol
      )
      if (!built) return null
      return (
        <div>
          <ChartTitle title={args.title} />
          <ChartShell>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
              <XAxis dataKey="x" name={built.xCol} tick={AXIS_TICK} />
              <YAxis dataKey="y" name={built.yCol} tick={AXIS_TICK} />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                cursor={{ strokeDasharray: "3 3" }}
              />
              <Scatter data={built.points} fill={DANGER} />
            </ScatterChart>
          </ChartShell>
        </div>
      )
    },
  })
  return null
}

// ─── 5. Waterfall bridge ───

const WaterfallSchema = z.object({
  title: z.string().describe("Title of the waterfall chart"),
  priorRevenue: z.number().describe("Baseline revenue of the prior period"),
  currentRevenue: z.number().describe("Revenue of the current period"),
  stockoutLoss: z
    .number()
    .describe("Revenue lost to stockouts / disruptions (positive number)"),
})

export function WaterfallChartTool() {
  useFrontendTool({
    name: "renderWaterfallChart",
    description:
      "Render an executive revenue-bridge waterfall: prior baseline, stockout losses, demand shift, closing revenue. Use for variance walk explanations.",
    parameters: WaterfallSchema,
    handler: async ({ title }) => {
      return `Rendered waterfall "${title}".`
    },
    render: ({ args, status }) => {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- CopilotKit passes partial args at runtime
      if (status === "inProgress" || args.priorRevenue == null)
        return <LoadingFallback label="Loading chart..." />
      const segments = waterfallSegments(
        args.priorRevenue,
        args.currentRevenue,
        args.stockoutLoss
      )
      return (
        <div>
          <ChartTitle title={args.title} />
          <ChartShell>
            <BarChart data={segments}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
              <XAxis
                dataKey="name"
                tick={AXIS_TICK}
                interval={0}
                angle={-12}
                dy={8}
                height={48}
              />
              <YAxis tick={AXIS_TICK} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar
                dataKey="base"
                stackId="wf"
                fill="transparent"
                isAnimationActive={false}
              />
              <Bar dataKey="span" stackId="wf" radius={[4, 4, 0, 0]}>
                {segments.map((s, i) => (
                  <Cell
                    key={i}
                    fill={
                      s.kind === "total"
                        ? ACCENT
                        : s.kind === "up"
                          ? SUCCESS
                          : DANGER
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ChartShell>
        </div>
      )
    },
  })
  return null
}

// ─── 6. Scenario comparison ───

const ScenarioSchema = z.object({
  title: z.string().describe("Title of the scenario chart"),
  scenarios: z
    .array(
      z.object({
        name: z.string().describe("Scenario name"),
        values: z.array(z.number()).describe("Projected values per period"),
      })
    )
    .describe("Two or more policy scenarios to compare"),
  periods: z
    .array(z.string())
    .optional()
    .describe("Period labels; defaults to Period +1, +2, ..."),
})

const SCENARIO_COLORS = [GRID_STROKE, SUCCESS, WARNING, ACCENT, DANGER]

export function ScenarioChartTool() {
  useFrontendTool({
    name: "renderScenarioComparison",
    description:
      "Render grouped bars comparing policy simulation scenarios over a forecast horizon (e.g. baseline vs 21-day buffer). Use for what-if and counterfactual analysis.",
    parameters: ScenarioSchema,
    handler: async ({ title, scenarios }) => {
      if (scenarios.length === 0) return "Provide at least one scenario."
      return `Rendered scenario comparison "${title}" with ${scenarios.length} scenarios.`
    },
    render: ({ args, status }) => {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- CopilotKit passes partial args at runtime
      if (status === "inProgress" || !args.scenarios)
        return <LoadingFallback label="Loading chart..." />
      if (args.scenarios.length === 0) return null
      const horizon = Math.max(...args.scenarios.map((s) => s.values.length))
      const rows = Array.from({ length: horizon }, (_, i) => {
        const row: Record<string, string | number> = {
          period: args.periods?.[i] ?? `Period +${i + 1}`,
        }
        for (const s of args.scenarios) row[s.name] = s.values[i] ?? 0
        return row
      })
      const names = args.scenarios.map((s) => s.name)
      return (
        <div>
          <ChartTitle title={args.title} />
          <ChartShell>
            <BarChart data={rows}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
              <XAxis dataKey="period" tick={AXIS_TICK} />
              <YAxis tick={AXIS_TICK} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              {names.map((name, i) => (
                <Bar
                  key={name}
                  dataKey={name}
                  fill={SCENARIO_COLORS[i % SCENARIO_COLORS.length]}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ChartShell>
        </div>
      )
    },
  })
  return null
}

// ─── 7. Allocation schedule ───

const AllocationSchema = z.object({
  title: z.string().describe("Title of the allocation chart"),
  items: z
    .array(
      z.object({
        name: z.string().describe("Supplier / item / category name"),
        value: z.number().describe("Allocated order value or units"),
      })
    )
    .describe("Optimal allocation schedule entries"),
})

export function AllocationChartTool() {
  useFrontendTool({
    name: "renderAllocationChart",
    description:
      "Render the prescriptive optimizer's allocation schedule (supplier order values, reorder quantities). Use after inventory or distribution optimization.",
    parameters: AllocationSchema,
    handler: async ({ title, items }) => {
      if (items.length === 0) return "Allocation items are empty."
      return `Rendered allocation "${title}" with ${items.length} entries.`
    },
    render: ({ args, status }) => {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- CopilotKit passes partial args at runtime
      if (status === "inProgress" || !args.items)
        return <LoadingFallback label="Loading chart..." />
      if (args.items.length === 0) return null
      return (
        <div>
          <ChartTitle title={args.title} />
          <ChartShell>
            <BarChart data={args.items}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
              <XAxis
                dataKey="name"
                tick={AXIS_TICK}
                interval={0}
                angle={-18}
                dy={10}
                height={52}
              />
              <YAxis tick={AXIS_TICK} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="value" fill={SUCCESS} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartShell>
        </div>
      )
    },
  })
  return null
}

// ─── 8. Simulation curve ───

const SimulationSchema = z.object({
  title: z.string().describe("Title of the simulation chart"),
  grossRecovery: z
    .number()
    .describe("Gross revenue recovery under the optimal policy ($)"),
  holdingIncrease: z
    .number()
    .describe("Associated holding/program cost increase ($)"),
})

export function SimulationChartTool() {
  useFrontendTool({
    name: "renderSimulationCurve",
    description:
      "Render the Pareto policy simulation: gross recovery vs holding cost vs net benefit across buffer policies (7/14/21/28/35-day). Use to justify the optimal buffer.",
    parameters: SimulationSchema,
    handler: async ({ title }) => {
      return `Rendered simulation curve "${title}".`
    },
    render: ({ args, status }) => {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- CopilotKit passes partial args at runtime
      if (status === "inProgress" || args.grossRecovery == null)
        return <LoadingFallback label="Loading chart..." />
      const curve = simulationCurve(args.grossRecovery, args.holdingIncrease)
      const rows = curve.buffers.map((b, i) => ({
        buffer: b,
        gross: curve.gross[i],
        holding: curve.holding[i],
        net: curve.net[i],
      }))
      return (
        <div>
          <ChartTitle title={args.title} />
          <ChartShell>
            <ComposedChart data={rows}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
              <XAxis
                dataKey="buffer"
                tick={AXIS_TICK}
                interval={0}
                angle={-14}
                dy={8}
                height={52}
              />
              <YAxis tick={AXIS_TICK} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar
                dataKey="gross"
                name="Gross Recovery ($)"
                fill={SUCCESS}
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="holding"
                name="Holding Cost ($)"
                fill={DANGER}
                radius={[4, 4, 0, 0]}
              />
              <Line
                type="monotone"
                dataKey="net"
                name="Net Benefit ($)"
                stroke={ACCENT}
                strokeWidth={3}
                dot={{ fill: ACCENT }}
              />
            </ComposedChart>
          </ChartShell>
        </div>
      )
    },
  })
  return null
}

// ─── 9. Risk matrix ───

const RiskMatrixSchema = z.object({
  title: z.string().describe("Title of the risk matrix chart"),
  items: z
    .array(
      z.object({
        name: z.string().describe("Product / SKU / segment name"),
        realized: z.number().describe("Realized revenue ($)"),
        lost: z.number().describe("Lost revenue from stockouts ($)"),
      })
    )
    .describe("Top affected entities (max ~8)"),
})

export function RiskMatrixChartTool() {
  useFrontendTool({
    name: "renderRiskMatrix",
    description:
      "Render realized vs lost revenue for the hardest-hit products, cohorts or segments. Use for stockout impact and risk concentration.",
    parameters: RiskMatrixSchema,
    handler: async ({ title, items }) => {
      if (items.length === 0) return "Risk items are empty."
      return `Rendered risk matrix "${title}" with ${items.length} entries.`
    },
    render: ({ args, status }) => {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- CopilotKit passes partial args at runtime
      if (status === "inProgress" || !args.items)
        return <LoadingFallback label="Loading chart..." />
      if (args.items.length === 0) return null
      const rows = args.items.slice(0, 8)
      return (
        <div>
          <ChartTitle title={args.title} />
          <ChartShell>
            <BarChart data={rows}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
              <XAxis
                dataKey="name"
                tick={AXIS_TICK}
                interval={0}
                angle={-18}
                dy={10}
                height={52}
              />
              <YAxis tick={AXIS_TICK} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar
                dataKey="realized"
                name="Realized ($)"
                fill={GRID_STROKE}
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="lost"
                name="Lost ($)"
                fill={DANGER}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartShell>
        </div>
      )
    },
  })
  return null
}

// ─── 10. Feature importance ───

const FeatureImportanceSchema = z.object({
  title: z.string().describe("Title of the importance chart"),
  features: z
    .array(
      z.object({
        feature: z.string().describe("Feature / driver name"),
        importance: z.number().describe("Relative importance score"),
      })
    )
    .describe("Top model drivers (max ~8)"),
})

export function FeatureImportanceChartTool() {
  useFrontendTool({
    name: "renderFeatureImportance",
    description:
      "Render horizontal bars of model feature importance / SHAP drivers (e.g. churn risk factors). Use after classification or driver analysis.",
    parameters: FeatureImportanceSchema,
    handler: async ({ title, features }) => {
      if (features.length === 0) return "Features are empty."
      return `Rendered feature importance "${title}" with ${features.length} features.`
    },
    render: ({ args, status }) => {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- CopilotKit passes partial args at runtime
      if (status === "inProgress" || !args.features)
        return <LoadingFallback label="Loading chart..." />
      if (args.features.length === 0) return null
      const rows = [...args.features]
        .sort((a, b) => b.importance - a.importance)
        .slice(0, 8)
      return (
        <div>
          <ChartTitle title={args.title} />
          <ChartShell>
            <BarChart data={rows} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
              <XAxis type="number" tick={AXIS_TICK} />
              <YAxis
                type="category"
                dataKey="feature"
                tick={AXIS_TICK}
                width={110}
              />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="importance" fill={ACCENT} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ChartShell>
        </div>
      )
    },
  })
  return null
}

// ─── 11. Network graph ───

const NetworkSchema = z.object({
  title: z.string().describe("Title of the network graph"),
  rows: z
    .array(RowSchema)
    .describe("Rows with two entity columns forming edges (max ~300 rows)"),
  entityACol: z
    .string()
    .optional()
    .describe("First entity column; auto-detected if omitted"),
  entityBCol: z
    .string()
    .optional()
    .describe("Second entity column; auto-detected if omitted"),
  weightCol: z
    .string()
    .optional()
    .describe("Edge weight column; defaults to amount or 1"),
})

const COMMUNITY_COLORS = [
  ACCENT,
  SUCCESS,
  WARNING,
  DANGER,
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
]

export function NetworkGraphTool() {
  useFrontendTool({
    name: "renderNetworkGraph",
    description:
      "Render an entity relationship network with community detection and centrality sizing (e.g. supplier-product, customer-merchant links). Nodes are colored by community and sized by centrality.",
    parameters: NetworkSchema,
    handler: async ({ rows, entityACol, entityBCol, weightCol }) => {
      const built = buildNetwork(rows, entityACol, entityBCol, weightCol)
      if (!built)
        return "Need 3+ rows with two entity columns to build a network."
      return `Graphed ${built.nodes.length} nodes, ${built.edges.length} edges, ${built.communityCount} communities (density ${built.density}).`
    },
    render: ({ args, status }) => {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- CopilotKit passes partial args at runtime
      if (status === "inProgress" || !args.rows)
        return <LoadingFallback label="Loading graph..." />
      const built = buildNetwork(
        args.rows,
        args.entityACol,
        args.entityBCol,
        args.weightCol
      )
      if (!built) return null
      const maxWeight = Math.max(1, ...built.edges.map((e) => e.weight))
      const nodeById = new Map(built.nodes.map((n) => [n.id, n]))
      return (
        <div>
          <ChartTitle title={args.title} />
          <div className="flex items-center justify-center p-4">
            <svg viewBox="0 0 600 380" className="h-[300px] w-full">
              {built.edges.map((e, i) => {
                const a = nodeById.get(e.source)
                const b = nodeById.get(e.target)
                if (!a || !b) return null
                return (
                  <line
                    key={i}
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke="hsl(var(--border))"
                    strokeOpacity={0.25 + 0.55 * (e.weight / maxWeight)}
                    strokeWidth={1 + 2 * (e.weight / maxWeight)}
                  />
                )
              })}
              {built.nodes.map((n) => (
                <g key={n.id}>
                  <circle
                    cx={n.x}
                    cy={n.y}
                    r={5 + 9 * n.centrality}
                    fill={
                      COMMUNITY_COLORS[n.community % COMMUNITY_COLORS.length]
                    }
                    fillOpacity={0.85}
                    stroke="hsl(var(--background))"
                    strokeWidth={1.5}
                  >
                    <title>{`${n.id} — centrality ${n.centrality}, community ${n.community + 1}`}</title>
                  </circle>
                  <text
                    x={n.x}
                    y={n.y - 9 - 9 * n.centrality}
                    textAnchor="middle"
                    fontSize={9}
                    fill="hsl(var(--muted-foreground))"
                  >
                    {n.id.length > 14 ? `${n.id.slice(0, 13)}…` : n.id}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>
      )
    },
  })
  return null
}

// ─── Mount all DataForge chart tools ───

export function DataForgeChartTools() {
  return (
    <>
      <TimeSeriesChartTool />
      <ForecastChartTool />
      <CategoryChartTool />
      <ScatterChartTool />
      <WaterfallChartTool />
      <ScenarioChartTool />
      <AllocationChartTool />
      <SimulationChartTool />
      <RiskMatrixChartTool />
      <FeatureImportanceChartTool />
      <NetworkGraphTool />
    </>
  )
}
