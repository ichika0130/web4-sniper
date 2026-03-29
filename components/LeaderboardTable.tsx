"use client";

import { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import type { Project, Verdict, GithubStatus } from "@/lib/api";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreColor(score: number): string {
  if (score > 75) return "var(--danger)";
  if (score >= 40) return "var(--warning)";
  return "var(--primary)";
}

function formatFunding(usd: number | null | undefined): string {
  if (usd == null || usd === 0) return "—";
  if (usd >= 1_000_000_000) return `$${(usd / 1_000_000_000).toFixed(1)}B`;
  if (usd >= 1_000_000) return `$${(usd / 1_000_000).toFixed(1)}M`;
  if (usd >= 1_000) return `$${(usd / 1_000).toFixed(0)}K`;
  return `$${usd}`;
}

const ghBadgeClass: Record<GithubStatus, string> = {
  ACTIVE:  "gh-badge gh-badge-active",
  STALE:   "gh-badge gh-badge-stale",
  DEAD:    "gh-badge gh-badge-dead",
  UNKNOWN: "gh-badge gh-badge-dead",
};

const verdictBadgeClass: Record<Verdict, string> = {
  VAPORWARE:  "verdict-badge verdict-vaporware",
  SUSPICIOUS: "verdict-badge verdict-suspicious",
  LEGITIMATE: "verdict-badge verdict-legitimate",
  UNKNOWN:    "verdict-badge verdict-unknown",
};

// ─── Types ────────────────────────────────────────────────────────────────────

type VerdictFilter   = "ALL" | Verdict;
type GithubFilter    = "ALL" | GithubStatus;

interface Props {
  projects:            Project[];
  articleProjectSlugs: string[];
}

// ─── Column definitions (no RANK — rendered manually) ────────────────────────

const columnHelper = createColumnHelper<Project>();

function buildColumns(articleSlugSet: Set<string>) {
  return [
    columnHelper.accessor("name", {
      id:     "name",
      header: "PROJECT",
      cell: ({ row }) => (
        <div style={{ minWidth: "120px" }}>
          <div
            style={{
              fontFamily: "var(--font-geist-mono)",
              color:      "var(--text-primary)",
              fontWeight: 600,
              fontSize:   "0.78rem",
              whiteSpace: "nowrap",
            }}
          >
            {row.original.name}
          </div>
          <div
            style={{
              fontFamily: "var(--font-geist-mono)",
              color:      "var(--text-muted)",
              fontSize:   "0.62rem",
            }}
          >
            {row.original.slug}
          </div>
        </div>
      ),
    }),

    columnHelper.accessor((row) => row.claimed_stack[0] ?? null, {
      id:     "sector",
      header: "SECTOR",
      cell:   ({ getValue }) => {
        const val = getValue() as string | null;
        return (
          <span
            style={{
              fontFamily:   "var(--font-geist-mono)",
              color:        "var(--text-muted)",
              fontSize:     "0.7rem",
              maxWidth:     "90px",
              overflow:     "hidden",
              textOverflow: "ellipsis",
              whiteSpace:   "nowrap",
              display:      "block",
            }}
          >
            {val ?? "—"}
          </span>
        );
      },
    }),

    columnHelper.accessor("github_status", {
      id:     "github_status",
      header: "GITHUB",
      cell:   ({ getValue }) => {
        const status = getValue() as GithubStatus;
        return <span className={ghBadgeClass[status]}>{status}</span>;
      },
    }),

    columnHelper.accessor("funding_usd", {
      id:     "funding_usd",
      header: "FUNDING",
      cell:   ({ getValue }) => (
        <span
          style={{
            fontFamily: "var(--font-geist-mono)",
            color:      "var(--text-primary)",
            fontSize:   "0.72rem",
          }}
        >
          {formatFunding(getValue() as number | null | undefined)}
        </span>
      ),
    }),

    columnHelper.accessor("vaporware_score", {
      id:     "vaporware_score",
      header: "VAPORWARE SCORE",
      cell:   ({ getValue }) => {
        const score = getValue() as number;
        const color = scoreColor(score);
        return (
          <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: "110px" }}>
            <div className="inline-bar-track" style={{ flexShrink: 0 }}>
              <div className="inline-bar-fill" style={{ width: `${score}%`, background: color }} />
            </div>
            <span
              style={{
                fontFamily: "var(--font-geist-mono)",
                color,
                fontSize:   "0.72rem",
                fontWeight: 700,
                minWidth:   "38px",
              }}
            >
              {score}%
            </span>
          </div>
        );
      },
    }),

    columnHelper.accessor("verdict", {
      id:     "verdict",
      header: "VERDICT",
      cell:   ({ getValue }) => {
        const v = getValue() as Verdict;
        return <span className={verdictBadgeClass[v]}>{v}</span>;
      },
    }),

    columnHelper.display({
      id:     "action",
      header: "ACTION",
      cell:   ({ row }) => {
        if (!articleSlugSet.has(row.original.slug)) return null;
        return (
          <a
            href={`/crosshairs/${row.original.slug}`}
            className="read-link"
            onClick={(e) => e.stopPropagation()}
            style={{ fontSize: "0.65rem" }}
          >
            READ →
          </a>
        );
      },
      enableSorting: false,
    }),
  ];
}

// ─── Select / Input shared styles ─────────────────────────────────────────────

const controlStyle: React.CSSProperties = {
  background:  "var(--surface)",
  border:      "1px solid var(--border)",
  color:       "var(--text-muted)",
  fontFamily:  "var(--font-geist-mono)",
  fontSize:    "0.7rem",
  letterSpacing: "0.08em",
  padding:     "0.4rem 0.6rem",
  outline:     "none",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function LeaderboardTable({ projects, articleProjectSlugs }: Props) {
  const router = useRouter();

  const articleSlugSet = useMemo(
    () => new Set(articleProjectSlugs),
    [articleProjectSlugs],
  );

  const [search,        setSearch]        = useState("");
  const [verdictFilter, setVerdictFilter] = useState<VerdictFilter>("ALL");
  const [githubFilter,  setGithubFilter]  = useState<GithubFilter>("ALL");
  const [sorting,       setSorting]       = useState<SortingState>([
    { id: "vaporware_score", desc: true },
  ]);

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (verdictFilter !== "ALL" && p.verdict !== verdictFilter)          return false;
      if (githubFilter  !== "ALL" && p.github_status !== githubFilter)     return false;
      return true;
    });
  }, [projects, search, verdictFilter, githubFilter]);

  const columns = useMemo(() => buildColumns(articleSlugSet), [articleSlugSet]);

  const table = useReactTable({
    data:             filtered,
    columns,
    state:            { sorting },
    onSortingChange:  setSorting,
    getCoreRowModel:  getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const rows = table.getRowModel().rows;

  return (
    <section className="w-full px-4 md:px-6 py-6">
      {/* ── Filter bar ── */}
      <div
        style={{
          display:      "flex",
          gap:          "8px",
          flexWrap:     "wrap",
          marginBottom: "12px",
          alignItems:   "center",
        }}
      >
        <input
          type="text"
          placeholder="SEARCH PROJECTS..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            ...controlStyle,
            color:       "var(--text-primary)",
            minWidth:    "180px",
            flex:        "1 1 180px",
          }}
        />

        <select
          value={verdictFilter}
          onChange={(e) => setVerdictFilter(e.target.value as VerdictFilter)}
          style={controlStyle}
        >
          <option value="ALL">ALL VERDICTS</option>
          <option value="VAPORWARE">VAPORWARE</option>
          <option value="SUSPICIOUS">SUSPICIOUS</option>
          <option value="LEGITIMATE">LEGITIMATE</option>
        </select>

        <select
          value={githubFilter}
          onChange={(e) => setGithubFilter(e.target.value as GithubFilter)}
          style={controlStyle}
        >
          <option value="ALL">ALL STATUSES</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="STALE">STALE</option>
          <option value="DEAD">DEAD</option>
        </select>

        <span
          style={{
            fontFamily:  "var(--font-geist-mono)",
            fontSize:    "0.65rem",
            color:       "var(--text-muted)",
            marginLeft:  "4px",
          }}
        >
          {rows.length} / {projects.length}
        </span>
      </div>

      {/* ── Table ── */}
      <div style={{ overflowX: "auto", border: "1px solid var(--border)" }}>
        <table className="radar-table" style={{ minWidth: "820px" }}>
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} style={{ background: "var(--surface)" }}>
                {/* Static RANK column */}
                <th style={{ width: "48px" }}>RANK</th>

                {hg.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sorted  = header.column.getIsSorted();
                  return (
                    <th
                      key={header.id}
                      onClick={header.column.getToggleSortingHandler()}
                      style={{
                        cursor:     canSort ? "pointer" : "default",
                        userSelect: "none",
                        color:      sorted ? "var(--primary)" : undefined,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {sorted === "asc"  && " ↑"}
                      {sorted === "desc" && " ↓"}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  style={{
                    textAlign:  "center",
                    padding:    "2rem",
                    fontFamily: "var(--font-geist-mono)",
                    fontSize:   "0.72rem",
                    color:      "var(--text-muted)",
                  }}
                >
                  NO RESULTS MATCH FILTERS.
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr
                  key={row.id}
                  className="radar-row"
                  onClick={() => router.push(`/crosshairs/${row.original.slug}`)}
                  style={{ cursor: "pointer" }}
                >
                  {/* RANK cell */}
                  <td>
                    <span
                      style={{
                        fontFamily: "var(--font-geist-mono)",
                        color:      "var(--text-muted)",
                        fontSize:   "0.72rem",
                      }}
                    >
                      {i + 1}
                    </span>
                  </td>

                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
