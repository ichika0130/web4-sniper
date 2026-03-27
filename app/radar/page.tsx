import { getStats, getProjects } from "@/lib/api";
import type { GithubStatus, Verdict } from "@/lib/api";
import {
  FundingVsCodeChart,
  VaporwareScoreChart,
  type FundingDataPoint,
  type ScoreDataPoint,
} from "./RadarCharts";
import Pagination from "@/components/Pagination";

const LIMIT = 50;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreColor(score: number): string {
  if (score > 75) return "var(--danger)";
  if (score >= 40) return "var(--warning)";
  return "var(--primary)";
}

const GITHUB_CLASS: Record<GithubStatus, string> = {
  ACTIVE:  "gh-badge gh-badge-active",
  STALE:   "gh-badge gh-badge-stale",
  DEAD:    "gh-badge gh-badge-dead",
  UNKNOWN: "gh-badge gh-badge-stale",
};

const VERDICT_CLASS: Record<Verdict, string> = {
  VAPORWARE:  "verdict-badge verdict-vaporware",
  SUSPICIOUS: "verdict-badge verdict-suspicious",
  LEGITIMATE: "verdict-badge verdict-legitimate",
  UNKNOWN:    "verdict-badge verdict-unknown",
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="mb-6 text-xs font-bold tracking-[0.2em] uppercase"
      style={{ fontFamily: "var(--font-geist-mono)", color: "var(--text-muted)" }}
    >
      {children}
    </p>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function RadarPage({
  searchParams,
}: {
  searchParams: Promise<{ offset?: string }>;
}) {
  const { offset: offsetStr } = await searchParams;
  const offset = Math.max(0, parseInt(offsetStr ?? "0", 10) || 0);

  const [stats, projectsPage] = await Promise.all([
    getStats(),
    getProjects(LIMIT, offset),
  ]);
  const projects = projectsPage.data;

  // Derive chart data from real projects (all visible on the current page).
  const fundingData: FundingDataPoint[] = projects
    .filter((p) => p.funding_usd != null || p.kloc_shipped != null)
    .map((p) => ({
      name:    p.name.split(" ").slice(0, 2).join(" "), // shorten for axis
      funding: p.funding_usd != null ? +(p.funding_usd / 1_000_000).toFixed(1) : 0,
      code:    p.kloc_shipped ?? 0,
    }));

  const scoreData: ScoreDataPoint[] = [...projects]
    .sort((a, b) => b.vaporware_score - a.vaporware_score)
    .map((p) => ({
      name:  p.name.split(" ").slice(0, 2).join(" "),
      score: p.vaporware_score,
    }));

  const SUMMARY_STATS = [
    { label: "Projects Monitored",        value: String(stats.total_projects) },
    { label: "Confirmed Vaporware (>75%)", value: String(stats.confirmed_vaporware) },
    { label: "Actually Shipping Code",     value: String(stats.actually_shipping) },
  ];

  return (
    <div className="w-full px-6 py-16">
      <div className="mx-auto max-w-6xl flex flex-col gap-16">

        {/* ── Page Header ────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-3">
          <p
            className="text-xs font-semibold tracking-[0.2em] uppercase"
            style={{ fontFamily: "var(--font-geist-mono)", color: "var(--text-muted)" }}
          >
            ▶ PROJECT INTELLIGENCE
          </p>
          <h1
            className="glow-green font-bold leading-none tracking-tight"
            style={{
              fontFamily: "var(--font-geist-mono)",
              color:      "var(--primary)",
              fontSize:   "clamp(2rem, 5vw, 3.5rem)",
            }}
          >
            THE RADAR
          </h1>
          <p className="max-w-xl text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
            All projects claiming the Web4 mantle. Tracked. Scored. Exposed.
          </p>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 1 — SUMMARY STATS
        ══════════════════════════════════════════════════════════════════ */}
        <section>
          <SectionLabel>◈ SUMMARY</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {SUMMARY_STATS.map(({ label, value }) => (
              <div key={label} className="stat-card text-center">
                <p
                  className="text-3xl font-bold tracking-tight mb-1"
                  style={{ fontFamily: "var(--font-geist-mono)", color: "var(--primary)" }}
                >
                  {value}
                </p>
                <p
                  className="text-xs font-medium tracking-wider uppercase"
                  style={{ color: "var(--text-muted)" }}
                >
                  {label}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 2 — PROJECTS TABLE
        ══════════════════════════════════════════════════════════════════ */}
        <section>
          <SectionLabel>◉ PROJECT DATABASE</SectionLabel>

          {projects.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              No projects tracked yet.
            </p>
          ) : (
            <>
              <div
                className="rounded-lg overflow-hidden"
                style={{ border: "1px solid var(--border)" }}
              >
                <div className="overflow-x-auto">
                  <table className="radar-table">
                    <thead style={{ backgroundColor: "var(--surface)" }}>
                      <tr>
                        <th>Project Name</th>
                        <th>Claimed Tech</th>
                        <th>GitHub Status</th>
                        <th>Vaporware Score</th>
                        <th>Verdict</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projects.map((p) => {
                        const color = scoreColor(p.vaporware_score);
                        const ghClass = GITHUB_CLASS[p.github_status] ?? GITHUB_CLASS.UNKNOWN;
                        const vClass  = VERDICT_CLASS[p.verdict] ?? VERDICT_CLASS.UNKNOWN;
                        return (
                          <tr key={p.slug} className="radar-row">
                            <td>
                              <span
                                className="text-sm font-semibold"
                                style={{ fontFamily: "var(--font-geist-mono)", color: "var(--text-primary)" }}
                              >
                                {p.name}
                              </span>
                            </td>

                            <td
                              className="text-xs italic max-w-[200px] truncate"
                              style={{ color: "var(--text-muted)", maxWidth: "200px" }}
                            >
                              {p.claimed_stack.join(", ") || "—"}
                            </td>

                            <td>
                              <span className={ghClass}>{p.github_status}</span>
                            </td>

                            <td>
                              <div className="flex items-center gap-2">
                                <span className="inline-bar-track">
                                  <span
                                    className="inline-bar-fill"
                                    style={{
                                      width:      `${p.vaporware_score}%`,
                                      background: color,
                                      boxShadow:  `0 0 4px ${color}80`,
                                    }}
                                  />
                                </span>
                                <span
                                  className="text-xs font-bold tabular-nums"
                                  style={{ fontFamily: "var(--font-geist-mono)", color }}
                                >
                                  {p.vaporware_score}%
                                </span>
                              </div>
                            </td>

                            <td>
                              <span className={vClass}>{p.verdict}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <Pagination
                total={projectsPage.total}
                limit={LIMIT}
                offset={offset}
                basePath="/radar"
              />
            </>
          )}
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 3 — CHARTS
        ══════════════════════════════════════════════════════════════════ */}
        <section className="flex flex-col gap-12">
          <SectionLabel>◎ ANALYTICS</SectionLabel>

          {fundingData.length > 0 && (
            <div>
              <h2
                className="mb-1 text-sm font-bold tracking-wide"
                style={{ fontFamily: "var(--font-geist-mono)", color: "var(--text-primary)" }}
              >
                Funding Raised vs. Lines of Code Shipped
              </h2>
              <p className="mb-6 text-xs" style={{ color: "var(--text-muted)" }}>
                $M raised (green) vs. kLoC shipped (red). The gap tells the story.
              </p>
              <div
                className="rounded-lg p-4"
                style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
              >
                <FundingVsCodeChart data={fundingData} />
              </div>
            </div>
          )}

          {scoreData.length > 0 && (
            <div>
              <h2
                className="mb-1 text-sm font-bold tracking-wide"
                style={{ fontFamily: "var(--font-geist-mono)", color: "var(--text-primary)" }}
              >
                Vaporware Score Distribution
              </h2>
              <p className="mb-6 text-xs" style={{ color: "var(--text-muted)" }}>
                All tracked projects sorted by vaporware score. Green is legitimate. Red is concerning.
              </p>
              <div
                className="rounded-lg p-4"
                style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
              >
                <VaporwareScoreChart data={scoreData} />
              </div>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
