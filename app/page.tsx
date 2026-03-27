import { getStats, getArticles, getBuzzwords } from "@/lib/api";
import type { Verdict } from "@/lib/api";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreColor(score: number): string {
  if (score > 75) return "var(--danger)";
  if (score >= 40) return "var(--warning)";
  return "var(--primary)";
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function Home() {
  const [stats, articlesPage, buzzwords] = await Promise.all([
    getStats(),
    getArticles(3, 0),
    getBuzzwords(),
  ]);

  const articles = articlesPage.data;
  const featured = articles[0] ?? null;
  const recentArticles = articles.slice(0, 3);
  const buzzMax = buzzwords.length > 0 ? Math.max(...buzzwords.map((b) => b.count)) : 1;

  const STATS_CARDS = [
    { label: "Projects Tracked",    value: String(stats.total_projects) },
    { label: "Avg Vaporware Score", value: `${Math.round(stats.avg_vaporware_score)}%` },
    { label: "Dead GitHub Repos",   value: String(stats.dead_repos) },
    { label: "Snipe of the Week",   value: stats.snipe_of_the_week || "—" },
  ];

  const VERDICT_GLOW: Partial<Record<Verdict, string>> = {
    VAPORWARE: "glow-red",
    LEGITIMATE: "glow-green",
  };

  return (
    <>
      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 1 — HERO
      ══════════════════════════════════════════════════════════════════════ */}
      <section
        style={{ borderBottom: "1px solid var(--border)" }}
        className="w-full px-6 py-20 md:py-28"
      >
        <div className="mx-auto max-w-5xl flex flex-col gap-6">

          {/* Eyebrow */}
          <p
            className="text-xs font-semibold tracking-[0.2em] uppercase"
            style={{ fontFamily: "var(--font-geist-mono)", color: "var(--text-muted)" }}
          >
            ▶ WEEKLY ANALYSIS BRIEF
          </p>

          {/* Headline */}
          <h1
            className="glow-green leading-none font-bold tracking-tight"
            style={{
              fontFamily: "var(--font-geist-mono)",
              color:      "var(--primary)",
              fontSize:   "clamp(2.5rem, 7vw, 5rem)",
            }}
          >
            SNIPING THE HYPE.
            <br />
            ANALYZING THE TECH.
          </h1>

          {/* Subheadline */}
          <p
            className="max-w-xl text-base md:text-lg leading-relaxed"
            style={{ color: "var(--text-muted)" }}
          >
            The only publication that reads the whitepaper so you don&apos;t have to.
          </p>

          {/* Featured card — Snipe of the Week */}
          {featured && (
            <div className="featured-card mt-4 max-w-2xl">
              <p
                className="mb-3 text-xs font-bold tracking-[0.18em] uppercase"
                style={{ fontFamily: "var(--font-geist-mono)", color: "var(--text-muted)" }}
              >
                ◎ SNIPE OF THE WEEK
              </p>

              <div className="flex flex-wrap items-center gap-3 mb-2">
                <span
                  className="text-lg font-bold tracking-wide"
                  style={{ fontFamily: "var(--font-geist-mono)", color: "var(--text-primary)" }}
                >
                  {featured.project_name}
                </span>

                <span
                  className={`px-2 py-0.5 text-xs font-bold tracking-widest rounded ${VERDICT_GLOW[featured.verdict] ?? ""}`}
                  style={{
                    fontFamily:      "var(--font-geist-mono)",
                    color:           scoreColor(featured.vaporware_score),
                    border:          `1px solid ${scoreColor(featured.vaporware_score)}`,
                    backgroundColor: `${scoreColor(featured.vaporware_score)}14`,
                  }}
                >
                  {featured.verdict}
                </span>
              </div>

              <p className="mb-4 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                {featured.one_liner ?? featured.title}
              </p>

              <a href={`/crosshairs/${featured.slug}`} className="read-link">
                READ TEARDOWN →
              </a>
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 2 — STATS BAR
      ══════════════════════════════════════════════════════════════════════ */}
      <section
        className="w-full px-6 py-8"
        style={{
          backgroundColor: "var(--surface)",
          borderBottom:    "1px solid var(--border)",
        }}
      >
        <div className="mx-auto max-w-5xl grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS_CARDS.map(({ label, value }) => (
            <div key={label} className="stat-card text-center">
              <p
                className="text-2xl md:text-3xl font-bold tracking-tight mb-1"
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

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 3 — RECENT CROSSHAIRS
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="w-full px-6 py-16" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="mx-auto max-w-5xl">

          <div className="flex items-baseline justify-between mb-8">
            <h2
              className="text-sm font-bold tracking-[0.2em] uppercase"
              style={{ fontFamily: "var(--font-geist-mono)", color: "var(--text-muted)" }}
            >
              ◈ RECENT CROSSHAIRS
            </h2>
            <a href="/crosshairs" className="read-link text-xs">
              ALL CROSSHAIRS →
            </a>
          </div>

          {recentArticles.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              No articles published yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {recentArticles.map((article) => {
                const color = scoreColor(article.vaporware_score);
                return (
                  <article key={article.slug} className="article-card">
                    <h3
                      className="text-sm font-bold tracking-wide"
                      style={{ fontFamily: "var(--font-geist-mono)", color: "var(--text-primary)" }}
                    >
                      {article.project_name}
                    </h3>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span
                          className="text-xs font-semibold tracking-wider"
                          style={{ fontFamily: "var(--font-geist-mono)", color: "var(--text-muted)" }}
                        >
                          VAPORWARE SCORE
                        </span>
                        <span
                          className="text-xs font-bold"
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

                    <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                      {article.one_liner ?? article.title}
                    </p>

                    <a href={`/crosshairs/${article.slug}`} className="read-link mt-auto">
                      READ →
                    </a>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 4 — BUZZWORD RADAR
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="w-full px-6 py-16">
        <div className="mx-auto max-w-5xl">

          <h2
            className="mb-2 text-sm font-bold tracking-[0.2em] uppercase"
            style={{ fontFamily: "var(--font-geist-mono)", color: "var(--text-muted)" }}
          >
            ◉ BUZZWORD RADAR
          </h2>
          <p className="mb-8 text-xs" style={{ color: "var(--text-muted)", opacity: 0.6 }}>
            Top buzzwords detected across all tracked whitepapers this week.
          </p>

          {buzzwords.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              No buzzwords tracked yet this week.
            </p>
          ) : (
            <ul className="flex flex-col gap-5 max-w-2xl">
              {buzzwords.map(({ word, count }) => {
                const pct = Math.round((count / buzzMax) * 100);
                return (
                  <li key={word}>
                    <div className="flex items-baseline justify-between mb-2">
                      <span
                        className="text-sm font-semibold tracking-wide"
                        style={{ fontFamily: "var(--font-geist-mono)", color: "var(--text-primary)" }}
                      >
                        {word}
                      </span>
                      <span
                        className="text-xs tabular-nums"
                        style={{ fontFamily: "var(--font-geist-mono)", color: "var(--text-muted)" }}
                      >
                        {count} occurrences
                      </span>
                    </div>
                    <div className="buzzword-bar-track">
                      <div className="buzzword-bar-fill" style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
