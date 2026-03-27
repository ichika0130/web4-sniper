package ai_test

import (
	"context"
	"os"
	"testing"

	"github.com/web4sniper/api/internal/ai"
)

// ─── Integration test (skipped without GEMINI_API_KEY) ───────────────────────

func TestGeminiAnalyzer_Integration(t *testing.T) {
	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		t.Skip("GEMINI_API_KEY not set — skipping integration test")
	}

	ctx := context.Background()
	analyzer, err := ai.NewGeminiAnalyzer(ctx, apiKey)
	if err != nil {
		t.Fatalf("NewGeminiAnalyzer: %v", err)
	}
	defer analyzer.Close()

	const sampleText = `
NeuralMesh Protocol is a next-generation, AI-driven, blockchain-agnostic
cross-chain interoperability layer leveraging zero-knowledge proofs and
homomorphic encryption to deliver unprecedented scalability solutions.
Our decentralised autonomous governance framework ensures trustless,
permissionless participation for all stakeholders.
GitHub: https://github.com/neuralmesh/protocol (last commit 2021)
`

	result, err := analyzer.AnalyzeWhitepaper(ctx, sampleText)
	if err != nil {
		t.Fatalf("AnalyzeWhitepaper: %v", err)
	}

	if result.VaporwareScore < 0 || result.VaporwareScore > 100 {
		t.Errorf("score out of range: %d", result.VaporwareScore)
	}
	switch result.Verdict {
	case "LEGITIMATE", "SUSPICIOUS", "VAPORWARE", "UNKNOWN":
	default:
		t.Errorf("unexpected verdict: %q", result.Verdict)
	}
	if result.OneLiner == "" {
		t.Error("one_liner should not be empty")
	}
	t.Logf("score=%d verdict=%s one_liner=%q", result.VaporwareScore, result.Verdict, result.OneLiner)
}

// ─── Unit test: parseAnalysisJSON ────────────────────────────────────────────

func TestParseAnalysisJSON(t *testing.T) {
	tests := []struct {
		name        string
		input       string
		wantScore   int
		wantVerdict string
		wantErr     bool
	}{
		{
			name: "valid JSON",
			input: `{
				"vaporware_score": 87,
				"verdict": "VAPORWARE",
				"real_stack": ["Python"],
				"buzzwords": ["synergy", "blockchain"],
				"one_liner": "Pure hype, zero code.",
				"section_summary": [{"heading": "Overview", "body": "Nothing here."}]
			}`,
			wantScore:   87,
			wantVerdict: "VAPORWARE",
		},
		{
			name: "markdown fences stripped",
			input: "```json\n{\"vaporware_score\":42,\"verdict\":\"suspicious\",\"real_stack\":[],\"buzzwords\":[],\"one_liner\":\"ok\",\"section_summary\":[]}\n```",
			wantScore:   42,
			wantVerdict: "SUSPICIOUS",
		},
		{
			name:        "score clamped above 100",
			input:       `{"vaporware_score":150,"verdict":"VAPORWARE","real_stack":[],"buzzwords":[],"one_liner":"x","section_summary":[]}`,
			wantScore:   100,
			wantVerdict: "VAPORWARE",
		},
		{
			name:        "score clamped below 0",
			input:       `{"vaporware_score":-10,"verdict":"LEGITIMATE","real_stack":[],"buzzwords":[],"one_liner":"x","section_summary":[]}`,
			wantScore:   0,
			wantVerdict: "LEGITIMATE",
		},
		{
			name:        "unknown verdict normalised",
			input:       `{"vaporware_score":50,"verdict":"MAYBE","real_stack":[],"buzzwords":[],"one_liner":"x","section_summary":[]}`,
			wantScore:   50,
			wantVerdict: "UNKNOWN",
		},
		{
			name:    "invalid JSON",
			input:   `not json at all`,
			wantErr: true,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			result, err := ai.ParseAnalysisJSON(tc.input)
			if tc.wantErr {
				if err == nil {
					t.Fatal("expected error, got nil")
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if result.VaporwareScore != tc.wantScore {
				t.Errorf("score: got %d, want %d", result.VaporwareScore, tc.wantScore)
			}
			if result.Verdict != tc.wantVerdict {
				t.Errorf("verdict: got %q, want %q", result.Verdict, tc.wantVerdict)
			}
		})
	}
}
