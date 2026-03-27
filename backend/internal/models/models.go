package models

import (
	"encoding/json"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
)

// Project represents a tracked Web4 project.
type Project struct {
	ID               pgtype.UUID `db:"id"                json:"id"`
	Name             string      `db:"name"              json:"name"`
	Slug             string      `db:"slug"              json:"slug"`
	Tagline          *string     `db:"tagline"           json:"tagline,omitempty"`
	WebsiteURL       *string     `db:"website_url"       json:"website_url,omitempty"`
	WhitepaperURL    *string     `db:"whitepaper_url"    json:"whitepaper_url,omitempty"`
	GitHubURL        *string     `db:"github_url"        json:"github_url,omitempty"`
	ClaimedStack     []string    `db:"claimed_stack"     json:"claimed_stack"`
	RealStack        []string    `db:"real_stack"        json:"real_stack"`
	GitHubStatus     string      `db:"github_status"     json:"github_status"`
	GitHubLastCommit *time.Time  `db:"github_last_commit" json:"github_last_commit,omitempty"`
	VaporwareScore   int         `db:"vaporware_score"   json:"vaporware_score"`
	Verdict          string      `db:"verdict"           json:"verdict"`
	OneLiner         *string     `db:"one_liner"         json:"one_liner,omitempty"`
	FundingUSD       *float64    `db:"funding_usd"       json:"funding_usd,omitempty"`
	KLocShipped      *float64    `db:"kloc_shipped"      json:"kloc_shipped,omitempty"`
	CreatedAt        time.Time   `db:"created_at"        json:"created_at"`
	UpdatedAt        time.Time   `db:"updated_at"        json:"updated_at"`
}

// ArticleSection is one content block inside an article body.
type ArticleSection struct {
	Heading string `json:"heading"`
	Body    string `json:"body"`
}

// Article represents a published teardown article.
// Fields below the blank line are populated via JOIN with projects.
type Article struct {
	ID          pgtype.UUID     `db:"id"           json:"id"`
	ProjectID   *pgtype.UUID    `db:"project_id"   json:"project_id,omitempty"`
	Slug        string          `db:"slug"         json:"slug"`
	Title       string          `db:"title"        json:"title"`
	Author      string          `db:"author"       json:"author"`
	Body        json.RawMessage `db:"body"         json:"body"`
	PublishedAt *time.Time      `db:"published_at" json:"published_at,omitempty"`
	IsPublished bool            `db:"is_published" json:"is_published"`
	CreatedAt   time.Time       `db:"created_at"   json:"created_at"`
	UpdatedAt   time.Time       `db:"updated_at"   json:"updated_at"`

	ProjectName    string   `db:"project_name"    json:"project_name"`
	ProjectSlug    string   `db:"project_slug"    json:"project_slug"`
	VaporwareScore int      `db:"vaporware_score" json:"vaporware_score"`
	Verdict        string   `db:"verdict"         json:"verdict"`
	OneLiner       *string  `db:"one_liner"       json:"one_liner,omitempty"`
	ClaimedStack   []string `db:"claimed_stack"   json:"claimed_stack"`
	RealStack      []string `db:"real_stack"      json:"real_stack"`
}

// Buzzword tracks how often a term appears across whitepapers in a given week.
type Buzzword struct {
	ID        pgtype.UUID `db:"id"         json:"id"`
	Word      string      `db:"word"        json:"word"`
	Count     int         `db:"count"       json:"count"`
	WeekStart time.Time   `db:"week_start"  json:"week_start"`
}

// ─── Request / Response DTOs ──────────────────────────────────────────────────

// CreateProjectRequest is the body expected when creating a new project.
// Slug is optional — auto-generated from Name when omitted.
type CreateProjectRequest struct {
	Name          string   `json:"name"           binding:"required"`
	Slug          string   `json:"slug"`
	Tagline       string   `json:"tagline"`
	WebsiteURL    string   `json:"website_url"`
	WhitepaperURL string   `json:"whitepaper_url"`
	GitHubURL     string   `json:"github_url"`
	ClaimedStack  []string `json:"claimed_stack"`
	FundingUSD    *float64 `json:"funding_usd"`
}

// UpdateProjectRequest uses pointer fields so only provided values are updated.
// ClearGitHubLastCommit is an internal flag (json:"-") used by the scraper to
// explicitly set github_last_commit = NULL (e.g. after a 404 from GitHub API).
type UpdateProjectRequest struct {
	Name                  *string    `json:"name"`
	Tagline               *string    `json:"tagline"`
	WebsiteURL            *string    `json:"website_url"`
	WhitepaperURL         *string    `json:"whitepaper_url"`
	GithubURL             *string    `json:"github_url"`
	ClaimedStack          []string   `json:"claimed_stack"`
	RealStack             []string   `json:"real_stack"`
	GithubStatus          *string    `json:"github_status"`
	GitHubLastCommit      *time.Time `json:"github_last_commit"`
	ClearGitHubLastCommit bool       `json:"-"`
	VaporwareScore        *int       `json:"vaporware_score"`
	Verdict               *string    `json:"verdict"`
	OneLiner              *string    `json:"one_liner"`
	FundingUSD            *float64   `json:"funding_usd"`
	KlocShipped           *float64   `json:"kloc_shipped"`
}

// CreateArticleRequest is the body expected when creating a new article.
type CreateArticleRequest struct {
	ProjectID   string          `json:"project_id"   binding:"required"`
	Title       string          `json:"title"        binding:"required"`
	Author      string          `json:"author"       binding:"required"`
	Body        json.RawMessage `json:"body"`
	IsPublished bool            `json:"is_published"`
}

// BuzzwordEntry is the response DTO for GET /api/v1/buzzwords.
type BuzzwordEntry struct {
	Word  string `json:"word"`
	Count int    `json:"count"`
}

// StatsResponse is returned by GET /api/v1/stats.
type StatsResponse struct {
	TotalProjects      int     `json:"total_projects"`
	AvgVaporwareScore  float64 `json:"avg_vaporware_score"`
	DeadRepos          int     `json:"dead_repos"`
	ConfirmedVaporware int     `json:"confirmed_vaporware"`
	ActuallyShipping   int     `json:"actually_shipping"`
	SnipeOfTheWeek     string  `json:"snipe_of_the_week"`
}
