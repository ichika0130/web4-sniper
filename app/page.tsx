// ─── Mock Data ────────────────────────────────────────────────────────────────

const FEATURED = {
  name:    "NeuralMesh Protocol",
  verdict: "VAPORWARE" as const,
  summary: "Claims quantum-entangled AI nodes. Actual stack: AWS Lambda + MongoDB.",
  slug:    "/crosshairs/neuralmesh-protocol",
};

const STATS = [
  { label: "Projects Tracked",    value: "47" },
  { label: "Avg Vaporware Score", value: "81%" },
  { label: "Dead GitHub Repos",   value: "34" },
  { label: "Snipe of the Week",   value: "NeuralMesh" },
];

const ARTICLES = [
  {
    name:    "NeuralMesh Protocol",
    score:   94,
    excerpt: "Their whitepaper cites a 2019 Medium post as a primary source.",
    slug:    "/crosshairs/neuralmesh-protocol",
  },
  {
    name:    "Symbiont Chain",
    score:   67,
    excerpt: "Legitimate zkML research buried under 40 pages of tokenomics.",
    slug:    "/crosshairs/symbiont-chain",
  },
  {
    name:    "Web4 Foundation DAO",
    score:   99,
    excerpt: "The 'foundation' is a Notion page. The DAO has 3 members.",
    slug:    "/crosshairs/web4-foundation-dao",
  },
];

const BUZZWORDS = [
  { word: "Symbiotic",      count: 38 },
  { word: "Cognitive Layer",count: 27 },
  { word: "Quantum-ready",  count: 24 },
  { word: "Post-blockchain",count: 19 },
  { word: "AGI-adjacent",   count: 11 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BUZZ_MAX = Math.max(...BUZZWORDS.map((b) => b.count));

function scoreColor(score: number): string {
  if (score > 75) return "var(--danger)";
  if (score >= 40) return "var(--warning)";
  return "var(--primary)";
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
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
                {FEATURED.name}
              </span>

              {/* Verdict badge */}
              <span
                className="glow-red px-2 py-0.5 text-xs font-bold tracking-widest rounded"
                style={{
                  fontFamily:      "var(--font-geist-mono)",
                  color:           "var(--danger)",
                  border:          "1px solid var(--danger)",
                  backgroundColor: "rgba(255,59,59,0.08)",
                }}
              >
                {FEATURED.verdict}
              </span>
            </div>

            <p className="mb-4 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
              {FEATURED.summary}
            </p>

            <a href={FEATURED.slug} className="read-link">
              READ TEARDOWN →
            </a>
          </div>
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
          {STATS.map(({ label, value }) => (
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

          {/* Section header */}
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

          {/* Article grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {ARTICLES.map((article) => {
              const color = scoreColor(article.score);
              return (
                <article key={article.slug} className="article-card">

                  {/* Project name */}
                  <h3
                    className="text-sm font-bold tracking-wide"
                    style={{ fontFamily: "var(--font-geist-mono)", color: "var(--text-primary)" }}
                  >
                    {article.name}
                  </h3>

                  {/* Vaporware score + bar */}
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
                        {article.score}%
                      </span>
                    </div>
                    <div className="buzzword-bar-track">
                      <div
                        className="buzzword-bar-fill"
                        style={{
                          width:      `${article.score}%`,
                          background: color,
                          boxShadow:  `0 0 6px ${color}80`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Excerpt */}
                  <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                    {article.excerpt}
                  </p>

                  {/* Link */}
                  <a href={article.slug} className="read-link mt-auto">
                    READ →
                  </a>
                </article>
              );
            })}
          </div>
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

          <ul className="flex flex-col gap-5 max-w-2xl">
            {BUZZWORDS.map(({ word, count }) => {
              const pct = Math.round((count / BUZZ_MAX) * 100);
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
        </div>
      </section>
    </>
  );
}
