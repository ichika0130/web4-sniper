package db

import (
	"context"
	"errors"
	"fmt"
	"regexp"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/web4sniper/api/internal/models"
)

// ─── Slug helpers ─────────────────────────────────────────────────────────────

var (
	reNonAlpha = regexp.MustCompile(`[^a-z0-9\s-]`)
	reSpaces   = regexp.MustCompile(`[\s-]+`)
)

func slugify(s string) string {
	s = strings.ToLower(s)
	s = reNonAlpha.ReplaceAllString(s, "")
	s = reSpaces.ReplaceAllString(s, "-")
	return strings.Trim(s, "-")
}

func strToPtr(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

func derefStr(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

// ─── Column list (must match scanProject order exactly) ───────────────────────

const projectCols = `id, name, slug, tagline, website_url, whitepaper_url, github_url,
    claimed_stack, real_stack, github_status, github_last_commit,
    vaporware_score, verdict, one_liner, funding_usd, kloc_shipped,
    created_at, updated_at`

// scanner is satisfied by both pgx.Row and pgx.Rows during iteration.
type scanner interface {
	Scan(dest ...any) error
}

// scanProject reads one project from a row into a Project struct.
// nil slices are normalised to empty slices for consistent JSON output.
func scanProject(s scanner) (models.Project, error) {
	var p models.Project
	if err := s.Scan(
		&p.ID, &p.Name, &p.Slug, &p.Tagline,
		&p.WebsiteURL, &p.WhitepaperURL, &p.GitHubURL,
		&p.ClaimedStack, &p.RealStack, &p.GitHubStatus, &p.GitHubLastCommit,
		&p.VaporwareScore, &p.Verdict, &p.OneLiner,
		&p.FundingUSD, &p.KLocShipped,
		&p.CreatedAt, &p.UpdatedAt,
	); err != nil {
		return models.Project{}, err
	}
	if p.ClaimedStack == nil {
		p.ClaimedStack = []string{}
	}
	if p.RealStack == nil {
		p.RealStack = []string{}
	}
	return p, nil
}

// ─── PGStore ──────────────────────────────────────────────────────────────────

// PGStore implements Store against a live pgxpool.
type PGStore struct {
	pool *pgxpool.Pool
}

// NewPGStore wraps an existing pool.
func NewPGStore(pool *pgxpool.Pool) *PGStore {
	return &PGStore{pool: pool}
}

// ─── Project queries ──────────────────────────────────────────────────────────

func (s *PGStore) GetAllProjects(ctx context.Context) ([]models.Project, error) {
	rows, err := s.pool.Query(ctx,
		"SELECT "+projectCols+" FROM projects ORDER BY created_at DESC",
	)
	if err != nil {
		return nil, fmt.Errorf("query projects: %w", err)
	}
	defer rows.Close()

	var projects []models.Project
	for rows.Next() {
		p, err := scanProject(rows)
		if err != nil {
			return nil, fmt.Errorf("scan project: %w", err)
		}
		projects = append(projects, p)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate projects: %w", err)
	}
	if projects == nil {
		projects = []models.Project{}
	}
	return projects, nil
}

func (s *PGStore) GetProjectBySlug(ctx context.Context, slug string) (*models.Project, error) {
	row := s.pool.QueryRow(ctx,
		"SELECT "+projectCols+" FROM projects WHERE slug = $1",
		slug,
	)
	p, err := scanProject(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("query project %q: %w", slug, err)
	}
	return &p, nil
}

func (s *PGStore) CreateProject(ctx context.Context, req models.CreateProjectRequest) (*models.Project, error) {
	slug := req.Slug
	if slug == "" {
		slug = slugify(req.Name)
	}

	row := s.pool.QueryRow(ctx,
		`INSERT INTO projects
		    (name, slug, tagline, website_url, whitepaper_url, github_url, claimed_stack, funding_usd)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		 RETURNING `+projectCols,
		req.Name,
		slug,
		strToPtr(req.Tagline),
		strToPtr(req.WebsiteURL),
		strToPtr(req.WhitepaperURL),
		strToPtr(req.GitHubURL),
		req.ClaimedStack,
		req.FundingUSD,
	)

	p, err := scanProject(row)
	if err != nil {
		return nil, fmt.Errorf("insert project: %w", err)
	}
	return &p, nil
}

func (s *PGStore) UpdateProject(ctx context.Context, slug string, req models.UpdateProjectRequest) (*models.Project, error) {
	clauses := []string{}
	args := []any{}
	i := 1

	if req.Name != nil {
		clauses = append(clauses, fmt.Sprintf("name = $%d", i))
		args = append(args, *req.Name)
		i++
	}
	if req.Tagline != nil {
		clauses = append(clauses, fmt.Sprintf("tagline = $%d", i))
		args = append(args, *req.Tagline)
		i++
	}
	if req.WebsiteURL != nil {
		clauses = append(clauses, fmt.Sprintf("website_url = $%d", i))
		args = append(args, *req.WebsiteURL)
		i++
	}
	if req.WhitepaperURL != nil {
		clauses = append(clauses, fmt.Sprintf("whitepaper_url = $%d", i))
		args = append(args, *req.WhitepaperURL)
		i++
	}
	if req.GithubURL != nil {
		clauses = append(clauses, fmt.Sprintf("github_url = $%d", i))
		args = append(args, *req.GithubURL)
		i++
	}
	if len(req.ClaimedStack) > 0 {
		clauses = append(clauses, fmt.Sprintf("claimed_stack = $%d", i))
		args = append(args, req.ClaimedStack)
		i++
	}
	if len(req.RealStack) > 0 {
		clauses = append(clauses, fmt.Sprintf("real_stack = $%d", i))
		args = append(args, req.RealStack)
		i++
	}
	if req.GithubStatus != nil {
		clauses = append(clauses, fmt.Sprintf("github_status = $%d", i))
		args = append(args, *req.GithubStatus)
		i++
	}
	// GitHubLastCommit: non-nil sets the timestamp; ClearGitHubLastCommit sets NULL.
	if req.GitHubLastCommit != nil {
		clauses = append(clauses, fmt.Sprintf("github_last_commit = $%d", i))
		args = append(args, *req.GitHubLastCommit)
		i++
	} else if req.ClearGitHubLastCommit {
		clauses = append(clauses, "github_last_commit = NULL")
	}
	if req.VaporwareScore != nil {
		clauses = append(clauses, fmt.Sprintf("vaporware_score = $%d", i))
		args = append(args, *req.VaporwareScore)
		i++
	}
	if req.Verdict != nil {
		clauses = append(clauses, fmt.Sprintf("verdict = $%d", i))
		args = append(args, *req.Verdict)
		i++
	}
	if req.OneLiner != nil {
		clauses = append(clauses, fmt.Sprintf("one_liner = $%d", i))
		args = append(args, *req.OneLiner)
		i++
	}
	if req.FundingUSD != nil {
		clauses = append(clauses, fmt.Sprintf("funding_usd = $%d", i))
		args = append(args, *req.FundingUSD)
		i++
	}
	if req.KlocShipped != nil {
		clauses = append(clauses, fmt.Sprintf("kloc_shipped = $%d", i))
		args = append(args, *req.KlocShipped)
		i++
	}

	// Nothing to update — return the current project state.
	if len(clauses) == 0 {
		return s.GetProjectBySlug(ctx, slug)
	}

	clauses = append(clauses, "updated_at = NOW()")
	args = append(args, slug)

	query := fmt.Sprintf(
		"UPDATE projects SET %s WHERE slug = $%d RETURNING %s",
		strings.Join(clauses, ", "),
		i,
		projectCols,
	)

	row := s.pool.QueryRow(ctx, query, args...)
	p, err := scanProject(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("update project %q: %w", slug, err)
	}
	return &p, nil
}

func (s *PGStore) DeleteProject(ctx context.Context, slug string) error {
	tag, err := s.pool.Exec(ctx, "DELETE FROM projects WHERE slug = $1", slug)
	if err != nil {
		return fmt.Errorf("delete project %q: %w", slug, err)
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

// ─── Stats query ──────────────────────────────────────────────────────────────

func (s *PGStore) GetStats(ctx context.Context) (*models.StatsResponse, error) {
	const q = `
		SELECT
		    COUNT(*)::INT                                                          AS total_projects,
		    COALESCE(AVG(vaporware_score), 0)::FLOAT8                             AS avg_vaporware_score,
		    COUNT(*) FILTER (WHERE github_status = 'DEAD')::INT                  AS dead_repos,
		    COUNT(*) FILTER (WHERE vaporware_score > 75)::INT                    AS confirmed_vaporware,
		    COUNT(*) FILTER (WHERE vaporware_score < 40 AND github_status = 'ACTIVE')::INT AS actually_shipping,
		    COALESCE(
		        (SELECT name FROM projects ORDER BY vaporware_score DESC LIMIT 1),
		        ''
		    )                                                                      AS snipe_of_the_week
		FROM projects`

	var st models.StatsResponse
	err := s.pool.QueryRow(ctx, q).Scan(
		&st.TotalProjects,
		&st.AvgVaporwareScore,
		&st.DeadRepos,
		&st.ConfirmedVaporware,
		&st.ActuallyShipping,
		&st.SnipeOfTheWeek,
	)
	if err != nil {
		return nil, fmt.Errorf("query stats: %w", err)
	}
	return &st, nil
}

// ─── Article queries ──────────────────────────────────────────────────────────

// articleJoinCols is the SELECT column list for the articles + projects JOIN.
// Order must match scanArticle exactly.
const articleJoinCols = `a.id, a.project_id, a.slug, a.title, a.author, a.body,
    a.published_at, a.is_published, a.created_at, a.updated_at,
    p.name AS project_name, p.slug AS project_slug,
    p.vaporware_score, p.verdict, p.one_liner,
    p.claimed_stack, p.real_stack`

const articleJoinFrom = `FROM articles a JOIN projects p ON a.project_id = p.id`

func scanArticle(s scanner) (models.Article, error) {
	var a models.Article
	err := s.Scan(
		&a.ID, &a.ProjectID, &a.Slug, &a.Title, &a.Author, &a.Body,
		&a.PublishedAt, &a.IsPublished, &a.CreatedAt, &a.UpdatedAt,
		&a.ProjectName, &a.ProjectSlug,
		&a.VaporwareScore, &a.Verdict, &a.OneLiner,
		&a.ClaimedStack, &a.RealStack,
	)
	if err != nil {
		return models.Article{}, err
	}
	if a.ClaimedStack == nil {
		a.ClaimedStack = []string{}
	}
	if a.RealStack == nil {
		a.RealStack = []string{}
	}
	return a, nil
}

func (s *PGStore) GetPublishedArticles(ctx context.Context) ([]models.Article, error) {
	q := "SELECT " + articleJoinCols + " " + articleJoinFrom +
		" WHERE a.is_published = TRUE ORDER BY a.published_at DESC"

	rows, err := s.pool.Query(ctx, q)
	if err != nil {
		return nil, fmt.Errorf("query articles: %w", err)
	}
	defer rows.Close()

	var articles []models.Article
	for rows.Next() {
		a, err := scanArticle(rows)
		if err != nil {
			return nil, fmt.Errorf("scan article: %w", err)
		}
		articles = append(articles, a)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate articles: %w", err)
	}
	if articles == nil {
		articles = []models.Article{}
	}
	return articles, nil
}

func (s *PGStore) GetArticleBySlug(ctx context.Context, slug string) (*models.Article, error) {
	q := "SELECT " + articleJoinCols + " " + articleJoinFrom + " WHERE a.slug = $1"
	row := s.pool.QueryRow(ctx, q, slug)
	a, err := scanArticle(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("query article %q: %w", slug, err)
	}
	return &a, nil
}

func (s *PGStore) CreateArticle(ctx context.Context, req models.CreateArticleRequest) (*models.Article, error) {
	slug := slugify(req.Title)
	body := req.Body
	if len(body) == 0 {
		body = []byte("[]")
	}

	// Parse project_id string → pgtype.UUID.
	var projectID pgtype.UUID
	if err := projectID.Scan(req.ProjectID); err != nil {
		return nil, fmt.Errorf("invalid project_id %q: %w", req.ProjectID, err)
	}

	const q = `
		WITH ins AS (
		    INSERT INTO articles (project_id, slug, title, author, body, published_at, is_published)
		    VALUES ($1, $2, $3, $4, $5,
		        CASE WHEN $6 THEN NOW() ELSE NULL END,
		        $6)
		    RETURNING id, project_id, slug, title, author, body,
		              published_at, is_published, created_at, updated_at
		)
		SELECT ins.id, ins.project_id, ins.slug, ins.title, ins.author, ins.body,
		       ins.published_at, ins.is_published, ins.created_at, ins.updated_at,
		       p.name AS project_name, p.slug AS project_slug,
		       p.vaporware_score, p.verdict, p.one_liner,
		       p.claimed_stack, p.real_stack
		FROM ins
		JOIN projects p ON ins.project_id = p.id`

	row := s.pool.QueryRow(ctx, q, projectID, slug, req.Title, req.Author, body, req.IsPublished)
	a, err := scanArticle(row)
	if err != nil {
		return nil, fmt.Errorf("insert article: %w", err)
	}
	return &a, nil
}

// ─── Buzzword queries ─────────────────────────────────────────────────────────

func (s *PGStore) GetBuzzwords(ctx context.Context) ([]models.BuzzwordEntry, error) {
	const q = `
		SELECT word, count FROM buzzwords
		WHERE week_start = date_trunc('week', NOW())
		ORDER BY count DESC
		LIMIT 10`

	rows, err := s.pool.Query(ctx, q)
	if err != nil {
		return nil, fmt.Errorf("query buzzwords: %w", err)
	}
	defer rows.Close()

	var entries []models.BuzzwordEntry
	for rows.Next() {
		var e models.BuzzwordEntry
		if err := rows.Scan(&e.Word, &e.Count); err != nil {
			return nil, fmt.Errorf("scan buzzword: %w", err)
		}
		entries = append(entries, e)
	}
	if entries == nil {
		entries = []models.BuzzwordEntry{}
	}
	return entries, rows.Err()
}

// ─── Buzzword upsert ──────────────────────────────────────────────────────────

// UpsertBuzzwords increments the count for each word in the current ISO week,
// inserting a new row when the word hasn't been seen before this week.
func (s *PGStore) UpsertBuzzwords(ctx context.Context, words []string) error {
	const q = `
		INSERT INTO buzzwords (word, count, week_start)
		VALUES ($1, 1, date_trunc('week', NOW()))
		ON CONFLICT (word, week_start)
		DO UPDATE SET count = buzzwords.count + 1`

	for _, w := range words {
		w = strings.ToLower(strings.TrimSpace(w))
		if w == "" {
			continue
		}
		if _, err := s.pool.Exec(ctx, q, w); err != nil {
			return fmt.Errorf("upsert buzzword %q: %w", w, err)
		}
	}
	return nil
}

// Compile-time assertion that PGStore satisfies Store.
var _ Store = (*PGStore)(nil)
