package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/web4sniper/api/internal/ai"
	"github.com/web4sniper/api/internal/config"
	"github.com/web4sniper/api/internal/db"
	"github.com/web4sniper/api/internal/github"
	"github.com/web4sniper/api/internal/routes"
)

func main() {
	// ── Config ────────────────────────────────────────────────────────────────
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("config: %v", err)
	}

	// ── Database ──────────────────────────────────────────────────────────────
	pool, err := db.Connect(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("database: %v", err)
	}
	defer pool.Close()
	log.Println("database: connected")

	store := db.NewPGStore(pool)

	// ── AI Analyzer ───────────────────────────────────────────────────────────
	// Analyzer is optional — if no API key is set the server starts normally
	// but POST /api/v1/projects/:slug/analyze will return 503.
	var analyzer ai.Analyzer
	if cfg.GeminiAPIKey != "" {
		gemini, err := ai.NewGeminiAnalyzer(context.Background(), cfg.GeminiAPIKey)
		if err != nil {
			log.Fatalf("ai: %v", err)
		}
		defer gemini.Close()
		analyzer = gemini
	} else {
		log.Println("ai: GEMINI_API_KEY not set — analyze endpoint disabled")
	}

	// ── GitHub Scraper & Scheduler ────────────────────────────────────────────
	scraper := github.NewScraper(store, cfg.GitHubToken)
	githubCron := github.StartScheduler(scraper, "0 */6 * * *")
	defer githubCron.Stop()

	// ── Router ────────────────────────────────────────────────────────────────
	router := routes.Setup(pool, analyzer, scraper, cfg.FrontendURL)

	// ── HTTP Server ───────────────────────────────────────────────────────────
	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		log.Printf("server: listening on :%s", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("server: %v", err)
		}
	}()

	// ── Graceful Shutdown ─────────────────────────────────────────────────────
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("server: shutting down…")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("server: forced shutdown: %v", err)
	}
	log.Println("server: stopped")
}
