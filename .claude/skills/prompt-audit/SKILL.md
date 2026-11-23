---
name: prompt-audit
description: Audit and simulate prompt templates for a database serving B.Tech, B.E., +3, UG & PG students
---

# Prompt Audit Skill

This skill audits prompt templates intended for a student-facing AI database (B.Tech, B.E., +3, UG & PG). It scores clarity, role/context framing, grounding rules, output structure, and edge-case handling, then simulates realistic responses and outputs a refined "ChatGPT-style" prompt plus a database-ready JSON/SQL record.

## Usage

```
/prompt-audit <prompt-template-file> [sample-inputs-file]
```

Or invoke directly with the prompt template and sample inputs as arguments.

## Input Format

**Prompt Template** (required): A markdown or text file containing the prompt template with placeholders (e.g., `{{question}}`, `{{subject}}`, `{{level}}`).

**Sample Inputs** (optional): A JSON file with an array of sample student queries covering:
- Technical (engineering, CS, math)
- Analytical (problem-solving, derivations)
- Humanities/degree-level (essays, theory, explanations)

Example `sample-inputs.json`:
```json
[
  {"question": "Derive the transfer function of a second-order RLC circuit", "subject": "ECE", "level": "B.Tech 3rd year"},
  {"question": "Explain the causes of the French Revolution", "subject": "History", "level": "BA 2nd year"},
  {"question": "Write a Python function to implement Dijkstra's algorithm", "subject": "CS", "level": "B.E. 2nd year"}
]
```

## Output

1. **Audit Report** (markdown): Scores (1-5) for each dimension + detailed findings
2. **Simulation Results**: Simulated responses for each sample input with hallucination/ambiguity flags
3. **Refined Prompt**: "ChatGPT-style" version with system/developer framing, explicit constraints, context placeholders, predictable output formatting
4. **Database Record**: JSON/SQL-friendly record for storing the audited prompt

---

## Audit Dimensions & Scoring (1-5)

| Dimension | Weight | Criteria |
|-----------|--------|----------|
| **Clarity** | 20% | Unambiguous instructions, no vague terms, precise action verbs |
| **Role/Context Framing** | 20% | Clear persona, audience awareness, academic level adaptation |
| **Grounding Rules** | 20% | Source citation requirements, hallucination guards, "I don't know" triggers |
| **Output Structure** | 20% | Deterministic schema, sections, formatting rules, parseability |
| **Edge-Case/Missing-Context Handling** | 20% | Fallbacks for underspecified input, ambiguity detection, graceful degradation |

**Passing Threshold**: ≥ 3.5/5 weighted average. Below = needs revision.

---

## Simulation Protocol

For each sample input, the skill:
1. Renders the prompt template with the sample values
2. Simulates a realistic LLM response (using the refined prompt's logic)
3. Flags:
   - **Ambiguity**: Underspecified terms, multiple interpretations
   - **Hallucination Risk**: Claims without citation, invented formulas/citations, overconfident wrong answers
   - **Structure Violations**: Missing required sections, format deviations
   - **Level Mismatch**: Too advanced/simple for stated academic level

---

## Refined Prompt Template (ChatGPT-Style)

The output includes a prompt with:
- **System Block**: Role, mission, hard constraints, tone
- **Developer Block**: Output schema, formatting rules, validation logic
- **Context Placeholders**: `{{student_level}}`, `{{subject}}`, `{{question}}`, `{{curriculum_context}}`
- **Few-Shot Examples**: 2-3 curated examples per subject domain
- **Explicit Constraints**: Word limits, citation format, "unknown" handling, LaTeX/KateX rules

---

## Database Record Schema

```json
{
  "prompt_id": "uuid",
  "version": "1.0",
  "template": "refined prompt text",
  "metadata": {
    "subject_domains": ["ECE", "CS", "Mech", "Civil", "Math", "Humanities"],
    "academic_levels": ["+3", "UG", "PG"],
    "tags": ["derivation", "explanation", "code", "analysis"],
    "audit_score": 4.2,
    "audit_date": "2026-11-22",
    "auditor": "prompt-audit-skill"
  },
  "schema": {
    "required_sections": ["understanding", "step_by_step", "final_answer", "confidence"],
    "output_format": "markdown_with_katex",
    "citation_style": "ieee_numeric",
    "max_tokens": 2048
  },
  "constraints": {
    "hallucination_guard": "must_cite_or_unknown",
    "level_adaptation": true,
    "latex_required_for_math": true,
    "code_fence_language": "required"
  },
  "sample_simulations": [
    {
      "input": {"question": "...", "subject": "...", "level": "..."},
      "flags": ["ambiguity:low", "hallucination_risk:low"],
      "simulated_output_preview": "..."
    }
  ]
}
```

---

## Implementation Notes (AGENTS.md Compliance)

- **No Groq references** anywhere in code or prompts
- **Zero secret logging**: Never log API keys, credentials, or raw auth headers
- **Pure TypeScript/Node.js**: Implementation in `.claude/skills/prompt-audit/index.ts`
- **Frontend/Backend separation**: Skill runs as a Node.js CLI tool, no Python
- **Verification**: Run `npm run lint` and `npm run build` in `frontend/` after any changes

---

## Example Invocation

```bash
# From ARC root
npx tsx .claude/skills/prompt-audit/index.ts \
  --template prompts/derivation-prompt.md \
  --samples prompts/sample-inputs.json \
  --output audit-report.md
```

Or as a slash command:
```
/prompt-audit prompts/derivation-prompt.md prompts/sample-inputs.json
```