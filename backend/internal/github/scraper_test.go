package github

import (
	"context"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/web4sniper/api/internal/models"
)

// ─── Test helpers ─────────────────────────────────────────────────────────────

func ptr[T any](v T) *T { return &v }

// testStore implements db.Store in-memory for the scraper tests.
type testStore struct {
	projects    []models.Project
	updateCalls []models.UpdateProjectRequest
}

func (s *testStore) GetAllProjects(_ context.Context) ([]models.Project, error) {
	return s.projects, nil
}
func (s *testStore) GetProjectBySlug(_ context.Context, _ string) (*models.Project, error) {
	return nil, nil
}
func (s *testStore) CreateProject(_ context.Context, _ models.CreateProjectRequest) (*models.Project, error) {
	return nil, nil
}
func (s *testStore) UpdateProject(_ context.Context, slug string, req models.UpdateProjectRequest) (*models.Project, error) {
	s.updateCalls = append(s.updateCalls, req)
	return &models.Project{Slug: slug, ClaimedStack: []string{}, RealStack: []string{}}, nil
}
func (s *testStore) DeleteProject(_ context.Context, _ string) error { return nil }
func (s *testStore) GetStats(_ context.Context) (*models.StatsResponse, error) {
	return &models.StatsResponse{}, nil
}
func (s *testStore) UpsertBuzzwords(_ context.Context, _ []string) error { return nil }

func (s *testStore) GetPublishedArticles(_ context.Context) ([]models.Article, error) {
	return []models.Article{}, nil
}

func (s *testStore) GetArticleBySlug(_ context.Context, _ string) (*models.Article, error) {
	return nil, nil
}

func (s *testStore) CreateArticle(_ context.Context, _ models.CreateArticleRequest) (*models.Article, error) {
	return nil, nil
}

func (s *testStore) GetBuzzwords(_ context.Context) ([]models.BuzzwordEntry, error) {
	return []models.BuzzwordEntry{}, nil
}

// commitResponse builds a minimal GitHub commits JSON payload with one entry.
func commitResponse(date time.Time) string {
	return fmt.Sprintf(
		`[{"commit":{"committer":{"date":"%s"}}}]`,
		date.UTC().Format(time.RFC3339),
	)
}

// newFixedServer returns an httptest.Server that always responds with the given
// status code and body.
func newFixedServer(code int, body string) *httptest.Server {
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(code)
		fmt.Fprint(w, body)
	}))
}

// testProject builds a minimal Project with the given github_url.
func testProject(githubURL string) models.Project {
	return models.Project{
		Slug:         "test-project",
		GitHubURL:    ptr(githubURL),
		ClaimedStack: []string{},
		RealStack:    []string{},
	}
}

// ─── Tests ────────────────────────────────────────────────────────────────────

// Test 1: recent commit → ACTIVE
func TestScrapeRepo_Active(t *testing.T) {
	now := time.Now().UTC()
	srv := newFixedServer(http.StatusOK, commitResponse(now))
	defer srv.Close()

	store := &testStore{projects: []models.Project{testProject("https://github.com/owner/repo")}}
	scraper := newScraperWithBase(store, "", srv.URL)

	scraped, err := scraper.ScrapeAll(context.Background())
	if err != nil {
		t.Fatalf("ScrapeAll error: %v", err)
	}
	if scraped != 1 {
		t.Fatalf("expected 1 scraped, got %d", scraped)
	}
	if len(store.updateCalls) != 1 {
		t.Fatalf("expected 1 UpdateProject call, got %d", len(store.updateCalls))
	}

	got := store.updateCalls[0]
	if got.GithubStatus == nil || *got.GithubStatus != "ACTIVE" {
		t.Errorf("expected ACTIVE, got %v", got.GithubStatus)
	}
	if got.GitHubLastCommit == nil {
		t.Error("expected non-nil GitHubLastCommit")
	}
}

// Test 2: commit 45 days ago → STALE
func TestScrapeRepo_Stale(t *testing.T) {
	staleDate := time.Now().UTC().Add(-45 * 24 * time.Hour)
	srv := newFixedServer(http.StatusOK, commitResponse(staleDate))
	defer srv.Close()

	store := &testStore{projects: []models.Project{testProject("https://github.com/owner/repo")}}
	scraper := newScraperWithBase(store, "", srv.URL)

	if _, err := scraper.ScrapeAll(context.Background()); err != nil {
		t.Fatalf("ScrapeAll error: %v", err)
	}
	if len(store.updateCalls) != 1 {
		t.Fatalf("expected 1 UpdateProject call, got %d", len(store.updateCalls))
	}

	got := store.updateCalls[0]
	if got.GithubStatus == nil || *got.GithubStatus != "STALE" {
		t.Errorf("expected STALE, got %v", got.GithubStatus)
	}
}

// Test 3: 404 from GitHub → DEAD, last_commit cleared
func TestScrapeRepo_Dead(t *testing.T) {
	srv := newFixedServer(http.StatusNotFound, `{"message":"Not Found"}`)
	defer srv.Close()

	store := &testStore{projects: []models.Project{testProject("https://github.com/owner/repo")}}
	scraper := newScraperWithBase(store, "", srv.URL)

	if _, err := scraper.ScrapeAll(context.Background()); err != nil {
		t.Fatalf("ScrapeAll error: %v", err)
	}
	if len(store.updateCalls) != 1 {
		t.Fatalf("expected 1 UpdateProject call, got %d", len(store.updateCalls))
	}

	got := store.updateCalls[0]
	if got.GithubStatus == nil || *got.GithubStatus != "DEAD" {
		t.Errorf("expected DEAD, got %v", got.GithubStatus)
	}
	if got.GitHubLastCommit != nil {
		t.Errorf("expected nil GitHubLastCommit for DEAD project, got %v", got.GitHubLastCommit)
	}
	if !got.ClearGitHubLastCommit {
		t.Error("expected ClearGitHubLastCommit = true for DEAD project")
	}
}

// Test 4: 403 rate limit → no UpdateProject call, no error returned
func TestScrapeRepo_RateLimited(t *testing.T) {
	srv := newFixedServer(http.StatusForbidden, `{"message":"rate limit exceeded"}`)
	defer srv.Close()

	store := &testStore{projects: []models.Project{testProject("https://github.com/owner/repo")}}
	scraper := newScraperWithBase(store, "", srv.URL)

	scraped, err := scraper.ScrapeAll(context.Background())
	if err != nil {
		t.Fatalf("ScrapeAll should not return error on rate limit, got: %v", err)
	}
	if scraped != 0 {
		t.Errorf("expected 0 scraped (rate limited), got %d", scraped)
	}
	if len(store.updateCalls) != 0 {
		t.Errorf("expected no UpdateProject calls on rate limit, got %d", len(store.updateCalls))
	}
}

// Test 5: project with no github_url is skipped entirely
func TestScrapeAll_SkipsProjectsWithoutGitHubURL(t *testing.T) {
	srv := newFixedServer(http.StatusOK, `[]`)
	defer srv.Close()

	store := &testStore{projects: []models.Project{
		{Slug: "no-url", ClaimedStack: []string{}, RealStack: []string{}},
	}}
	scraper := newScraperWithBase(store, "", srv.URL)

	scraped, err := scraper.ScrapeAll(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	if scraped != 0 {
		t.Errorf("expected 0 scraped, got %d", scraped)
	}
	if len(store.updateCalls) != 0 {
		t.Errorf("expected no UpdateProject calls, got %d", len(store.updateCalls))
	}
}
