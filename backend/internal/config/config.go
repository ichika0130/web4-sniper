package config

import (
	"fmt"
	"os"

	"github.com/joho/godotenv"
)

// Config holds all application configuration loaded from environment variables.
type Config struct {
	DatabaseURL string
	Port        string
	GeminiAPIKey string
	GitHubToken  string
	FrontendURL  string
}

// Load reads .env (if present) then populates Config from environment variables.
// Missing required fields return an error.
func Load() (*Config, error) {
	// .env is optional; ignore the error if the file doesn't exist.
	_ = godotenv.Load()

	cfg := &Config{
		DatabaseURL:  os.Getenv("DATABASE_URL"),
		Port:         os.Getenv("PORT"),
		GeminiAPIKey: os.Getenv("GEMINI_API_KEY"),
		GitHubToken:  os.Getenv("GITHUB_TOKEN"),
		FrontendURL:  os.Getenv("FRONTEND_URL"),
	}

	if cfg.DatabaseURL == "" {
		return nil, fmt.Errorf("DATABASE_URL is required")
	}
	if cfg.Port == "" {
		cfg.Port = "8080"
	}
	if cfg.FrontendURL == "" {
		cfg.FrontendURL = "http://localhost:3000"
	}

	return cfg, nil
}
