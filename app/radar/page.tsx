import { FundingVsCodeChart, VaporwareScoreChart } from "./RadarCharts";

// ─── Types ────────────────────────────────────────────────────────────────────

type GithubStatus = "ACTIVE" | "STALE" | "DEAD";
type Verdict      = "VAPORWARE" | "SUSPICIOUS" | "LEGITIMATE" | "UNKNOWN";

interface Project {
  name:        string;
  claimedTech: string;
  github:      GithubStatus;
  score:       number;
  verdict:     Verdict;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const SUMMARY_STATS = [
  { label: "Projects Monitored",        value: "47"  },
  { label: "Confirmed Vaporware (>75%)", value: "31"  },
  { label: "Actually Shipping Code",     value: "8"   },
];

const PROJECTS: Project[] = [
  { name: "NeuralMesh Protocol",  claimedTech: "Quantum-entangled AI mesh nodes",        github: "DEAD",   score: 94, verdict: "VAPORWARE"  },
  { name: "Symbiont Chain",       claimedTech: "zkML + on-chain cognition layer",         github: "ACTIVE", score: 67, verdict: "SUSPICIOUS" },
  { name: "Web4 Foundation DAO",  claimedTech: "Post-blockchain governance fabric",        github: "DEAD",   score: 99, verdict: "VAPORWARE"  },
  { name: "CortexNet",            claimedTech: "Neuromorphic edge computing protocol",     github: "STALE",  score: 71, verdict: "SUSPICIOUS" },
  { name: "AetherGrid",           claimedTech: "AGI-adjacent distributed reasoning",       github: "DEAD",   score: 88, verdict: "VAPORWARE"  },
  { name: "OpenMesh Labs",        claimedTech: "Decentralized AI inference layer",         github: "ACTIVE", score: 38, verdict: "LEGITIMATE" },
  { name: "SynapseDAO",           claimedTech: "Cognitive tokenomics framework",           github: "STALE",  score: 55, verdict: "SUSPICIOUS" },
  { name: "Noosphere Protocol",   claimedTech: "Human-AI symbiotic web fabric",            github: "DEAD",   score: 91, verdict: "VAPORWARE"  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreColor(score: number): string {
  if (score > 75) return "var(--danger)";
  if (score >= 40) return "var(--warning)";
  return "var(--primary)";
}

const GITHUB_CLASS: Record<GithubStatus, string> = {
  ACTIVE: "gh-badge gh-badge-active",
  STALE:  "gh-badge gh-badge-stale",
  DEAD:   "gh-badge gh-badge-dead",
};

const VERDICT_CLASS: Record<Verdict, string> = {
  VAPORWARE:  "verdict-badge verdict-vaporware",
  SUSPICIOUS: "verdict-badge verdict-suspicious",
  LEGITIMATE: "verdict-badge verdict-legitimate",
  UNKNOWN:    "verdict-badge verdict-unknown",
};

// ─── Section header shared style ──────────────────────────────────────────────

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

export default function RadarPage() {
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
                  {PROJECTS.map((p) => {
                    const color = scoreColor(p.score);
                    return (
                      <tr key={p.name} className="radar-row">
                        {/* Name */}
                        <td>
                          <span
                            className="text-sm font-semibold"
                            style={{ fontFamily: "var(--font-geist-mono)", color: "var(--text-primary)" }}
                          >
                            {p.name}
                          </span>
                        </td>

                        {/* Claimed tech */}
                        <td
                          className="text-xs italic max-w-[200px] truncate"
                          style={{ color: "var(--text-muted)", maxWidth: "200px" }}
                        >
                          {p.claimedTech}
                        </td>

                        {/* GitHub status */}
                        <td>
                          <span className={GITHUB_CLASS[p.github]}>
                            {p.github}
                          </span>
                        </td>

                        {/* Vaporware score */}
                        <td>
                          <div className="flex items-center gap-2">
                            <span className="inline-bar-track">
                              <span
                                className="inline-bar-fill"
                                style={{
                                  width:      `${p.score}%`,
                                  background: color,
                                  boxShadow:  `0 0 4px ${color}80`,
                                }}
                              />
                            </span>
                            <span
                              className="text-xs font-bold tabular-nums"
                              style={{ fontFamily: "var(--font-geist-mono)", color }}
                            >
                              {p.score}%
                            </span>
                          </div>
                        </td>

                        {/* Verdict */}
                        <td>
                          <span className={VERDICT_CLASS[p.verdict]}>
                            {p.verdict}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 3 — CHARTS
        ══════════════════════════════════════════════════════════════════ */}
        <section className="flex flex-col gap-12">
          <SectionLabel>◎ ANALYTICS</SectionLabel>

          {/* Chart 1 — Funding vs Code */}
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
              <FundingVsCodeChart />
            </div>
          </div>

          {/* Chart 2 — Score Distribution */}
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
              <VaporwareScoreChart />
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
