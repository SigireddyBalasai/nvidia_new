// Pure data-transformation helpers ported from DataForge:
//   - src/agents/insights_agent.py  (_build_* chart aggregations)
//   - src/tools/dispatcher.py       (column-guessing heuristics)
//   - src/tools/relationship_graph.py (communities + centrality)
//
// No dependencies; safe to run in the browser.

export type DataValue = string | number | boolean | null | undefined;
export type DataRow = Record<string, DataValue>;

export function toNumber(v: DataValue): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v.replace(/[$,%\s]/g, ""));
    return Number.isFinite(n) && v.trim() !== "" ? n : null;
  }
  return null;
}

function columnsOf(rows: DataRow[]): string[] {
  const seen = new Set<string>();
  for (const r of rows) for (const k of Object.keys(r)) seen.add(k);
  return [...seen];
}

// ─── Column guessing (ported from dispatcher heuristics) ───

const NUMERIC_PRIORITY = [
  "revenue",
  "total_revenue",
  "demand_qty",
  "balance",
  "sales",
  "units",
  "cost",
  "amount",
];

export function guessNumericCol(rows: DataRow[], cols?: string[]): string | null {
  const c = cols ?? columnsOf(rows);
  if (rows.length === 0 || c.length === 0) return null;
  const first = rows[0];
  for (const p of NUMERIC_PRIORITY) {
    if (c.includes(p) && toNumber(first[p]) !== null) return p;
  }
  for (const col of c) {
    if (toNumber(first[col]) !== null) return col;
  }
  return null;
}

const TIME_HINTS = ["date", "time", "period", "month", "year", "quarter"];

export function guessTimeCol(rows: DataRow[], cols?: string[]): string | null {
  const c = cols ?? columnsOf(rows);
  if (c.length === 0) return null;
  void rows;
  for (const col of c) {
    const low = col.toLowerCase();
    if (TIME_HINTS.some((h) => low.includes(h))) return col;
  }
  return null;
}

export function guessCategoricalCol(rows: DataRow[], cols?: string[]): string | null {
  const c = cols ?? columnsOf(rows);
  if (rows.length === 0 || c.length === 0) return null;
  const first = rows[0];
  for (const col of c) {
    if (typeof first[col] === "string") return col;
  }
  return null;
}

// ─── Time series (ported from _build_time_series_chart) ───

export interface SeriesPoint {
  name: string;
  value: number;
}

export function aggregateTimeSeries(
  rows: DataRow[],
  dateCol?: string,
  metricCol?: string,
  limit = 36,
): { points: SeriesPoint[]; dateCol: string; metricCol: string } | null {
  if (rows.length === 0) return null;
  const cols = columnsOf(rows);
  const d = dateCol ?? guessTimeCol(rows, cols) ?? cols[0];
  const m = metricCol ?? guessNumericCol(rows, cols);
  if (!m) return null;
  const agg = new Map<string, number>();
  for (const r of rows) {
    const key = String(r[d] ?? "");
    const v = toNumber(r[m]);
    if (key && v !== null) agg.set(key, (agg.get(key) ?? 0) + v);
  }
  if (agg.size < 2) return null;
  const keys = [...agg.keys()].sort().slice(0, limit);
  return {
    points: keys.map((k) => ({ name: k, value: Math.round(agg.get(k)!) * 1 })),
    dateCol: d,
    metricCol: m,
  };
}

// ─── Category breakdown (ported from _build_category_breakdown_chart) ───

export function aggregateCategory(
  rows: DataRow[],
  catCol?: string,
  metricCol?: string,
  limit = 8,
): { points: SeriesPoint[]; catCol: string; metricCol: string } | null {
  if (rows.length === 0) return null;
  const cols = columnsOf(rows);
  const first = rows[0];
  const c =
    catCol ??
    cols.find(
      (col) =>
        !["id", "date", "customer_id", "txn_id", "ndc_code"].includes(col.toLowerCase()) &&
        typeof first[col] === "string",
    );
  const m = metricCol ?? guessNumericCol(rows, cols);
  if (!c || !m) return null;
  const agg = new Map<string, number>();
  for (const r of rows) {
    const key = String(r[c] ?? "Other");
    const v = toNumber(r[m]);
    if (v !== null) agg.set(key, (agg.get(key) ?? 0) + v);
  }
  if (agg.size === 0) return null;
  const points = [...agg.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }));
  return { points, catCol: c, metricCol: m };
}

// ─── Bivariate scatter (ported from _build_scatter_chart) ───

export interface ScatterPoint {
  x: number;
  y: number;
  label: string;
}

const SCATTER_X_HINTS = ["stockout_days", "delivery_days", "units", "tenure_months", "age"];
const SCATTER_Y_HINTS = ["revenue", "margin", "cost", "balance", "demand_qty"];

export function scatterPoints(
  rows: DataRow[],
  xCol?: string,
  yCol?: string,
  labelCol?: string,
  limit = 120,
): { points: ScatterPoint[]; xCol: string; yCol: string } | null {
  if (rows.length < 3) return null;
  const cols = columnsOf(rows);
  const first = rows[0];
  const numCols = cols.filter((c) => toNumber(first[c]) !== null);
  if (numCols.length < 2) return null;
  const x = xCol ?? SCATTER_X_HINTS.find((h) => numCols.includes(h)) ?? numCols[0];
  const y =
    yCol ??
    SCATTER_Y_HINTS.find((h) => h !== x && numCols.includes(h)) ??
    numCols.find((c) => c !== x)!;
  const label =
    labelCol ??
    cols.find((c) =>
      ["product", "drug", "category", "merchant", "region", "segment"].includes(c.toLowerCase()),
    ) ??
    null;
  const points: ScatterPoint[] = [];
  for (const r of rows.slice(0, limit)) {
    const xv = toNumber(r[x]);
    const yv = toNumber(r[y]);
    if (xv === null || yv === null) continue;
    points.push({ x: xv, y: yv, label: label ? String(r[label] ?? "") : "" });
  }
  if (points.length < 3) return null;
  return { points, xCol: x, yCol: y };
}

// ─── Waterfall bridge (ported from _build_waterfall_chart) ───

export interface WaterfallSegment {
  name: string;
  base: number;
  span: number;
  kind: "total" | "down" | "up";
}

export function waterfallSegments(
  priorRev: number,
  currentRev: number,
  stockoutLoss: number,
): WaterfallSegment[] {
  const variance = currentRev - priorRev;
  const demandShift = Math.round((variance + Math.abs(stockoutLoss)) * 100) / 100;
  return [
    { name: "Prior Baseline", base: 0, span: priorRev, kind: "total" },
    { name: "Stockout Losses", base: currentRev - demandShift, span: -Math.abs(stockoutLoss), kind: "down" },
    {
      name: "Demand Shift",
      base: demandShift < 0 ? currentRev : currentRev - demandShift,
      span: demandShift,
      kind: demandShift < 0 ? "down" : "up",
    },
    { name: "Closing Revenue", base: 0, span: currentRev, kind: "total" },
  ];
}

// ─── Policy simulation curve (ported from _build_simulation_curve_chart) ───

export interface SimulationCurve {
  buffers: string[];
  gross: number[];
  holding: number[];
  net: number[];
}

export function simulationCurve(grossRecovery: number, holdingIncrease: number): SimulationCurve {
  const buffers = ["7-Day (Lean)", "14-Day (Baseline)", "21-Day (Optimal)", "28-Day (Buffer)", "35-Day (High)"];
  const gross = [0.35, 0, 1, 1.18, 1.26].map((f) => Math.round(grossRecovery * f * 100) / 100);
  const holding = [0.25, 0, 1, 2.35, 3.85].map((f) => Math.round(holdingIncrease * f * 100) / 100);
  return { buffers, gross, holding, net: gross.map((g, i) => Math.round((g - holding[i]) * 100) / 100) };
}

// ─── Relationship graph (ported from tools/relationship_graph.py) ───

export interface GraphEdge {
  source: string;
  target: string;
  weight: number;
}

export interface GraphNode {
  id: string;
  degree: number;
  centrality: number;
  community: number;
  x: number;
  y: number;
}

export interface NetworkResult {
  nodes: GraphNode[];
  edges: GraphEdge[];
  communityCount: number;
  density: number;
}

export function buildNetwork(
  rows: DataRow[],
  entityACol?: string,
  entityBCol?: string,
  weightCol?: string,
  maxNodes = 40,
): NetworkResult | null {
  if (rows.length < 3) return null;
  const cols = columnsOf(rows);
  const strCols = cols.filter((c) => typeof rows[0][c] === "string");
  const a = entityACol ?? strCols[0];
  const b = entityBCol ?? strCols[1];
  if (!a || !b) return null;

  const edgeMap = new Map<string, number>();
  const nodeSet = new Set<string>();
  for (const r of rows) {
    const av = String(r[a] ?? "");
    const bv = String(r[b] ?? "");
    if (!av || !bv || av === bv) continue;
    const key = av < bv ? `${av}|||${bv}` : `${bv}|||${av}`;
    let w = 1;
    const raw = weightCol ? r[weightCol] : r["amount"];
    const parsed = toNumber(raw);
    if (parsed !== null) w = parsed;
    edgeMap.set(key, (edgeMap.get(key) ?? 0) + w);
    nodeSet.add(av);
    nodeSet.add(bv);
  }
  if (nodeSet.size === 0) return null;

  // Degree centrality
  const degree = new Map<string, number>();
  for (const id of nodeSet) degree.set(id, 0);
  for (const key of edgeMap.keys()) {
    const [x, y] = key.split("|||");
    degree.set(x, (degree.get(x) ?? 0) + 1);
    degree.set(y, (degree.get(y) ?? 0) + 1);
  }
  const n = nodeSet.size;

  // Connected components via union-find (community proxy, mirrors Python)
  const parent = new Map<string, string>();
  for (const id of nodeSet) parent.set(id, id);
  const find = (x: string): string => {
    let root = x;
    while (parent.get(root) !== root) root = parent.get(root)!;
    let cur = x;
    while (parent.get(cur) !== root) {
      const next = parent.get(cur)!;
      parent.set(cur, root);
      cur = next;
    }
    return root;
  };
  for (const key of edgeMap.keys()) {
    const [x, y] = key.split("|||");
    const rx = find(x);
    const ry = find(y);
    if (rx !== ry) parent.set(rx, ry);
  }
  const communities = new Map<string, string[]>();
  for (const id of nodeSet) {
    const root = find(id);
    const list = communities.get(root) ?? [];
    list.push(id);
    communities.set(root, list);
  }
  const ordered = [...communities.values()].sort((p, q) => q.length - p.length);
  const communityOf = new Map<string, number>();
  ordered.forEach((members, i) => members.forEach((m) => communityOf.set(m, i)));

  // Keep the most central nodes when capping
  const ranked = [...nodeSet].sort(
    (p, q) => (degree.get(q) ?? 0) - (degree.get(p) ?? 0),
  );
  const kept = new Set(ranked.slice(0, maxNodes));

  const edges: GraphEdge[] = [];
  for (const [key, weight] of edgeMap) {
    const [x, y] = key.split("|||");
    if (kept.has(x) && kept.has(y)) edges.push({ source: x, target: y, weight });
  }

  // Radial layout: one ring per community
  const nodes: GraphNode[] = [];
  const width = 600;
  const height = 380;
  const cx = width / 2;
  const cy = height / 2;
  const ringGap = Math.min(width, height) / 2 / Math.max(ordered.length, 1);
  ordered.forEach((members, ci) => {
    const visible = members.filter((m) => kept.has(m));
    visible.forEach((id, i) => {
      const angle = visible.length <= 1 ? 0 : (2 * Math.PI * i) / visible.length;
      const radius = ci === 0 && visible.length === 1 ? 0 : ringGap * (ci + 1) * 0.85;
      nodes.push({
        id,
        degree: degree.get(id) ?? 0,
        centrality: Math.round(((degree.get(id) ?? 0) / Math.max(n - 1, 1)) * 10000) / 10000,
        community: ci,
        x: Math.round((cx + radius * Math.cos(angle)) * 10) / 10,
        y: Math.round((cy + radius * Math.sin(angle)) * 10) / 10,
      });
    });
  });

  const e = edges.length;
  return {
    nodes,
    edges,
    communityCount: ordered.length,
    density: Math.round(((2 * e) / Math.max(n * (n - 1), 1)) * 10000) / 10000,
  };
}
