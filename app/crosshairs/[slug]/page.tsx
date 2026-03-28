import { notFound } from "next/navigation";
import { getArticles, getArticleBySlug } from "@/lib/api";
import type { Verdict } from "@/lib/api";

// ─── Static params ────────────────────────────────────────────────────────────

export async function generateStaticParams() {
  const { data: articles } = await getArticles(200, 0);
  return articles.map((a) => ({ slug: a.slug }));
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article   = await getArticleBySlug(slug);
  if (!article) return {};
  return {
    title:       `${article.title} — WEB4 SNIPER`,
    description: article.one_liner ?? article.title,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreColor(score: number): string {
  if (score > 75) return "var(--danger)";
  if (score >= 40) return "var(--warning)";
  return "var(--primary)";
}

const VERDICT_META: Record<
  Verdict,
  { color: string; bg: string; border: string; glow?: string }
> = {
  VAPORWARE:  {
    color:  "var(--danger)",
    bg:     "rgba(255,59,59,0.08)",
    border: "var(--danger)",
    glow:   "glow-red",
  },
  SUSPICIOUS: {
    color:  "var(--warning)",
    bg:     "rgba(255,184,0,0.08)",
    border: "var(--warning)",
  },
  LEGITIMATE: {
    color:  "var(--primary)",
    bg:     "rgba(57,255,20,0.08)",
    border: "var(--primary)",
    glow:   "glow-green",
  },
  UNKNOWN: {
    color:  "var(--text-muted)",
    bg:     "rgba(74,85,104,0.15)",
    border: "var(--text-muted)",
  },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article   = await getArticleBySlug(slug);
  if (!article) notFound();

  const scoreCol = scoreColor(article.vaporware_score);
  const vmeta    = VERDICT_META[article.verdict] ?? VERDICT_META.UNKNOWN;
  const date     = article.published_at
    ? new Date(article.published_at).toISOString().slice(0, 10)
    : "—";

  const ghStatus =
    article.vaporware_score > 75 ? "DEAD" :
    article.vaporware_score >= 40 ? "STALE" : "ACTIVE";

  const ghColor =
    ghStatus === "DEAD"  ? "var(--danger)"  :
    ghStatus === "STALE" ? "var(--warning)" :
    "var(--primary)";

  return (
    <div className="w-full px-6 py-14">
      <div className="mx-auto max-w-6xl">

        {/* Breadcrumb */}
        <p
          className="mb-8 text-xs tracking-wider"
          style={{ fontFamily: "var(--font-geist-mono)", color: "var(--text-muted)" }}
        >
          <a href="/crosshairs" className="read-link" style={{ fontSize: "0.7rem" }}>
            ← THE CROSSHAIRS
          </a>
        </p>

        {/* Two-column layout */}
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-14">

          {/* ══════════════════════════════════════════════════════════════
              MAIN CONTENT — left ~65%
          ══════════════════════════════════════════════════════════════ */}
          <div className="flex-1 min-w-0 flex flex-col gap-8">

            {/* Article title */}
            <h1
              className="font-bold leading-tight tracking-tight"
              style={{
                fontFamily: "var(--font-geist-mono)",
                color:      "var(--text-primary)",
                fontSize:   "clamp(1.5rem, 4vw, 2.4rem)",
              }}
            >
              {article.title}
            </h1>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-3">
              <span
                className="text-xs tabular-nums"
                style={{ fontFamily: "var(--font-geist-mono)", color: "var(--text-muted)" }}
              >
                {date}
              </span>
              <span style={{ color: "var(--border)" }}>·</span>
              <span
                className="text-xs"
                style={{ fontFamily: "var(--font-geist-mono)", color: "var(--text-muted)" }}
              >
                {article.author}
              </span>
              <span style={{ color: "var(--border)" }}>·</span>
              <span
                className={`text-xs font-bold tracking-widest px-2 py-0.5 rounded ${vmeta.glow ?? ""}`}
                style={{
                  fontFamily:      "var(--font-geist-mono)",
                  color:           vmeta.color,
                  backgroundColor: vmeta.bg,
                  border:          `1px solid ${vmeta.border}`,
                }}
              >
                {article.verdict}
              </span>
            </div>

            {/* Vaporware score bar — large */}
            <div>
              <div className="flex items-baseline justify-between mb-2">
                <span
                  className="text-xs font-bold tracking-[0.18em] uppercase"
                  style={{ fontFamily: "var(--font-geist-mono)", color: "var(--text-muted)" }}
                >
                  Vaporware Score
                </span>
                <span
                  className="text-2xl font-bold tabular-nums"
                  style={{ fontFamily: "var(--font-geist-mono)", color: scoreCol }}
                >
                  {article.vaporware_score}%
                </span>
              </div>
              <div className="score-bar-track">
                <div
                  className="score-bar-fill"
                  style={{
                    width:      `${article.vaporware_score}%`,
                    background: scoreCol,
                    boxShadow:  `0 0 8px ${scoreCol}80`,
                  }}
                />
              </div>
            </div>

            {/* Divider */}
            <hr style={{ borderColor: "var(--border)", borderTopWidth: "1px" }} />

            {/* Article sections */}
            <div className="flex flex-col gap-10">
              {(article.body ?? []).map((section) => (
                <div key={section.heading} className="flex flex-col gap-3">
                  <h2
                    className="text-sm font-bold tracking-[0.12em] uppercase"
                    style={{ fontFamily: "var(--font-geist-mono)", color: "var(--primary)" }}
                  >
                    {section.heading}
                  </h2>
                  <div className="article-body">
                    <p>{section.body}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Final Verdict block */}
            <div
              className="verdict-final-block mt-4"
              style={{
                borderColor:     vmeta.border,
                backgroundColor: vmeta.bg,
              }}
            >
              <p
                className="mb-2 text-xs font-bold tracking-[0.2em] uppercase"
                style={{ fontFamily: "var(--font-geist-mono)", color: "var(--text-muted)" }}
              >
                ◎ FINAL VERDICT
              </p>
              <div className="flex flex-wrap items-baseline gap-4 mb-3">
                <span
                  className="text-4xl font-bold tabular-nums"
                  style={{ fontFamily: "var(--font-geist-mono)", color: vmeta.color }}
                >
                  {article.vaporware_score}%
                </span>
                <span
                  className={`text-base font-bold tracking-widest ${vmeta.glow ?? ""}`}
                  style={{ fontFamily: "var(--font-geist-mono)", color: vmeta.color }}
                >
                  {article.verdict}
                </span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                {article.one_liner ?? ""}
              </p>
            </div>

          </div>{/* /main */}

          {/* ══════════════════════════════════════════════════════════════
              SIDEBAR — right ~35%
          ══════════════════════════════════════════════════════════════ */}
          <aside className="w-full lg:w-80 xl:w-96 flex-shrink-0 flex flex-col gap-5">

            {/* Tech Stack Reality Check — only shown when stack data is available */}
            {(article.claimed_stack.length > 0 || article.real_stack.length > 0) && (
              <div className="sidebar-card">
                <p className="sidebar-card-title">TECH STACK REALITY CHECK</p>

                {article.claimed_stack.length > 0 && (
                  <>
                    <p
                      className="mb-2 text-xs font-semibold tracking-wider uppercase"
                      style={{ fontFamily: "var(--font-geist-mono)", color: "var(--text-muted)" }}
                    >
                      What They Claim
                    </p>
                    <ul className="stack-list mb-5">
                      {article.claimed_stack.map((item) => (
                        <li key={item}>
                          <span style={{ color: "var(--danger)", flexShrink: 0 }}>✗</span>
                          <span style={{ color: "var(--text-muted)" }}>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}

                {article.real_stack.length > 0 && (
                  <>
                    <p
                      className="mb-2 text-xs font-semibold tracking-wider uppercase"
                      style={{ fontFamily: "var(--font-geist-mono)", color: "var(--text-muted)" }}
                    >
                      What It Actually Is
                    </p>
                    <ul className="stack-list">
                      {article.real_stack.map((item) => (
                        <li key={item}>
                          <span style={{ color: "var(--primary)", flexShrink: 0 }}>✓</span>
                          <span style={{ color: "var(--text-primary)" }}>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )}

            {/* Quick Stats */}
            <div className="sidebar-card">
              <p className="sidebar-card-title">QUICK STATS</p>

              <div className="quick-stat-row">
                <span style={{ color: "var(--text-muted)", fontFamily: "var(--font-geist-mono)" }}>
                  Vaporware Score
                </span>
                <span style={{ color: scoreCol, fontFamily: "var(--font-geist-mono)", fontWeight: 700 }}>
                  {article.vaporware_score}%
                </span>
              </div>

              <div className="quick-stat-row">
                <span style={{ color: "var(--text-muted)", fontFamily: "var(--font-geist-mono)" }}>
                  Verdict
                </span>
                <span
                  style={{
                    color:         vmeta.color,
                    fontFamily:    "var(--font-geist-mono)",
                    fontWeight:    700,
                    fontSize:      "0.65rem",
                    letterSpacing: "0.1em",
                  }}
                >
                  {article.verdict}
                </span>
              </div>

              <div className="quick-stat-row">
                <span style={{ color: "var(--text-muted)", fontFamily: "var(--font-geist-mono)" }}>
                  Date Analyzed
                </span>
                <span
                  className="tabular-nums"
                  style={{ color: "var(--text-primary)", fontFamily: "var(--font-geist-mono)" }}
                >
                  {date}
                </span>
              </div>

              <div className="quick-stat-row">
                <span style={{ color: "var(--text-muted)", fontFamily: "var(--font-geist-mono)" }}>
                  GitHub Status
                </span>
                <span
                  style={{
                    color:         ghColor,
                    fontFamily:    "var(--font-geist-mono)",
                    fontWeight:    700,
                    fontSize:      "0.65rem",
                    letterSpacing: "0.1em",
                  }}
                >
                  {ghStatus}
                </span>
              </div>
            </div>

          </aside>
        </div>{/* /two-col */}
      </div>
    </div>
  );
}
