import { getArticles } from "@/lib/api";
import type { Verdict } from "@/lib/api";

function scoreColor(score: number): string {
  if (score > 75) return "var(--danger)";
  if (score >= 40) return "var(--warning)";
  return "var(--primary)";
}

const VERDICT_STYLE: Record<Verdict, { color: string; bg: string }> = {
  VAPORWARE:  { color: "var(--danger)",     bg: "rgba(255,59,59,0.1)"  },
  SUSPICIOUS: { color: "var(--warning)",    bg: "rgba(255,184,0,0.1)" },
  LEGITIMATE: { color: "var(--primary)",    bg: "rgba(57,255,20,0.1)" },
  UNKNOWN:    { color: "var(--text-muted)", bg: "rgba(74,85,104,0.15)" },
};

export default async function CrosshairsPage() {
  const articles = await getArticles();

  return (
    <div className="w-full px-6 py-16">
      <div className="mx-auto max-w-5xl flex flex-col gap-12">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-3">
          <p
            className="text-xs font-semibold tracking-[0.2em] uppercase"
            style={{ fontFamily: "var(--font-geist-mono)", color: "var(--text-muted)" }}
          >
            ▶ FULL TEARDOWNS
          </p>
          <h1
            className="glow-green font-bold leading-none tracking-tight"
            style={{
              fontFamily: "var(--font-geist-mono)",
              color:      "var(--primary)",
              fontSize:   "clamp(2rem, 5vw, 3.5rem)",
            }}
          >
            THE CROSSHAIRS
          </h1>
          <p className="max-w-lg text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
            Full teardowns. Every claim verified. No mercy.
          </p>
        </div>

        {/* ── Article Grid ─────────────────────────────────────────────── */}
        {articles.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            No teardowns published yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {articles.map((article) => {
              const color   = scoreColor(article.vaporware_score);
              const verdict = VERDICT_STYLE[article.verdict] ?? VERDICT_STYLE.UNKNOWN;
              const date    = article.published_at
                ? new Date(article.published_at).toISOString().slice(0, 10)
                : "—";
              return (
                <article
                  key={article.slug}
                  className="article-card"
                  style={{ gap: "1rem" }}
                >
                  {/* Meta row */}
                  <div className="flex items-center gap-3">
                    <span
                      className="text-xs tabular-nums"
                      style={{ fontFamily: "var(--font-geist-mono)", color: "var(--text-muted)" }}
                    >
                      {date}
                    </span>
                    <span
                      className="text-xs font-bold tracking-widest px-2 py-0.5 rounded"
                      style={{
                        fontFamily:      "var(--font-geist-mono)",
                        color:           verdict.color,
                        backgroundColor: verdict.bg,
                        border:          `1px solid ${verdict.color}`,
                      }}
                    >
                      {article.verdict}
                    </span>
                  </div>

                  {/* Title */}
                  <h2
                    className="text-base font-bold leading-snug tracking-wide"
                    style={{ fontFamily: "var(--font-geist-mono)", color: "var(--text-primary)" }}
                  >
                    {article.title}
                  </h2>

                  {/* Vaporware bar */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className="text-xs font-semibold tracking-wider uppercase"
                        style={{ fontFamily: "var(--font-geist-mono)", color: "var(--text-muted)" }}
                      >
                        Vaporware Score
                      </span>
                      <span
                        className="text-xs font-bold tabular-nums"
                        style={{ fontFamily: "var(--font-geist-mono)", color }}
                      >
                        {article.vaporware_score}%
                      </span>
                    </div>
                    <div className="buzzword-bar-track">
                      <div
                        className="buzzword-bar-fill"
                        style={{
                          width:      `${article.vaporware_score}%`,
                          background: color,
                          boxShadow:  `0 0 6px ${color}80`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Excerpt / one-liner */}
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                    {article.one_liner ?? (article.body[0]?.body ?? "")}
                  </p>

                  {/* Link */}
                  <a
                    href={`/crosshairs/${article.slug}`}
                    className="read-link mt-auto"
                  >
                    READ TEARDOWN →
                  </a>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
