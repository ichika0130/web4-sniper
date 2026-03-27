package ai

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"unicode/utf8"

	pdfapi "github.com/pdfcpu/pdfcpu/pkg/api"
	"golang.org/x/net/html"
)

const maxFetchBytes = 10 * 1024 * 1024 // 10 MB cap on download
const maxTextRunes = 50_000            // chars sent to Gemini

// Fetcher retrieves text from a URL (PDF or HTML).
type Fetcher struct {
	client *http.Client
}

// NewFetcher returns a Fetcher with sensible defaults.
func NewFetcher() *Fetcher {
	return &Fetcher{client: &http.Client{}}
}

// FetchText downloads the resource at url and returns plain text.
// For PDFs it uses pdfcpu content extraction; for HTML it strips tags
// using the golang.org/x/net/html parser. The result is truncated to
// maxTextRunes characters so the Gemini prompt stays within limits.
func (f *Fetcher) FetchText(ctx context.Context, url string) (string, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return "", fmt.Errorf("fetcher: build request: %w", err)
	}
	req.Header.Set("User-Agent", "Web4Sniper/1.0 (whitepaper-fetcher)")

	resp, err := f.client.Do(req)
	if err != nil {
		return "", fmt.Errorf("fetcher: GET %s: %w", url, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("fetcher: GET %s returned %d", url, resp.StatusCode)
	}

	body, err := io.ReadAll(io.LimitReader(resp.Body, maxFetchBytes))
	if err != nil {
		return "", fmt.Errorf("fetcher: read body: %w", err)
	}

	ct := resp.Header.Get("Content-Type")

	var text string
	switch {
	case strings.Contains(ct, "application/pdf") || strings.HasSuffix(strings.ToLower(url), ".pdf"):
		text, err = extractPDFText(body)
	default:
		// Treat everything else as HTML.
		text, err = extractHTMLText(body)
	}
	if err != nil {
		return "", err
	}

	return truncate(text, maxTextRunes), nil
}

// ─── PDF extraction ───────────────────────────────────────────────────────────

// reParenText matches text inside PDF content stream parentheses: (Hello World)
var reParenText = regexp.MustCompile(`\(([^)\\]*(?:\\.[^)\\]*)*)\)`)

func extractPDFText(data []byte) (string, error) {
	tmp, err := os.MkdirTemp("", "web4sniper-pdf-*")
	if err != nil {
		return "", fmt.Errorf("fetcher: create temp dir: %w", err)
	}
	defer os.RemoveAll(tmp)

	rs := bytes.NewReader(data)
	if err := pdfapi.ExtractContent(rs, tmp, "doc", nil, nil); err != nil {
		return "", fmt.Errorf("fetcher: extract pdf content: %w", err)
	}

	var sb strings.Builder
	entries, err := os.ReadDir(tmp)
	if err != nil {
		return "", fmt.Errorf("fetcher: read temp dir: %w", err)
	}

	for _, e := range entries {
		if e.IsDir() {
			continue
		}
		raw, err := os.ReadFile(filepath.Join(tmp, e.Name()))
		if err != nil {
			continue
		}
		for _, m := range reParenText.FindAllSubmatch(raw, -1) {
			sb.Write(m[1])
			sb.WriteByte(' ')
		}
	}

	return sb.String(), nil
}

// ─── HTML extraction ──────────────────────────────────────────────────────────

func extractHTMLText(data []byte) (string, error) {
	doc, err := html.Parse(bytes.NewReader(data))
	if err != nil {
		return "", fmt.Errorf("fetcher: parse HTML: %w", err)
	}

	var sb strings.Builder
	var walk func(*html.Node)
	walk = func(n *html.Node) {
		if n.Type == html.ElementNode {
			switch n.Data {
			case "script", "style", "noscript", "head":
				return // skip these subtrees
			}
		}
		if n.Type == html.TextNode {
			t := strings.TrimSpace(n.Data)
			if t != "" {
				sb.WriteString(t)
				sb.WriteByte('\n')
			}
		}
		for c := n.FirstChild; c != nil; c = c.NextSibling {
			walk(c)
		}
	}
	walk(doc)

	return sb.String(), nil
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

func truncate(s string, maxRunes int) string {
	if utf8.RuneCountInString(s) <= maxRunes {
		return s
	}
	runes := []rune(s)
	return string(runes[:maxRunes])
}
