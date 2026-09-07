import * as React from "react"
import { Pie, PieChart as RePieChart, Cell } from "recharts"
import type { ChartConfig } from "@/components/ui/chart"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
  "var(--chart-7)",
  "var(--chart-8)",
]

export interface PieChartDataItem {
  name: string
  value: number
}

export interface PieChartComponentProps {
  data: PieChartDataItem[]
  title?: string
  className?: string
  showLegend?: boolean
  showTooltip?: boolean
  innerRadius?: number
  outerRadius?: number
}

export function PieChartComponent({
  data,
  title,
  className,
  showLegend = true,
  showTooltip = true,
  innerRadius = 0,
  outerRadius = 80,
}: PieChartComponentProps) {
  const total = React.useMemo(
    () => data.reduce((sum, item) => sum + item.value, 0),
    [data]
  )

  const chartData = React.useMemo(
    () =>
      data.map((item) => ({
        ...item,
        percentage: total > 0 ? ((item.value / total) * 100).toFixed(1) : "0",
        fill: `var(--color-${item.name})`,
      })),
    [data, total]
  )

  const chartConfig = React.useMemo<ChartConfig>(() => {
    const config: ChartConfig = {}
    data.forEach((item, index) => {
      config[item.name] = {
        label: item.name,
        color: CHART_COLORS[index % CHART_COLORS.length],
      }
    })
    return config
  }, [data])

  return (
    <div className="flex flex-col gap-2">
      {title && (
        <div className="text-sm font-medium text-muted-foreground">{title}</div>
      )}
      <ChartContainer config={chartConfig} className={className}>
        <RePieChart>
          {showTooltip && (
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) => {
                    const num = Number(value)
                    const pct = total > 0 ? ((num / total) * 100).toFixed(1) : "0"
                    return (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{name}</span>
                        <span className="font-mono font-medium">
                          {num.toLocaleString()} ({pct}%)
                        </span>
                      </div>
                    )
                  }}
                />
              }
            />
          )}
          {showLegend && (
            <ChartLegend
              content={
                <ChartLegendContent
                  formatter={(value) => {
                    const item = data.find((d) => d.name === value)
                    if (!item) return value
                    const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : "0"
                    return `${item.name} — ${item.value.toLocaleString()} (${pct}%)`
                  }}
                />
              }
            />
          )}
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            strokeWidth={1}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={`var(--color-${entry.name})`}
                stroke="hsl(var(--background))"
                strokeWidth={2}
              />
            ))}
          </Pie>
        </RePieChart>
      </ChartContainer>
    </div>
  )
}
