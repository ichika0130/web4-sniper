// ─── Config ───────────────────────────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

// ─── Types ────────────────────────────────────────────────────────────────────

export type GithubStatus = "ACTIVE" | "STALE" | "DEAD" | "UNKNOWN";
export type Verdict = "VAPORWARE" | "SUSPICIOUS" | "LEGITIMATE" | "UNKNOWN";

export interface Project {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  website_url: string | null;
  github_url: string | null;
  claimed_stack: string[];
  real_stack: string[];
  github_status: GithubStatus;
  vaporware_score: number;
  verdict: Verdict;
  one_liner: string | null;
  funding_usd: number | null;
  kloc_shipped: number | null;
}

export interface ArticleSection {
  heading: string;
  body: string;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  author: string;
  body: ArticleSection[];
  published_at: string | null;
  project_name: string;
  project_slug: string;
  vaporware_score: number;
  verdict: Verdict;
  one_liner: string | null;
  claimed_stack: string[];
  real_stack: string[];
}

export interface Stats {
  total_projects: number;
  avg_vaporware_score: number;
  dead_repos: number;
  confirmed_vaporware: number;
  actually_shipping: number;
  snipe_of_the_week: string;
}

export interface Buzzword {
  word: string;
  count: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

// ─── Fetch helpers ────────────────────────────────────────────────────────────

const FETCH_OPTS = { next: { revalidate: 300 } } as const;

async function apiFetch<T>(path: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(`${API_BASE}${path}`, FETCH_OPTS);
    if (!res.ok) {
      console.warn(`[api] ${path} returned ${res.status}`);
      return fallback;
    }
    return res.json() as Promise<T>;
  } catch (err) {
    console.warn(`[api] fetch ${path} failed:`, err);
    return fallback;
  }
}

function emptyPage<T>(limit: number, offset: number): PaginatedResponse<T> {
  return { data: [], total: 0, limit, offset, has_more: false };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function getStats(): Promise<Stats> {
  return apiFetch<Stats>("/api/v1/stats", {
    total_projects: 0,
    avg_vaporware_score: 0,
    dead_repos: 0,
    confirmed_vaporware: 0,
    actually_shipping: 0,
    snipe_of_the_week: "",
  });
}

export async function getProjects(
  limit = 50,
  offset = 0,
): Promise<PaginatedResponse<Project>> {
  return apiFetch<PaginatedResponse<Project>>(
    `/api/v1/projects?limit=${limit}&offset=${offset}`,
    emptyPage<Project>(limit, offset),
  );
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  return apiFetch<Project | null>(`/api/v1/projects/${slug}`, null);
}

export async function getArticles(
  limit = 50,
  offset = 0,
): Promise<PaginatedResponse<Article>> {
  return apiFetch<PaginatedResponse<Article>>(
    `/api/v1/articles?limit=${limit}&offset=${offset}`,
    emptyPage<Article>(limit, offset),
  );
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/articles/${slug}`, FETCH_OPTS);
    if (res.status === 404) return null;
    if (!res.ok) {
      console.warn(`[api] /api/v1/articles/${slug} returned ${res.status}`);
      return null;
    }
    return res.json() as Promise<Article>;
  } catch (err) {
    console.warn(`[api] fetch article ${slug} failed:`, err);
    return null;
  }
}

export async function getBuzzwords(): Promise<Buzzword[]> {
  return apiFetch<Buzzword[]>("/api/v1/buzzwords", []);
}
