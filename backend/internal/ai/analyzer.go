package ai

import "context"

// ─── Interfaces & Types ───────────────────────────────────────────────────────

// Section mirrors models.ArticleSection for AI output — kept here to avoid
// a circular import with the models package.
type Section struct {
	Heading string `json:"heading"`
	Body    string `json:"body"`
}

// AnalysisResult is the structured output from whitepaper analysis.
type AnalysisResult struct {
	VaporwareScore int       `json:"vaporware_score"`
	Verdict        string    `json:"verdict"`
	RealStack      []string  `json:"real_stack"`
	Buzzwords      []string  `json:"buzzwords"`
	OneLiner       string    `json:"one_liner"`
	SectionSummary []Section `json:"section_summary"`
}

// Analyzer is the interface that any AI backend must satisfy.
type Analyzer interface {
	AnalyzeWhitepaper(ctx context.Context, text string) (*AnalysisResult, error)
}
