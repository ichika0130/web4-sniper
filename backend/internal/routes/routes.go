package routes

import (
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/web4sniper/api/internal/ai"
	"github.com/web4sniper/api/internal/db"
	"github.com/web4sniper/api/internal/handlers"
)

// Setup wires up CORS, middleware, and all route groups.
// scraper may be nil (the TriggerScrape handler handles that gracefully).
func Setup(
	pool        *pgxpool.Pool,
	analyzer    ai.Analyzer,
	scraper     handlers.GitHubScraper,
	frontendURL string,
) *gin.Engine {
	r := gin.New()
	r.Use(gin.Logger())
	r.Use(gin.Recovery())

	// ── CORS ──────────────────────────────────────────────────────────────────
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{frontendURL},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	h := handlers.New(db.NewPGStore(pool), analyzer, ai.NewFetcher(), scraper)

	// ── Health ────────────────────────────────────────────────────────────────
	r.GET("/health", h.Health)

	// ── API v1 ────────────────────────────────────────────────────────────────
	v1 := r.Group("/api/v1")
	{
		// Projects
		projects := v1.Group("/projects")
		{
			projects.GET("",                h.ListProjects)
			projects.POST("",               h.CreateProject)
			projects.GET("/:slug",          h.GetProject)
			projects.PUT("/:slug",          h.UpdateProject)
			projects.DELETE("/:slug",       h.DeleteProject)
			projects.POST("/:slug/analyze", h.AnalyzeProject)
		}

		// Articles
		articles := v1.Group("/articles")
		{
			articles.GET("",       h.ListArticles)
			articles.POST("",      h.CreateArticle)
			articles.GET("/:slug", h.GetArticle)
		}

		// Stats
		v1.GET("/stats", h.GetStats)

		// Buzzwords
		v1.GET("/buzzwords", h.ListBuzzwords)

		// Admin
		admin := v1.Group("/admin")
		{
			admin.POST("/scrape", h.TriggerScrape)
		}
	}

	return r
}
