package db

import (
	"context"
	"errors"

	"github.com/web4sniper/api/internal/models"
)

// ErrNotFound is returned when a requested record does not exist.
var ErrNotFound = errors.New("record not found")

// Store abstracts all database operations, enabling handler tests without
// a live Postgres connection.
type Store interface {
	GetAllProjects(ctx context.Context) ([]models.Project, error)
	GetProjectBySlug(ctx context.Context, slug string) (*models.Project, error)
	CreateProject(ctx context.Context, req models.CreateProjectRequest) (*models.Project, error)
	UpdateProject(ctx context.Context, slug string, req models.UpdateProjectRequest) (*models.Project, error)
	DeleteProject(ctx context.Context, slug string) error
	GetStats(ctx context.Context) (*models.StatsResponse, error)
	UpsertBuzzwords(ctx context.Context, words []string) error
	GetPublishedArticles(ctx context.Context) ([]models.Article, error)
	GetArticleBySlug(ctx context.Context, slug string) (*models.Article, error)
	CreateArticle(ctx context.Context, req models.CreateArticleRequest) (*models.Article, error)
	GetBuzzwords(ctx context.Context) ([]models.BuzzwordEntry, error)
}
