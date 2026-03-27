package github

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/web4sniper/api/internal/db"
	"github.com/web4sniper/api/internal/models"
)

// ErrRateLimited is returned when the GitHub API responds with 403 or 429.
var ErrRateLimited = errors.New("github: rate limited")

// thresholds for deriving GitHub status from commit age.
const (
	deadThreshold  = 90 * 24 * time.Hour
	staleThreshold = 30 * 24 * time.Hour
)

// ─── GitHub API response shapes ───────────────────────────────────────────────

type ghCommit struct {
	Commit struct {
		Committer struct {
			Date time.Time `json:"date"`
		} `json:"committer"`
	} `json:"commit"`
}

// ─── Scraper ──────────────────────────────────────────────────────────────────

// Scraper polls GitHub for commit activity and updates project records.
type Scraper struct {
	store   db.Store
	token   string
	client  *http.Client
	apiBase string            // default: "https://api.github.com"
	sleep   func(time.Duration) // injectable for tests
}

// NewScraper creates a production Scraper backed by the GitHub REST API.
func NewScraper(store db.Store, token string) *Scraper {
	return &Scraper{
		store:   store,
		token:   token,
		client:  &http.Client{Timeout: 10 * time.Second},
		apiBase: "https://api.github.com",
		sleep:   time.Sleep,
	}
}

// newScraperWithBase creates a Scraper with a custom API base URL and a no-op
// sleep function — used only in tests.
func newScraperWithBase(store db.Store, token, apiBase string) *Scraper {
	return &Scraper{
		store:   store,
		token:   token,
		client:  &http.Client{Timeout: 5 * time.Second},
		apiBase: apiBase,
		sleep:   func(time.Duration) {}, // instant in tests
	}
}

// ScrapeAll fetches all projects that have a GitHub URL and updates their
// status. Returns the number of projects successfully scraped.
func (s *Scraper) ScrapeAll(ctx context.Context) (int, error) {
	projects, err := s.store.GetAllProjects(ctx)
	if err != nil {
		return 0, fmt.Errorf("scraper: fetch projects: %w", err)
	}

	var scraped, errCount int
	for _, p := range projects {
		if p.GitHubURL == nil || *p.GitHubURL == "" {
			continue
		}

		if err := s.scrapeRepo(ctx, p); err != nil {
			if errors.Is(err, ErrRateLimited) {
				log.Printf("scraper: rate limited on %s — skipping", p.Slug)
			} else {
				log.Printf("scraper: error on %s: %v", p.Slug, err)
				errCount++
			}
		} else {
			scraped++
		}

		s.sleep(time.Second) // 1s between requests to respect rate limits
	}

	log.Printf("scraper: finished — scraped %d projects, %d errors", scraped, errCount)
	return scraped, nil
}

// scrapeRepo fetches the latest commit for one project's GitHub URL and
// updates the project's github_status and github_last_commit.
func (s *Scraper) scrapeRepo(ctx context.Context, p models.Project) error {
	owner, repo, err := parseGitHubURL(*p.GitHubURL)
	if err != nil {
		return fmt.Errorf("parse github url for %s: %w", p.Slug, err)
	}

	url := fmt.Sprintf("%s/repos/%s/%s/commits?per_page=1", s.apiBase, owner, repo)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return fmt.Errorf("build request: %w", err)
	}
	req.Header.Set("Accept", "application/vnd.github.v3+json")
	req.Header.Set("X-GitHub-Api-Version", "2022-11-28")
	if s.token != "" {
		req.Header.Set("Authorization", "Bearer "+s.token)
	}

	resp, err := s.client.Do(req)
	if err != nil {
		return fmt.Errorf("http request for %s/%s: %w", owner, repo, err)
	}
	defer resp.Body.Close()

	// Rate limited — do not update, caller logs and skips.
	if resp.StatusCode == http.StatusForbidden || resp.StatusCode == http.StatusTooManyRequests {
		return ErrRateLimited
	}

	// Repo not found → mark DEAD, clear last commit.
	if resp.StatusCode == http.StatusNotFound {
		dead := "DEAD"
		return s.updateGitHubFields(ctx, p.Slug, dead, nil, true)
	}

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("unexpected status %d for %s/%s", resp.StatusCode, owner, repo)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("read response body: %w", err)
	}

	var commits []ghCommit
	if err := json.Unmarshal(body, &commits); err != nil {
		return fmt.Errorf("unmarshal commits: %w", err)
	}

	if len(commits) == 0 {
		// Repo exists but has no commits — treat as DEAD.
		dead := "DEAD"
		return s.updateGitHubFields(ctx, p.Slug, dead, nil, true)
	}

	commitDate := commits[0].Commit.Committer.Date
	status := commitStatus(commitDate)
	return s.updateGitHubFields(ctx, p.Slug, status, &commitDate, false)
}

// updateGitHubFields persists github_status and github_last_commit.
func (s *Scraper) updateGitHubFields(
	ctx context.Context,
	slug, status string,
	lastCommit *time.Time,
	clearCommit bool,
) error {
	req := models.UpdateProjectRequest{
		GithubStatus:          &status,
		GitHubLastCommit:      lastCommit,
		ClearGitHubLastCommit: clearCommit,
	}
	_, err := s.store.UpdateProject(ctx, slug, req)
	return err
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// parseGitHubURL extracts the owner and repo name from a GitHub URL.
// Handles trailing slashes and .git suffixes.
func parseGitHubURL(rawURL string) (owner, repo string, err error) {
	// Strip scheme + host manually; net/url would work too but this is simpler.
	s := rawURL
	for _, prefix := range []string{"https://github.com/", "http://github.com/"} {
		s = strings.TrimPrefix(s, prefix)
	}
	s = strings.TrimSuffix(s, "/")
	s = strings.TrimSuffix(s, ".git")

	parts := strings.SplitN(s, "/", 2)
	if len(parts) != 2 || parts[0] == "" || parts[1] == "" {
		return "", "", fmt.Errorf("invalid GitHub URL %q", rawURL)
	}
	// Discard any sub-path after owner/repo (e.g. /tree/main).
	repo = strings.SplitN(parts[1], "/", 2)[0]
	return parts[0], repo, nil
}

// commitStatus derives ACTIVE / STALE / DEAD from the age of the last commit.
func commitStatus(lastCommit time.Time) string {
	age := time.Since(lastCommit)
	switch {
	case age > deadThreshold:
		return "DEAD"
	case age > staleThreshold:
		return "STALE"
	default:
		return "ACTIVE"
	}
}
