package handlers

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	"github.com/web4sniper/api/internal/ai"
	"github.com/web4sniper/api/internal/db"
	"github.com/web4sniper/api/internal/models"
)

// GitHubScraper is the interface the admin scrape endpoint depends on.
// Satisfied by *github.Scraper without an explicit import.
type GitHubScraper interface {
	ScrapeAll(ctx context.Context) (int, error)
}

// Handler bundles shared dependencies for all route handlers.
type Handler struct {
	Store    db.Store
	Analyzer ai.Analyzer
	Fetcher  *ai.Fetcher
	Scraper  GitHubScraper // may be nil when scraper is not configured
}

// New constructs a Handler.
func New(store db.Store, analyzer ai.Analyzer, fetcher *ai.Fetcher, scraper GitHubScraper) *Handler {
	return &Handler{Store: store, Analyzer: analyzer, Fetcher: fetcher, Scraper: scraper}
}

// ─── Health ───────────────────────────────────────────────────────────────────

func (h *Handler) Health(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":  "ok",
		"version": "0.1.0",
	})
}

// ─── Projects ─────────────────────────────────────────────────────────────────

// ListProjects  GET /api/v1/projects
func (h *Handler) ListProjects(c *gin.Context) {
	projects, err := h.Store.GetAllProjects(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, projects)
}

// GetProject  GET /api/v1/projects/:slug
func (h *Handler) GetProject(c *gin.Context) {
	slug := c.Param("slug")
	project, err := h.Store.GetProjectBySlug(c.Request.Context(), slug)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if project == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "project not found"})
		return
	}
	c.JSON(http.StatusOK, project)
}

// CreateProject  POST /api/v1/projects
func (h *Handler) CreateProject(c *gin.Context) {
	var req models.CreateProjectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	project, err := h.Store.CreateProject(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, project)
}

// UpdateProject  PUT /api/v1/projects/:slug
func (h *Handler) UpdateProject(c *gin.Context) {
	slug := c.Param("slug")
	var req models.UpdateProjectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	project, err := h.Store.UpdateProject(c.Request.Context(), slug, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if project == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "project not found"})
		return
	}
	c.JSON(http.StatusOK, project)
}

// DeleteProject  DELETE /api/v1/projects/:slug
func (h *Handler) DeleteProject(c *gin.Context) {
	slug := c.Param("slug")
	err := h.Store.DeleteProject(c.Request.Context(), slug)
	if errors.Is(err, db.ErrNotFound) {
		c.JSON(http.StatusNotFound, gin.H{"error": "project not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}

// AnalyzeProject  POST /api/v1/projects/:slug/analyze
func (h *Handler) AnalyzeProject(c *gin.Context) {
	if h.Analyzer == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "AI analyzer not configured (GEMINI_API_KEY missing)"})
		return
	}

	slug := c.Param("slug")
	ctx := c.Request.Context()

	project, err := h.Store.GetProjectBySlug(ctx, slug)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if project == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "project not found"})
		return
	}

	// Build the text to analyse. If a whitepaper URL is available and a
	// Fetcher is configured, fetch the full document; otherwise fall back to
	// the project metadata summary.
	text := fmt.Sprintf(
		"Project: %s\nTagline: %s\nClaimed Stack: %s",
		project.Name,
		derefStr(project.Tagline),
		strings.Join(project.ClaimedStack, ", "),
	)
	if h.Fetcher != nil && project.WhitepaperURL != nil && *project.WhitepaperURL != "" {
		fetched, fetchErr := h.Fetcher.FetchText(ctx, *project.WhitepaperURL)
		if fetchErr == nil && fetched != "" {
			text = fetched
		}
		// Non-fatal: log and continue with metadata summary.
	}

	result, err := h.Analyzer.AnalyzeWhitepaper(ctx, text)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Upsert buzzwords for trend tracking (best-effort).
	if len(result.Buzzwords) > 0 {
		_ = h.Store.UpsertBuzzwords(ctx, result.Buzzwords)
	}

	updateReq := models.UpdateProjectRequest{
		VaporwareScore: &result.VaporwareScore,
		Verdict:        &result.Verdict,
		RealStack:      result.RealStack,
		OneLiner:       &result.OneLiner,
	}

	updated, err := h.Store.UpdateProject(ctx, slug, updateReq)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, updated)
}

// ─── Articles ─────────────────────────────────────────────────────────────────

// ListArticles  GET /api/v1/articles
func (h *Handler) ListArticles(c *gin.Context) {
	articles, err := h.Store.GetPublishedArticles(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, articles)
}

// GetArticle  GET /api/v1/articles/:slug
func (h *Handler) GetArticle(c *gin.Context) {
	slug := c.Param("slug")
	article, err := h.Store.GetArticleBySlug(c.Request.Context(), slug)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if article == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "article not found"})
		return
	}
	c.JSON(http.StatusOK, article)
}

// CreateArticle  POST /api/v1/articles
func (h *Handler) CreateArticle(c *gin.Context) {
	var req models.CreateArticleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	article, err := h.Store.CreateArticle(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, article)
}

// ─── Stats ────────────────────────────────────────────────────────────────────

// GetStats  GET /api/v1/stats
func (h *Handler) GetStats(c *gin.Context) {
	stats, err := h.Store.GetStats(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, stats)
}

// ─── Buzzwords ────────────────────────────────────────────────────────────────

// ListBuzzwords  GET /api/v1/buzzwords
func (h *Handler) ListBuzzwords(c *gin.Context) {
	words, err := h.Store.GetBuzzwords(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, words)
}

// ─── Admin ────────────────────────────────────────────────────────────────────

// TriggerScrape  POST /api/v1/admin/scrape
// Immediately runs ScrapeAll and returns the count of projects updated.
func (h *Handler) TriggerScrape(c *gin.Context) {
	if h.Scraper == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "scraper not configured"})
		return
	}
	n, err := h.Scraper.ScrapeAll(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"message":          "scrape triggered",
		"projects_scraped": n,
	})
}

// ─── Private helpers ──────────────────────────────────────────────────────────

func derefStr(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}
