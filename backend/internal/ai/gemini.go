package ai

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/google/generative-ai-go/genai"
	"google.golang.org/api/option"
)

const systemPrompt = `You are a cynical tech journalist specialising in Web3/Web4 vaporware detection.
Given whitepaper or project description text, respond with a JSON object matching this exact schema:

{
  "vaporware_score": <integer 0-100, where 100 = pure vaporware>,
  "verdict": <one of: "LEGITIMATE", "SUSPICIOUS", "VAPORWARE", "UNKNOWN">,
  "real_stack": <array of strings — actual technologies you can verify from the text>,
  "buzzwords": <array of strings — marketing buzzwords with no technical substance>,
  "one_liner": <string — one brutally honest sentence summarising the project>,
  "section_summary": [
    { "heading": <string>, "body": <string> }
  ]
}

Scoring guide:
- 0-39:  Legitimate project with real code and verifiable claims.
- 40-74: Suspicious — bold claims, thin evidence.
- 75-100: Pure vaporware — buzzword soup, no working product.

Return ONLY valid JSON. No markdown fences, no extra text.`

// GeminiAnalyzer implements Analyzer using the Google Gemini API.
type GeminiAnalyzer struct {
	client *genai.Client
	model  string
}

// NewGeminiAnalyzer creates a GeminiAnalyzer. The caller is responsible for
// calling client.Close() — returned analyzer holds the client open for reuse.
func NewGeminiAnalyzer(ctx context.Context, apiKey string) (*GeminiAnalyzer, error) {
	if apiKey == "" {
		return nil, fmt.Errorf("gemini: API key must not be empty")
	}
	client, err := genai.NewClient(ctx, option.WithAPIKey(apiKey))
	if err != nil {
		return nil, fmt.Errorf("gemini: create client: %w", err)
	}
	return &GeminiAnalyzer{client: client, model: "gemini-1.5-flash"}, nil
}

// Close releases the underlying gRPC connection.
func (g *GeminiAnalyzer) Close() error {
	return g.client.Close()
}

// AnalyzeWhitepaper sends the whitepaper text to Gemini and returns structured
// analysis results.
func (g *GeminiAnalyzer) AnalyzeWhitepaper(ctx context.Context, text string) (*AnalysisResult, error) {
	m := g.client.GenerativeModel(g.model)
	m.SystemInstruction = &genai.Content{
		Parts: []genai.Part{genai.Text(systemPrompt)},
	}
	m.ResponseMIMEType = "application/json"

	resp, err := m.GenerateContent(ctx, genai.Text(text))
	if err != nil {
		return nil, fmt.Errorf("gemini: generate content: %w", err)
	}

	if len(resp.Candidates) == 0 || resp.Candidates[0].Content == nil {
		return nil, fmt.Errorf("gemini: empty response")
	}

	var sb strings.Builder
	for _, part := range resp.Candidates[0].Content.Parts {
		if t, ok := part.(genai.Text); ok {
			sb.WriteString(string(t))
		}
	}

	return ParseAnalysisJSON(sb.String())
}

// ParseAnalysisJSON is exported for unit testing. It unmarshals the model's
// JSON response, stripping any accidental markdown fences and clamping the
// vaporware score to [0, 100].
func ParseAnalysisJSON(raw string) (*AnalysisResult, error) {
	// Strip ```json ... ``` fences if the model ignored the instruction.
	raw = strings.TrimSpace(raw)
	if strings.HasPrefix(raw, "```") {
		raw = strings.TrimPrefix(raw, "```json")
		raw = strings.TrimPrefix(raw, "```")
		if idx := strings.LastIndex(raw, "```"); idx != -1 {
			raw = raw[:idx]
		}
		raw = strings.TrimSpace(raw)
	}

	var result AnalysisResult
	if err := json.Unmarshal([]byte(raw), &result); err != nil {
		return nil, fmt.Errorf("gemini: parse response JSON: %w", err)
	}

	// Clamp score.
	if result.VaporwareScore < 0 {
		result.VaporwareScore = 0
	}
	if result.VaporwareScore > 100 {
		result.VaporwareScore = 100
	}

	// Normalise verdict.
	result.Verdict = strings.ToUpper(result.Verdict)
	switch result.Verdict {
	case "LEGITIMATE", "SUSPICIOUS", "VAPORWARE":
		// valid
	default:
		result.Verdict = "UNKNOWN"
	}

	// Ensure slices are never nil for consistent JSON marshalling.
	if result.RealStack == nil {
		result.RealStack = []string{}
	}
	if result.Buzzwords == nil {
		result.Buzzwords = []string{}
	}
	if result.SectionSummary == nil {
		result.SectionSummary = []Section{}
	}

	return &result, nil
}
