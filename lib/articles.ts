// ─── Types ────────────────────────────────────────────────────────────────────

export type Verdict = "VAPORWARE" | "SUSPICIOUS" | "LEGITIMATE" | "UNKNOWN";

export interface ArticleSection {
  heading: string;
  body:    string;
}

export interface Article {
  slug:            string;
  title:           string;
  date:            string;
  author:          string;
  verdict:         Verdict;
  vaporwareScore:  number;
  oneLiner:        string;
  techClaimedStack: string[];
  techRealStack:   string[];
  excerpt:         string;
  sections:        ArticleSection[];
}

// ─── Mock Articles ────────────────────────────────────────────────────────────

export const ARTICLES: Article[] = [
  {
    slug:           "neuralmesh-protocol",
    title:          "NeuralMesh Protocol: $12M for an AWS Wrapper",
    date:           "2025-03-24",
    author:         "The Sniper",
    verdict:        "VAPORWARE",
    vaporwareScore: 94,
    oneLiner:       "Quantum-entangled AI nodes. Actual stack: AWS Lambda + MongoDB.",
    techClaimedStack: [
      "Quantum mesh networking",
      "On-chain cognition",
      "Proprietary AI substrate",
    ],
    techRealStack: [
      "AWS Lambda",
      "MongoDB Atlas",
      "OpenAI API",
      "Vercel",
    ],
    excerpt: "Their whitepaper cites a 2019 Medium post as a primary source.",
    sections: [
      {
        heading: "The Pitch",
        body:    "NeuralMesh raised $12M in 2024 promising a 'quantum-entangled cognitive mesh' — a decentralized network where AI nodes communicate via entangled state vectors. The whitepaper is 47 pages long. We read all of it.",
      },
      {
        heading: "What the Whitepaper Actually Says",
        body:    "Page 3 opens with a citation to a Medium blog post titled 'The Future of AI is Quantum' published in 2019 by an anonymous author with 12 followers. By page 8, 'quantum entanglement' is used to describe latency optimization between AWS availability zones. These are not the same thing.",
      },
      {
        heading: "The GitHub Audit",
        body:    "The public repository has 3 commits. The last one was 14 months ago. It contains a README, a logo PNG, and a copied MIT license. There is no code. The repo has 847 stars, which were likely purchased.",
      },
      {
        heading: "The Verdict",
        body:    "NeuralMesh Protocol is a marketing exercise with a $12M budget. The technology described in their whitepaper does not exist and cannot exist with current physics. The actual infrastructure is commodity cloud services available to any developer for $50/month.",
      },
    ],
  },

  {
    slug:           "symbiont-chain",
    title:          "Symbiont Chain: Legitimate Research, Catastrophic Tokenomics",
    date:           "2025-03-18",
    author:         "The Sniper",
    verdict:        "SUSPICIOUS",
    vaporwareScore: 67,
    oneLiner:       "Real zkML research buried under 40 pages of tokenomics.",
    techClaimedStack: [
      "zkML proofs",
      "On-chain inference",
      "Symbiotic consensus",
    ],
    techRealStack: [
      "Rust",
      "RISC Zero zkVM",
      "Solidity",
      "Custom consensus layer",
    ],
    excerpt: "Legitimate zkML research buried under 40 pages of tokenomics.",
    sections: [
      {
        heading: "The Pitch",
        body:    "Symbiont Chain claims to bring zero-knowledge machine learning proofs to the web4 stack. Unlike most projects in this space, they have actual engineers.",
      },
      {
        heading: "The Technical Audit",
        body:    "The zkML implementation is real. The RISC Zero integration is competently done. The GitHub has 847 commits over 18 months with identifiable contributors. This is a functioning research project.",
      },
      {
        heading: "The Problem",
        body:    "The whitepaper is 112 pages. The first 68 pages are tokenomics. The actual technical specification starts on page 69. The token has no clear utility beyond governance of a protocol that doesn't need governance. This is a research lab that decided to bolt a speculative asset onto itself.",
      },
      {
        heading: "The Verdict",
        body:    "The tech is real. The token is not necessary. Proceed with extreme caution and ignore everything after page 68.",
      },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getArticleBySlug(slug: string): Article | undefined {
  return ARTICLES.find((a) => a.slug === slug);
}
