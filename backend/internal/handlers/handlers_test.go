package handlers_test

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"

	"github.com/web4sniper/api/internal/handlers"
	"github.com/web4sniper/api/internal/models"
)

// ─── Mock Store ───────────────────────────────────────────────────────────────

// mockStore is a test double that implements db.Store in-memory.
type mockStore struct {
	projects []models.Project
	statsErr error
}

func (m *mockStore) GetAllProjects(_ context.Context) ([]models.Project, error) {
	if m.projects == nil {
		return []models.Project{}, nil
	}
	return m.projects, nil
}

func (m *mockStore) GetProjectBySlug(_ context.Context, _ string) (*models.Project, error) {
	return nil, nil
}

func (m *mockStore) CreateProject(_ context.Context, _ models.CreateProjectRequest) (*models.Project, error) {
	return nil, nil
}

func (m *mockStore) UpdateProject(_ context.Context, _ string, _ models.UpdateProjectRequest) (*models.Project, error) {
	return nil, nil
}

func (m *mockStore) DeleteProject(_ context.Context, _ string) error {
	return nil
}

func (m *mockStore) GetStats(_ context.Context) (*models.StatsResponse, error) {
	if m.statsErr != nil {
		return nil, m.statsErr
	}
	return &models.StatsResponse{TotalProjects: 1, SnipeOfTheWeek: "Test"}, nil
}

func (m *mockStore) UpsertBuzzwords(_ context.Context, _ []string) error { return nil }

func (m *mockStore) GetPublishedArticles(_ context.Context) ([]models.Article, error) {
	return []models.Article{}, nil
}

func (m *mockStore) GetArticleBySlug(_ context.Context, _ string) (*models.Article, error) {
	return nil, nil
}

func (m *mockStore) CreateArticle(_ context.Context, _ models.CreateArticleRequest) (*models.Article, error) {
	return nil, nil
}

func (m *mockStore) GetBuzzwords(_ context.Context) ([]models.BuzzwordEntry, error) {
	return []models.BuzzwordEntry{}, nil
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

func newRouter(store *mockStore) *gin.Engine {
	gin.SetMode(gin.TestMode)
	h := handlers.New(store, nil, nil, nil)
	r := gin.New()
	r.GET("/api/v1/projects", h.ListProjects)
	r.GET("/api/v1/stats", h.GetStats)
	r.GET("/health", h.Health)
	return r
}

// ─── Tests ────────────────────────────────────────────────────────────────────

func TestListProjects_EmptyDB(t *testing.T) {
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/projects", nil)
	newRouter(&mockStore{}).ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("want status 200, got %d", w.Code)
	}
	var got []models.Project
	if err := json.Unmarshal(w.Body.Bytes(), &got); err != nil {
		t.Fatalf("response is not a valid JSON array: %v\nbody: %s", err, w.Body.String())
	}
	if len(got) != 0 {
		t.Errorf("expected 0 projects, got %d", len(got))
	}
}

func TestListProjects_ReturnsMockData(t *testing.T) {
	store := &mockStore{
		projects: []models.Project{
			{
				Name:         "Test Project",
				Slug:         "test-project",
				GitHubStatus: "ACTIVE",
				Verdict:      "UNKNOWN",
				ClaimedStack: []string{"Rust", "WASM"},
				RealStack:    []string{},
			},
		},
	}

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/projects", nil)
	newRouter(store).ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("want status 200, got %d", w.Code)
	}

	var got []models.Project
	if err := json.Unmarshal(w.Body.Bytes(), &got); err != nil {
		t.Fatalf("response is not a valid JSON array: %v\nbody: %s", err, w.Body.String())
	}
	if len(got) != 1 {
		t.Fatalf("expected 1 project, got %d", len(got))
	}
	if got[0].Slug != "test-project" {
		t.Errorf("expected slug %q, got %q", "test-project", got[0].Slug)
	}
	if got[0].Name != "Test Project" {
		t.Errorf("expected name %q, got %q", "Test Project", got[0].Name)
	}
}

func TestHealth(t *testing.T) {
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	newRouter(&mockStore{}).ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("want 200, got %d", w.Code)
	}
	var body map[string]string
	if err := json.Unmarshal(w.Body.Bytes(), &body); err != nil {
		t.Fatalf("invalid JSON: %v", err)
	}
	if body["status"] != "ok" {
		t.Errorf("expected status=ok, got %q", body["status"])
	}
}
