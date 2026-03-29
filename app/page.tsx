import { getStats, getProjects, getBuzzwords, getArticles } from "@/lib/api";
import LeaderboardTable from "@/components/LeaderboardTable";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function Home() {
  const [stats, projectsPage, buzzwords, articlesPage] = await Promise.all([
    getStats(),
    getProjects(200, 0),
    getBuzzwords(),
    getArticles(200, 0),
  ]);

  const articleProjectSlugs = articlesPage.data.map((a) => a.project_slug);

  return (
    <>
      {/* ══════════════════════════════════════════════════════════════════════
          STATS BAR
      ══════════════════════════════════════════════════════════════════════ */}
      <section
        style={{
          borderBottom:    "1px solid var(--border)",
          backgroundColor: "var(--surface)",
        }}
        className="w-full px-4 md:px-6 py-3"
      >
        <div
          style={{
            display:    "flex",
            flexWrap:   "wrap",
            gap:        "0",
            fontFamily: "var(--font-geist-mono)",
          }}
        >
          {[
            { label: "PROJECTS TRACKED",   value: String(stats.total_projects) },
            { label: "AVG VAPORWARE",       value: `${Math.round(stats.avg_vaporware_score)}%` },
            { label: "DEAD REPOS",          value: String(stats.dead_repos) },
            { label: "CONFIRMED VAPORWARE", value: String(stats.confirmed_vaporware) },
          ].map(({ label, value }, idx, arr) => (
            <div
              key={label}
              style={{
                borderRight: idx < arr.length - 1 ? "1px solid var(--border)" : "none",
                padding:     "0.4rem 1.25rem",
                display:     "flex",
                alignItems:  "center",
                gap:         "0.5rem",
              }}
            >
              <span style={{ color: "var(--text-muted)", fontSize: "0.62rem", letterSpacing: "0.1em" }}>
                {label}:
              </span>
              <span
                style={{
                  color:       "var(--primary)",
                  fontSize:    "0.78rem",
                  fontWeight:  700,
                  letterSpacing: "0.04em",
                }}
              >
                {value}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          LEADERBOARD HEADING
      ══════════════════════════════════════════════════════════════════════ */}
      <div
        className="w-full px-4 md:px-6 pt-6 pb-2"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <h1
          style={{
            fontFamily:    "var(--font-geist-mono)",
            color:         "var(--primary)",
            fontSize:      "0.7rem",
            fontWeight:    700,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
          }}
        >
          ◈ SNIPER LEADERBOARD
        </h1>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          TABLE (client component — sorting + filtering)
      ══════════════════════════════════════════════════════════════════════ */}
      <LeaderboardTable
        projects={projectsPage.data}
        articleProjectSlugs={articleProjectSlugs}
      />

      {/* ══════════════════════════════════════════════════════════════════════
          BUZZWORD TICKER
      ══════════════════════════════════════════════════════════════════════ */}
      {buzzwords.length > 0 && (
        <div
          style={{
            borderTop:   "1px solid var(--border)",
            padding:     "0.6rem 1.25rem",
            fontFamily:  "var(--font-geist-mono)",
            fontSize:    "0.65rem",
            color:       "var(--text-muted)",
            letterSpacing: "0.06em",
            overflowX:   "auto",
            whiteSpace:  "nowrap",
          }}
        >
          <span style={{ color: "var(--text-muted)", opacity: 0.6 }}>
            TOP BUZZWORDS THIS WEEK:{" "}
          </span>
          {buzzwords.map((bw, i) => (
            <span key={bw.word}>
              <span style={{ color: "var(--text-primary)" }}>{bw.word}</span>
              <span style={{ opacity: 0.5 }}> ({bw.count})</span>
              {i < buzzwords.length - 1 && (
                <span style={{ margin: "0 0.5rem", opacity: 0.4 }}>·</span>
              )}
            </span>
          ))}
        </div>
      )}
    </>
  );
}
