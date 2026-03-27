"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

// ─── Shared types ─────────────────────────────────────────────────────────────

interface TooltipEntry {
  name:  string;
  value: number;
  color: string;
}

interface CustomTooltipProps {
  active?:  boolean;
  payload?: TooltipEntry[];
  label?:   string;
}

export interface FundingDataPoint {
  name:    string;
  funding: number;
  code:    number;
}

export interface ScoreDataPoint {
  name:  string;
  score: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreColor(score: number): string {
  if (score > 75) return "#FF3B3B";
  if (score >= 40) return "#FFB800";
  return "#39FF14";
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

const TOOLTIP_STYLE: React.CSSProperties = {
  backgroundColor: "#0F1217",
  border:          "1px solid #1C2128",
  borderRadius:    "6px",
  padding:         "10px 14px",
  fontFamily:      "var(--font-geist-mono)",
  fontSize:        "0.72rem",
  color:           "#E8EDF2",
  boxShadow:       "0 4px 20px rgba(0,0,0,0.6)",
};

function FundingTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div style={TOOLTIP_STYLE}>
      <p style={{ color: "#4A5568", marginBottom: 6, letterSpacing: "0.1em" }}>
        {label}
      </p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color, margin: "2px 0" }}>
          {entry.name === "funding" ? "Funding" : "Code"}:{" "}
          <strong>
            {entry.name === "funding"
              ? `$${entry.value}M`
              : `${entry.value}kLoC`}
          </strong>
        </p>
      ))}
    </div>
  );
}

function ScoreTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const score = payload[0].value as number;
  return (
    <div style={TOOLTIP_STYLE}>
      <p style={{ color: "#4A5568", marginBottom: 6, letterSpacing: "0.1em" }}>
        {label}
      </p>
      <p style={{ color: scoreColor(score), margin: 0 }}>
        Vaporware: <strong>{score}%</strong>
      </p>
    </div>
  );
}

// ─── Chart style constants ────────────────────────────────────────────────────

const AXIS_STYLE = {
  fontFamily: "var(--font-geist-mono)",
  fontSize:   11,
  fill:       "#4A5568",
};

const GRID_STYLE = {
  stroke:          "#1C2128",
  strokeDasharray: "3 3",
};

// ─── Chart Components ─────────────────────────────────────────────────────────

export function FundingVsCodeChart({ data }: { data: FundingDataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={data}
        margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
        barGap={3}
        barCategoryGap="28%"
      >
        <CartesianGrid {...GRID_STYLE} vertical={false} />
        <XAxis dataKey="name" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
        <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} width={36} />
        <Tooltip content={<FundingTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
        <Legend
          wrapperStyle={{ fontFamily: "var(--font-geist-mono)", fontSize: 11, color: "#4A5568" }}
          formatter={(value) => (value === "funding" ? "Funding ($M)" : "Code (kLoC)")}
        />
        <Bar dataKey="funding" name="funding" fill="#39FF14" radius={[2, 2, 0, 0]}>
          {data.map((entry) => (
            <Cell
              key={entry.name}
              fill="#39FF14"
              style={{ filter: "drop-shadow(0 0 4px rgba(57,255,20,0.5))" }}
            />
          ))}
        </Bar>
        <Bar dataKey="code" name="code" fill="#FF3B3B" radius={[2, 2, 0, 0]}>
          {data.map((entry) => (
            <Cell
              key={entry.name}
              fill="#FF3B3B"
              style={{ filter: "drop-shadow(0 0 4px rgba(255,59,59,0.4))" }}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function VaporwareScoreChart({ data }: { data: ScoreDataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(200, data.length * 40)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 5, right: 40, left: 10, bottom: 5 }}
        barCategoryGap="30%"
      >
        <CartesianGrid {...GRID_STYLE} horizontal={false} />
        <XAxis
          type="number"
          domain={[0, 100]}
          tick={AXIS_STYLE}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${v}%`}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={AXIS_STYLE}
          axisLine={false}
          tickLine={false}
          width={90}
        />
        <Tooltip content={<ScoreTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
        <Bar dataKey="score" radius={[0, 2, 2, 0]}>
          {data.map((entry) => (
            <Cell key={entry.name} fill={scoreColor(entry.score)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
