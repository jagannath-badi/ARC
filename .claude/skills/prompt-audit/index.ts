#!/usr/bin/env node
/**
 * Prompt Audit Skill - Audits and simulates prompt templates for student-facing AI database
 * Serves B.Tech, B.E., +3, UG & PG students across engineering and humanities
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname, extname, basename } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ============================================================================
// Types & Interfaces
// ============================================================================

interface SampleInput {
  question: string;
  subject: string;
  level: string;
  curriculum_context?: string;
}

interface AuditScores {
  clarity: number;
  roleContextFraming: number;
  groundingRules: number;
  outputStructure: number;
  edgeCaseHandling: number;
  weightedAverage: number;
}

interface AuditFinding {
  dimension: string;
  score: number;
  issues: string[];
  recommendations: string[];
}

interface SimulationResult {
  input: SampleInput;
  renderedPrompt: string;
  simulatedResponse: string;
  flags: SimulationFlag[];
}

interface SimulationFlag {
  type: 'ambiguity' | 'hallucination_risk' | 'structure_violation' | 'level_mismatch';
  severity: 'low' | 'medium' | 'high';
  description: string;
  location?: string;
}

interface RefinedPrompt {
  systemBlock: string;
  developerBlock: string;
  contextPlaceholders: Record<string, string>;
  fewShotExamples: FewShotExample[];
  explicitConstraints: Constraint[];
}

interface FewShotExample {
  subject: string;
  level: string;
  question: string;
  idealResponse: string;
}

interface Constraint {
  name: string;
  rule: string;
  enforcement: 'hard' | 'soft';
}

interface DatabaseRecord {
  prompt_id: string;
  version: string;
  template: string;
  metadata: {
    subject_domains: string[];
    academic_levels: string[];
    tags: string[];
    audit_score: number;
    audit_date: string;
    auditor: string;
  };
  schema: {
    required_sections: string[];
    output_format: string;
    citation_style: string;
    max_tokens: number;
  };
  constraints: {
    hallucination_guard: string;
    level_adaptation: boolean;
    latex_required_for_math: boolean;
    code_fence_language: boolean;
  };
  sample_simulations: Array<{
    input: SampleInput;
    flags: string[];
    simulated_output_preview: string;
  }>;
}

// ============================================================================
// Audit Engine
// ============================================================================

class PromptAuditor {
  private template: string;
  private samples: SampleInput[];

  constructor(template: string, samples: SampleInput[]) {
    this.template = template;
    this.samples = samples;
  }

  // ---------------------------------------------------------------------------
  // Dimension 1: Clarity (20%)
  // ---------------------------------------------------------------------------
  auditClarity(): AuditFinding {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 5;

    // Check for vague terms
    const vagueTerms = ['appropriate', 'suitable', 'relevant', 'comprehensive', 'thorough', 'detailed', 'brief'];
    vagueTerms.forEach(term => {
      if (this.template.toLowerCase().includes(term)) {
        issues.push(`Vague term "${term}" found - replace with specific criteria`);
        score -= 0.3;
      }
    });

    // Check for action verbs
    const actionVerbs = ['derive', 'explain', 'calculate', 'implement', 'analyze', 'compare', 'design', 'prove'];
    const hasActionVerb = actionVerbs.some(v => this.template.toLowerCase().includes(v));
    if (!hasActionVerb) {
      issues.push('No clear action verb directing the task');
      score -= 1;
      recommendations.push('Add explicit action verb: "Derive...", "Explain...", "Implement..."');
    }

    // Check placeholder clarity
    const placeholders = this.template.match(/\{\{(\w+)\}\}/g) || [];
    if (placeholders.length === 0) {
      issues.push('No context placeholders found (e.g., {{question}}, {{subject}}, {{level}})');
      score -= 1.5;
      recommendations.push('Add placeholders for question, subject, academic level, curriculum context');
    }

    // Check instruction specificity
    if (this.template.length < 200) {
      issues.push('Template very short - likely missing critical instructions');
      score -= 1;
    }

    return {
      dimension: 'Clarity',
      score: Math.max(1, Math.min(5, score)),
      issues,
      recommendations
    };
  }

  // ---------------------------------------------------------------------------
  // Dimension 2: Role/Context Framing (20%)
  // ---------------------------------------------------------------------------
  auditRoleContext(): AuditFinding {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 5;

    // Check for persona definition
    const personaKeywords = ['you are', 'act as', 'role:', 'persona:', 'assistant'];
    const hasPersona = personaKeywords.some(k => this.template.toLowerCase().includes(k));
    if (!hasPersona) {
      issues.push('No explicit persona/role definition');
      score -= 1.5;
      recommendations.push('Add: "You are an expert engineering tutor for B.Tech/B.E./+3/UG/PG students"');
    }

    // Check for audience awareness
    const audienceKeywords = ['student', 'undergraduate', 'b.tech', 'b.e.', '+3', 'postgraduate', 'pg'];
    const hasAudience = audienceKeywords.some(k => this.template.toLowerCase().includes(k));
    if (!hasAudience) {
      issues.push('No target audience specification');
      score -= 1;
      recommendations.push('Specify: "Target: B.Tech/B.E./+3/UG/PG students in {{subject}}"');
    }

    // Check for level adaptation
    const levelKeywords = ['level', 'year', 'semester', 'difficulty', 'complexity'];
    const hasLevelAdaptation = levelKeywords.some(k => this.template.toLowerCase().includes(k));
    if (!hasLevelAdaptation) {
      issues.push('No academic level adaptation guidance');
      score -= 1;
      recommendations.push('Add: "Adapt depth to {{level}}: +3=foundational, UG=applied, PG=research-oriented"');
    }

    // Check for subject/domain awareness
    const subjectKeywords = ['subject', 'domain', 'discipline', 'course', 'curriculum'];
    const hasSubject = subjectKeywords.some(k => this.template.toLowerCase().includes(k));
    if (!hasSubject) {
      issues.push('No subject/domain context placeholder');
      score -= 0.5;
    }

    return {
      dimension: 'Role/Context Framing',
      score: Math.max(1, Math.min(5, score)),
      issues,
      recommendations
    };
  }

  // ---------------------------------------------------------------------------
  // Dimension 3: Grounding Rules (20%)
  // ---------------------------------------------------------------------------
  auditGroundingRules(): AuditFinding {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 5;

    // Check for citation requirements
    const citationKeywords = ['cite', 'reference', 'source', 'citation', 'bibliography', 'ieee', 'apa'];
    const hasCitation = citationKeywords.some(k => this.template.toLowerCase().includes(k));
    if (!hasCitation) {
      issues.push('No citation/source requirement');
      score -= 1.5;
      recommendations.push('Add: "Cite all formulas, theorems, and facts using IEEE numeric style"');
    }

    // Check for hallucination guards
    const guardKeywords = ['unknown', 'uncertain', 'cannot confirm', 'verify', 'hallucinat', 'fabricat'];
    const hasGuard = guardKeywords.some(k => this.template.toLowerCase().includes(k));
    if (!hasGuard) {
      issues.push('No hallucination guard / "I don\'t know" trigger');
      score -= 1.5;
      recommendations.push('Add: "If uncertain, explicitly state \"CANNOT CONFIRM: [specific claim]\" - never guess"');
    }

    // Check for verification requirements
    const verifyKeywords = ['verify', 'cross-check', 'validate', 'double-check'];
    const hasVerify = verifyKeywords.some(k => this.template.toLowerCase().includes(k));
    if (!hasVerify) {
      issues.push('No verification/cross-check instruction');
      score -= 0.5;
      recommendations.push('Add: "Verify derivations against standard textbooks (e.g., Sedra/Smith, Hayt/Kim)"');
    }

    // Check for formula/math grounding
    const mathKeywords = ['formula', 'equation', 'derivation', 'theorem', 'proof'];
    const hasMathGrounding = mathKeywords.some(k => this.template.toLowerCase().includes(k));
    if (hasMathGrounding) {
      // Good - math-heavy prompts should have extra grounding
      recommendations.push('Consider: "All formulas must be rendered in LaTeX/KaTeX with step-by-step derivation"');
    }

    return {
      dimension: 'Grounding Rules',
      score: Math.max(1, Math.min(5, score)),
      issues,
      recommendations
    };
  }

  // ---------------------------------------------------------------------------
  // Dimension 4: Output Structure (20%)
  // ---------------------------------------------------------------------------
  auditOutputStructure(): AuditFinding {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 5;

    // Check for explicit output sections
    const sectionKeywords = ['section', 'format:', 'output:', 'structure:', '###', '##', '####'];
    const hasSections = sectionKeywords.some(k => this.template.toLowerCase().includes(k));
    if (!hasSections) {
      issues.push('No explicit output structure/sections defined');
      score -= 1.5;
      recommendations.push('Define required sections: Understanding, Step-by-Step, Final Answer, Confidence');
    }

    // Check for formatting rules
    const formatKeywords = ['markdown', 'latex', 'katex', 'code fence', 'bullet', 'numbered', 'json'];
    const hasFormat = formatKeywords.some(k => this.template.toLowerCase().includes(k));
    if (!hasFormat) {
      issues.push('No output format specification');
      score -= 1;
      recommendations.push('Specify: "Output in Markdown with KaTeX for math, fenced code blocks for code"');
    }

    // Check for parseability/determinism
    const parseKeywords = ['parse', 'machine-readable', 'structured', 'schema', 'yaml', 'json'];
    const hasParseability = parseKeywords.some(k => this.template.toLowerCase().includes(k));
    if (!hasParseability) {
      issues.push('No machine-parseable structure hint');
      score -= 0.5;
      recommendations.push('Add: "Wrap final answer in <!-- ANSWER --><!-- /ANSWER --> for extraction"');
    }

    // Check for length constraints
    const lengthKeywords = ['word', 'token', 'length', 'limit', 'concise', 'maximum'];
    const hasLength = lengthKeywords.some(k => this.template.toLowerCase().includes(k));
    if (!hasLength) {
      issues.push('No output length constraint');
      score -= 0.5;
      recommendations.push('Add: "Target ~800-1500 tokens; concise but complete"');
    }

    return {
      dimension: 'Output Structure',
      score: Math.max(1, Math.min(5, score)),
      issues,
      recommendations
    };
  }

  // ---------------------------------------------------------------------------
  // Dimension 5: Edge-Case/Missing-Context Handling (20%)
  // ---------------------------------------------------------------------------
  auditEdgeCases(): AuditFinding {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 5;

    // Check for missing context fallbacks
    const fallbackKeywords = ['if missing', 'if not provided', 'default', 'fallback', 'assume'];
    const hasFallback = fallbackKeywords.some(k => this.template.toLowerCase().includes(k));
    if (!hasFallback) {
      issues.push('No fallback for missing context (subject, level, curriculum)');
      score -= 1.5;
      recommendations.push('Add: "If {{subject}} missing, infer from question keywords; if {{level}} missing, assume UG 3rd year"');
    }

    // Check for ambiguity detection
    const ambiguityKeywords = ['ambigu', 'unclear', 'vague', 'multiple interpret', 'clarif'];
    const hasAmbiguity = ambiguityKeywords.some(k => this.template.toLowerCase().includes(k));
    if (!hasAmbiguity) {
      issues.push('No ambiguity detection instruction');
      score -= 1;
      recommendations.push('Add: "If question ambiguous, state assumptions explicitly before answering"');
    }

    // Check for graceful degradation
    const degradeKeywords = ['insufficient', 'cannot answer', 'out of scope', 'beyond scope'];
    const hasDegrade = degradeKeywords.some(k => this.template.toLowerCase().includes(k));
    if (!hasDegrade) {
      issues.push('No graceful degradation for out-of-scope/insufficient info');
      score -= 1;
      recommendations.push('Add: "If outside {{subject}} domain or insufficient data, respond: \"OUT OF SCOPE: [reason]\" "');
    }

    // Check for multi-part question handling
    const multipartKeywords = ['multi-part', 'sub-question', 'part a', 'part b', 'stepwise'];
    const hasMultipart = multipartKeywords.some(k => this.template.toLowerCase().includes(k));
    if (!hasMultipart) {
      issues.push('No guidance for multi-part questions');
      score -= 0.5;
      recommendations.push('Add: "For multi-part questions, answer each part in labeled subsections"');
    }

    return {
      dimension: 'Edge-Case/Missing-Context Handling',
      score: Math.max(1, Math.min(5, score)),
      issues,
      recommendations
    };
  }

  // ---------------------------------------------------------------------------
  // Full Audit
  // ---------------------------------------------------------------------------
  runAudit(): { scores: AuditScores; findings: AuditFinding[] } {
    const findings = [
      this.auditClarity(),
      this.auditRoleContext(),
      this.auditGroundingRules(),
      this.auditOutputStructure(),
      this.auditEdgeCases()
    ];

    const weights = [0.2, 0.2, 0.2, 0.2, 0.2];
    const weightedAverage = findings.reduce((sum, f, i) => sum + f.score * weights[i], 0);

    const scores: AuditScores = {
      clarity: findings[0].score,
      roleContextFraming: findings[1].score,
      groundingRules: findings[2].score,
      outputStructure: findings[3].score,
      edgeCaseHandling: findings[4].score,
      weightedAverage: Math.round(weightedAverage * 10) / 10
    };

    return { scores, findings };
  }
}

// ============================================================================
// Simulation Engine
// ============================================================================

class PromptSimulator {
  private template: string;

  constructor(template: string) {
    this.template = template;
  }

  renderPrompt(sample: SampleInput): string {
    let rendered = this.template;
    rendered = rendered.replace(/\{\{question\}\}/g, sample.question);
    rendered = rendered.replace(/\{\{subject\}\}/g, sample.subject);
    rendered = rendered.replace(/\{\{level\}\}/g, sample.level);
    rendered = rendered.replace(/\{\{curriculum_context\}\}/g, sample.curriculum_context || 'Standard university curriculum');
    return rendered;
  }

  simulateResponse(renderedPrompt: string, sample: SampleInput): { response: string; flags: SimulationFlag[] } {
    const flags: SimulationFlag[] = [];
    let response = '';

    // Simulate based on subject and question type
    const isMathHeavy = /deriv|calcul|formula|equation|transfer function|dijkstra/i.test(sample.question);
    const isCode = /implement|write.*code|function|algorithm|python|c\+\+|java/i.test(sample.question);
    const isEssay = /explain|cause|discuss|analyze|compare|history|revolution/i.test(sample.question);

    // Check for ambiguity in sample
    if (sample.question.split(' ').length < 8) {
      flags.push({
        type: 'ambiguity',
        severity: 'medium',
        description: 'Question very short - may be underspecified',
        location: 'input.question'
      });
    }

    // Check for level mismatch indicators
    const levelYear = sample.level.match(/(\d+)(st|nd|rd|th)/);
    if (levelYear) {
      const year = parseInt(levelYear[1]);
      if (isMathHeavy && year < 2) {
        flags.push({
          type: 'level_mismatch',
          severity: 'medium',
          description: `Math-heavy question for year ${year} - may need more foundational scaffolding`,
          location: 'input.level'
        });
      }
    }

    // Generate simulated response based on template quality signals
    const hasStructure = /section|format|structure|###|##/.test(this.template);
    const hasGrounding = /cite|reference|unknown|verify/.test(this.template);
    const hasPersona = /you are|act as|role:|persona:/.test(this.template);

    if (isMathHeavy) {
      response = this.simulateMathResponse(sample, hasStructure, hasGrounding, hasPersona, flags);
    } else if (isCode) {
      response = this.simulateCodeResponse(sample, hasStructure, hasGrounding, hasPersona, flags);
    } else if (isEssay) {
      response = this.simulateEssayResponse(sample, hasStructure, hasGrounding, hasPersona, flags);
    } else {
      response = this.simulateGenericResponse(sample, hasStructure, hasGrounding, hasPersona, flags);
    }

    // Check for hallucination risks in simulated response
    if (!hasGrounding && (response.includes('=') || response.includes('Theorem') || response.includes('Formula'))) {
      flags.push({
        type: 'hallucination_risk',
        severity: 'high',
        description: 'Math/formula claims without citation requirement in template',
        location: 'template.grounding'
      });
    }

    // Check structure violations
    if (hasStructure && !/## |### |\*\* /.test(response)) {
      flags.push({
        type: 'structure_violation',
        severity: 'medium',
        description: 'Template requests structure but simulated response lacks clear sections',
        location: 'response'
      });
    }

    return { response, flags };
  }

  private simulateMathResponse(sample: SampleInput, hasStructure: boolean, hasGrounding: boolean, hasPersona: boolean, flags: SimulationFlag[]): string {
    let resp = '';

    if (hasStructure) {
      resp += '## Understanding\n';
      resp += `The problem asks for ${sample.question.toLowerCase()}. This requires ${sample.subject} fundamentals.\n\n`;
      resp += '## Step-by-Step Derivation\n';
      resp += '1. **Circuit Analysis**: Apply KVL/KCL to the RLC loop\n';
      resp += '2. **Laplace Transform**: Convert to s-domain: $V(s) = I(s)(R + sL + \\frac{1}{sC})$\n';
      resp += '3. **Transfer Function**: $H(s) = \\frac{V_{out}(s)}{V_{in}(s)} = \\frac{1}{LCs^2 + RCs + 1}$\n';
      resp += '4. **Standard Form**: $H(s) = \\frac{\\omega_n^2}{s^2 + 2\\zeta\\omega_n s + \\omega_n^2}$\n';
      resp += '   where $\\omega_n = \\frac{1}{\\sqrt{LC}}$ and $\\zeta = \\frac{R}{2}\\sqrt{\\frac{C}{L}}$\n\n';
      resp += '## Final Answer\n';
      resp += '$$H(s) = \\frac{1}{LCs^2 + RCs + 1} = \\frac{\\omega_n^2}{s^2 + 2\\zeta\\omega_n s + \\omega_n^2}$$';
      resp += '\n\n## Confidence\n';
      resp += hasGrounding ? 'CONFIRMED: Standard second-order RLC transfer function' : 'LIKELY: Standard result, verify with textbook';
    } else {
      resp = `The transfer function is H(s) = 1/(LCs² + RCs + 1) where ωₙ = 1/√(LC) and ζ = R/2√(C/L).`;
      if (!hasGrounding) {
        flags.push({ type: 'hallucination_risk', severity: 'high', description: 'Formula given without citation/verification requirement', location: 'response' });
      }
    }

    return resp;
  }

  private simulateCodeResponse(sample: SampleInput, hasStructure: boolean, hasGrounding: boolean, hasPersona: boolean, flags: SimulationFlag[]): string {
    let resp = '';

    if (hasStructure) {
      resp += '## Understanding\n';
      resp += 'Dijkstra\'s algorithm finds shortest paths from a source node to all other nodes in a weighted graph.\n\n';
      resp += '## Implementation\n';
      resp += '```python\nimport heapq\nfrom typing import Dict, List, Tuple\n\ndef dijkstra(graph: Dict[str, List[Tuple[str, float]]], start: str) -> Dict[str, float]:\n    distances = {node: float("inf") for node in graph}\n    distances[start] = 0\n    pq = [(0, start)]\n    \n    while pq:\n        dist, node = heapq.heappop(pq)\n        if dist > distances[node]:\n            continue\n        for neighbor, weight in graph[node]:\n            new_dist = dist + weight\n            if new_dist < distances[neighbor]:\n                distances[neighbor] = new_dist\n                heapq.heappush(pq, (new_dist, neighbor))\n    return distances\n```\n\n';
      resp += '## Explanation\n';
      resp += '- Uses min-heap (priority queue) for O((V+E) log V) complexity\n';
      resp += '- Handles non-negative edge weights only\n';
      resp += '- Returns dict of shortest distances from start\n\n';
      resp += '## Confidence\n';
      resp += 'CONFIRMED: Standard Dijkstra implementation';
    } else {
      resp = '```python\ndef dijkstra(graph, start):\n    # implementation here\n    pass\n```';
      flags.push({ type: 'structure_violation', severity: 'medium', description: 'Code-only response without explanation', location: 'response' });
    }

    return resp;
  }

  private simulateEssayResponse(sample: SampleInput, hasStructure: boolean, hasGrounding: boolean, hasPersona: boolean, flags: SimulationFlag[]): string {
    let resp = '';

    if (hasStructure) {
      resp += '## Understanding\n';
      resp += 'The French Revolution (1789-1799) was a period of radical political and societal change in France.\n\n';
      resp += '## Key Causes\n';
      resp += '### 1. Fiscal Crisis\n';
      resp += 'Decades of war spending (American Revolution, Seven Years\' War) left France nearly bankrupt.\n\n';
      resp += '### 2. Social Inequality (Ancien Régime)\n';
      resp += 'Three Estates system: Clergy (1%), Nobility (2%), Third Estate (97%) bearing all taxes.\n\n';
      resp += '### 3. Enlightenment Ideas\n';
      resp += 'Philosophers (Voltaire, Rousseau, Montesquieu) challenged divine right of kings.\n\n';
      resp += '### 4. Weak Leadership\n';
      resp += 'Louis XVI\'s indecisiveness and Marie Antoinette\'s unpopularity eroded monarchy\'s legitimacy.\n\n';
      resp += '## Final Answer\n';
      resp += 'The French Revolution resulted from fiscal collapse, rigid social hierarchy, Enlightenment ideas, and weak monarchy.';
      resp += '\n\n## Confidence\n';
      resp += hasGrounding ? 'CONFIRMED: Standard historical consensus' : 'LIKELY: Widely accepted causes';
    } else {
      resp = 'The French Revolution was caused by financial crisis, social inequality, Enlightenment ideas, and weak leadership under Louis XVI.';
      if (!hasGrounding) {
        flags.push({ type: 'hallucination_risk', severity: 'medium', description: 'Historical claims without citation requirement', location: 'response' });
      }
    }

    return resp;
  }

  private simulateGenericResponse(sample: SampleInput, hasStructure: boolean, hasGrounding: boolean, hasPersona: boolean, flags: SimulationFlag[]): string {
    let resp = hasStructure
      ? `## Understanding\n${sample.question}\n\n## Analysis\n[Analysis would go here]\n\n## Final Answer\n[Answer would go here]\n\n## Confidence\nLIKELY: Template lacks specificity`
      : `Response to: ${sample.question}`;
    return resp;
  }

  runSimulations(samples: SampleInput[]): SimulationResult[] {
    return samples.map(sample => {
      const renderedPrompt = this.renderPrompt(sample);
      const { response, flags } = this.simulateResponse(renderedPrompt, sample);
      return { input: sample, renderedPrompt, simulatedResponse: response, flags };
    });
  }
}

// ============================================================================
// Refined Prompt Generator
// ============================================================================

class RefinedPromptGenerator {
  private auditFindings: AuditFinding[];
  private samples: SampleInput[];

  constructor(auditFindings: AuditFinding[], samples: SampleInput[]) {
    this.auditFindings = auditFindings;
    this.samples = samples;
  }

  generate(): RefinedPrompt {
    const subjectDomains = [...new Set(this.samples.map(s => s.subject))];
    const levels = [...new Set(this.samples.map(s => s.level))];

    return {
      systemBlock: this.generateSystemBlock(subjectDomains, levels),
      developerBlock: this.generateDeveloperBlock(),
      contextPlaceholders: this.generateContextPlaceholders(),
      fewShotExamples: this.generateFewShotExamples(),
      explicitConstraints: this.generateConstraints()
    };
  }

  private generateSystemBlock(subjectDomains: string[], levels: string[]): string {
    return `You are an expert academic tutor and engineering mentor for undergraduate and postgraduate students.

**Mission**: Provide accurate, well-structured, pedagogically sound answers to questions across ${subjectDomains.join(', ')} at ${levels.join(', ')} levels.

**Hard Constraints**:
- NEVER hallucinate formulas, citations, code, or facts. If uncertain, output "CANNOT CONFIRM: [specific claim]"
- ALWAYS cite sources for formulas, theorems, historical claims, and algorithms using IEEE numeric style
- ADAPT depth to academic level: +3/1st year = foundational concepts with intuition; 2nd-3rd year = applied problem-solving; 4th year/PG = research-oriented with critical analysis
- USE LaTeX/KaTeX for ALL mathematical notation (inline: $...$, display: $$...$$)
- WRAP code in fenced blocks with language specifier (e.g., \`\`\`python)
- OUTPUT in Markdown with explicit sections as defined in Developer Block

**Tone**: Encouraging but rigorous. Explain the "why" behind each step. Use analogies for complex concepts.`;
  }

  private generateDeveloperBlock(): string {
    return `**Output Schema (MANDATORY - every response must follow this structure):**

## Understanding
[Restate the problem in your own words. Identify key concepts, given parameters, and what is being asked. 2-4 sentences.]

## Step-by-Step Solution / Analysis
[For derivations: numbered mathematical steps with LaTeX.
 For code: explanation then fenced code block.
 For essays: structured arguments with evidence.
 For multi-part: labeled subsections (### Part A, ### Part B).]

## Final Answer
[Concise, boxed/clearly marked final result. For math: $$...$$. For code: complete runnable snippet. For theory: 2-3 sentence synthesis.]

## Confidence
[Exactly one of:]
- CONFIRMED: [source or "standard result in <textbook>"]
- LIKELY: [reasoning + "verify with <source>"]
- CANNOT CONFIRM: [specific claim that lacks verification]

**Formatting Rules**:
- KaTeX for all math (NO plain text fractions like 1/2πRC)
- Fenced code blocks with language: \`\`\`python, \`\`\`c++, \`\`\`matlab
- IEEE numeric citations: [1], [2] referencing a Sources section if needed
- Maximum ~1500 tokens unless question demands more
- Wrap Final Answer in <!-- ANSWER --><!-- /ANSWER --> for programmatic extraction`;
  }

  private generateContextPlaceholders(): Record<string, string> {
    return {
      '{{question}}': 'The student\'s full question text',
      '{{subject}}': 'Academic subject (ECE, CS, Mech, Civil, Math, Physics, History, etc.)',
      '{{level}}': 'Academic level: +3 / 1st year / 2nd year / 3rd year / 4th year / PG / M.Tech / PhD',
      '{{curriculum_context}}': 'Specific course name, textbook, syllabus topics, or university (optional)',
      '{{preferred_language}}': 'Programming language preference for code questions (Python, C++, MATLAB, etc.)'
    };
  }

  private generateFewShotExamples(): FewShotExample[] {
    return [
      {
        subject: 'ECE',
        level: 'B.Tech 3rd year',
        question: 'Derive the transfer function of a second-order RLC series circuit',
        idealResponse: `## Understanding
The problem asks for the transfer function H(s) = V_out(s)/V_in(s) of a series RLC circuit. This is a fundamental circuit analysis problem requiring Laplace domain analysis.

## Step-by-Step Derivation
1. **Time-domain KVL**: $V_{in}(t) = V_R(t) + V_L(t) + V_C(t) = Ri(t) + L\\frac{di}{dt} + \\frac{1}{C}\\int i(\\tau)d\\tau$
2. **Laplace Transform** (zero initial conditions): $V_{in}(s) = I(s)\\left(R + sL + \\frac{1}{sC}\\right)$
3. **Output Voltage** (across capacitor): $V_{out}(s) = I(s) \\cdot \\frac{1}{sC}$
4. **Transfer Function**: $H(s) = \\frac{V_{out}(s)}{V_{in}(s)} = \\frac{1/sC}{R + sL + 1/sC} = \\frac{1}{LCs^2 + RCs + 1}$
5. **Standard Form**: $H(s) = \\frac{\\omega_n^2}{s^2 + 2\\zeta\\omega_n s + \\omega_n^2}$ where $\\omega_n = \\frac{1}{\\sqrt{LC}}$, $\\zeta = \\frac{R}{2}\\sqrt{\\frac{C}{L}}$

## Final Answer
$$H(s) = \\frac{1}{LCs^2 + RCs + 1} = \\frac{\\omega_n^2}{s^2 + 2\\zeta\\omega_n s + \\omega_n^2}$$

<!-- ANSWER -->$$H(s) = \\frac{\\omega_n^2}{s^2 + 2\\zeta\\omega_n s + \\omega_n^2}$$<!-- /ANSWER -->

## Confidence
CONFIRMED: Standard result in "Fundamentals of Electric Circuits" (Alexander & Sadiku) Ch. 14, and "Signals and Systems" (Oppenheim) Ch. 6.`
      },
      {
        subject: 'CS',
        level: 'B.E. 2nd year',
        question: 'Implement Dijkstra\'s shortest path algorithm in Python',
        idealResponse: `## Understanding
Dijkstra's algorithm finds single-source shortest paths in a weighted graph with non-negative edges. It uses a greedy approach with a priority queue.

## Implementation
\`\`\`python
import heapq
from typing import Dict, List, Tuple, Optional

def dijkstra(graph: Dict[str, List[Tuple[str, float]]], start: str) -> Dict[str, float]:
    """
    Dijkstra's shortest path algorithm.

    Args:
        graph: Adjacency list {node: [(neighbor, weight), ...]}
        start: Source node

    Returns:
        Dict mapping each node to its shortest distance from start
    """
    distances = {node: float('inf') for node in graph}
    distances[start] = 0
    pq: List[Tuple[float, str]] = [(0, start)]
    visited = set()

    while pq:
        dist, node = heapq.heappop(pq)
        if node in visited:
            continue
        visited.add(node)

        if dist > distances[node]:
            continue

        for neighbor, weight in graph[node]:
            if neighbor in visited:
                continue
            new_dist = dist + weight
            if new_dist < distances[neighbor]:
                distances[neighbor] = new_dist
                heapq.heappush(pq, (new_dist, neighbor))

    return distances
\`\`\`

## Explanation
- **Time Complexity**: O((V + E) log V) using binary heap
- **Space Complexity**: O(V)
- **Constraint**: Only works with non-negative edge weights
- **Alternative**: For negative weights, use Bellman-Ford

## Final Answer
Complete Dijkstra implementation with O((V+E) log V) complexity using heapq.

<!-- ANSWER -->Complete implementation above with heap-based priority queue<!-- /ANSWER -->

## Confidence
CONFIRMED: Standard algorithm from "Introduction to Algorithms" (CLRS) Ch. 24.3.`
      },
      {
        subject: 'History',
        level: 'BA 2nd year',
        question: 'Explain the main causes of the French Revolution',
        idealResponse: `## Understanding
The French Revolution (1789–1799) transformed France from an absolute monarchy to a republic. This asks for the structural and proximate causes.

## Key Causes

### 1. Fiscal Crisis (Proximate Trigger)
- War debts from Seven Years' War (1756–63) and American Revolution (1775–83)
- 1786: Controller-General Calonne reveals deficit of 112M livres
- Failed tax reforms blocked by Parlement and nobility [1]

### 2. Social Structure: Ancien Régime (Structural)
- **First Estate** (Clergy, ~0.5%): Exempt from taille, collected dime
- **Second Estate** (Nobility, ~1.5%): Exempt from most taxes, feudal dues
- **Third Estate** (98%): Peasants, bourgeoisie, urban workers - bore full tax burden [2]

### 3. Enlightenment Ideology (Intellectual)
- Rousseau: *Social Contract* (1762) - popular sovereignty
- Voltaire: Critiqued church/state alliance
- Montesquieu: *Spirit of Laws* (1748) - separation of powers [3]

### 4. Political Incompetence
- Louis XVI indecisive; dismissed reformist ministers (Turgot, Necker)
- Estates-General 1789 deadlock over voting procedure
- Tennis Court Oath (June 1789) - Third Estate claims national representation

## Final Answer
The French Revolution resulted from: (1) state bankruptcy from wars, (2) rigid three-estate system concentrating tax burden on Third Estate, (3) Enlightenment ideas challenging divine-right monarchy, and (4) Louis XVI's failure to reform.

<!-- ANSWER -->Fiscal collapse + social inequality + Enlightenment ideas + weak monarchy = Revolution<!-- /ANSWER -->

## Confidence
CONFIRMED: Standard historiography per [1] Doyle, *Origins of the French Revolution* (1988); [2] Lefebvre, *Coming of the French Revolution* (1947); [3] Israel, *Revolutionary Ideas* (2014).`
      }
    ];
  }

  private generateConstraints(): Constraint[] {
    return [
      { name: 'hallucination_guard', rule: 'Every factual claim must have citation or explicit "CANNOT CONFIRM"', enforcement: 'hard' },
      { name: 'level_adaptation', rule: 'Adjust depth: +3=intuition, UG=application, PG=critical analysis', enforcement: 'hard' },
      { name: 'latex_required_for_math', rule: 'All math in KaTeX: $inline$, $$display$$', enforcement: 'hard' },
      { name: 'code_fence_language', rule: 'All code in fenced blocks with language tag', enforcement: 'hard' },
      { name: 'output_structure', rule: 'Must follow Understanding → Steps → Final Answer → Confidence', enforcement: 'hard' },
      { name: 'max_tokens', rule: 'Target ~1500 tokens; concise but complete', enforcement: 'soft' },
      { name: 'citation_style', rule: 'IEEE numeric [1], [2] with Sources section if >3 citations', enforcement: 'hard' },
      { name: 'ambiguity_handling', rule: 'If question ambiguous, state assumptions explicitly before answering', enforcement: 'hard' },
      { name: 'out_of_scope', rule: 'If outside domain, respond: "OUT OF SCOPE: [reason]"', enforcement: 'hard' }
    ];
  }
}

// ============================================================================
// Database Record Generator
// ============================================================================

class DatabaseRecordGenerator {
  private refinedPrompt: RefinedPrompt;
  private auditScores: AuditScores;
  private simulations: SimulationResult[];
  private samples: SampleInput[];

  constructor(refinedPrompt: RefinedPrompt, auditScores: AuditScores, simulations: SimulationResult[], samples: SampleInput[]) {
    this.refinedPrompt = refinedPrompt;
    this.auditScores = auditScores;
    this.simulations = simulations;
    this.samples = samples;
  }

  generate(): DatabaseRecord {
    const subjectDomains = [...new Set(this.samples.map(s => s.subject))];
    const academicLevels = [...new Set(this.samples.map(s => s.level))];
    const tags = this.extractTags();

    const template = this.assembleTemplate();

    return {
      prompt_id: this.generateId(),
      version: '1.0',
      template,
      metadata: {
        subject_domains: subjectDomains,
        academic_levels: academicLevels,
        tags,
        audit_score: this.auditScores.weightedAverage,
        audit_date: new Date().toISOString().split('T')[0],
        auditor: 'prompt-audit-skill'
      },
      schema: {
        required_sections: ['Understanding', 'Step-by-Step Solution / Analysis', 'Final Answer', 'Confidence'],
        output_format: 'markdown_with_katex',
        citation_style: 'ieee_numeric',
        max_tokens: 1500
      },
      constraints: {
        hallucination_guard: 'must_cite_or_unknown',
        level_adaptation: true,
        latex_required_for_math: true,
        code_fence_language: true
      },
      sample_simulations: this.simulations.map(s => ({
        input: s.input,
        flags: s.flags.map(f => `${f.type}:${f.severity}`),
        simulated_output_preview: s.simulatedResponse.substring(0, 300) + '...'
      }))
    };
  }

  private assembleTemplate(): string {
    const parts = [
      '=== SYSTEM BLOCK ===',
      this.refinedPrompt.systemBlock,
      '',
      '=== DEVELOPER BLOCK ===',
      this.refinedPrompt.developerBlock,
      '',
      '=== CONTEXT PLACEHOLDERS ===',
      Object.entries(this.refinedPrompt.contextPlaceholders).map(([k, v]) => `${k}: ${v}`).join('\n'),
      '',
      '=== FEW-SHOT EXAMPLES ===',
      this.refinedPrompt.fewShotExamples.map(ex =>
        `--- Example: ${ex.subject} / ${ex.level} ---\nQ: ${ex.question}\nA: ${ex.idealResponse}`
      ).join('\n\n'),
      '',
      '=== EXPLICIT CONSTRAINTS ===',
      this.refinedPrompt.explicitConstraints.map(c =>
        `- ${c.name} (${c.enforcement}): ${c.rule}`
      ).join('\n')
    ];
    return parts.join('\n');
  }

  private extractTags(): string[] {
    const tags = new Set<string>();
    this.samples.forEach(s => {
      const q = s.question.toLowerCase();
      if (/deriv|calcul|formula|equation|transfer/.test(q)) tags.add('derivation');
      if (/explain|cause|discuss|analyze|compare/.test(q)) tags.add('explanation');
      if (/implement|code|function|algorithm|python/.test(q)) tags.add('code');
      if (/design|create|build/.test(q)) tags.add('design');
      if (/proof|prove|theorem/.test(q)) tags.add('proof');
    });
    return Array.from(tags);
  }

  private generateId(): string {
    return 'prompt_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
  }
}

// ============================================================================
// Report Generator
// ============================================================================

class ReportGenerator {
  static generateAuditReport(
    template: string,
    samples: SampleInput[],
    auditResult: { scores: AuditScores; findings: AuditFinding[] },
    simulations: SimulationResult[],
    refinedPrompt: RefinedPrompt,
    dbRecord: DatabaseRecord
  ): string {
    const { scores, findings } = auditResult;
    const passed = scores.weightedAverage >= 3.5;

    let md = `# Prompt Audit Report\n\n`;
    md += `**Date**: ${new Date().toISOString().split('T')[0]}\n`;
    md += `**Template Length**: ${template.length} chars\n`;
    md += `**Samples Tested**: ${samples.length}\n`;
    md += `**Overall Score**: ${scores.weightedAverage}/5.0 ${passed ? '✅ PASS' : '❌ NEEDS REVISION'}\n\n`;

    md += `## Dimension Scores\n\n`;
    md += `| Dimension | Score | Weight | Weighted |\n`;
    md += `|-----------|-------|--------|----------|\n`;
    md += `| Clarity | ${scores.clarity}/5 | 20% | ${(scores.clarity * 0.2).toFixed(1)} |\n`;
    md += `| Role/Context Framing | ${scores.roleContextFraming}/5 | 20% | ${(scores.roleContextFraming * 0.2).toFixed(1)} |\n`;
    md += `| Grounding Rules | ${scores.groundingRules}/5 | 20% | ${(scores.groundingRules * 0.2).toFixed(1)} |\n`;
    md += `| Output Structure | ${scores.outputStructure}/5 | 20% | ${(scores.outputStructure * 0.2).toFixed(1)} |\n`;
    md += `| Edge-Case Handling | ${scores.edgeCaseHandling}/5 | 20% | ${(scores.edgeCaseHandling * 0.2).toFixed(1)} |\n`;
    md += `| **Total** |  | **100%** | **${scores.weightedAverage.toFixed(1)}** |\n\n`;

    md += `## Detailed Findings\n\n`;
    findings.forEach(f => {
      md += `### ${f.dimension} (${f.score}/5)\n\n`;
      if (f.issues.length > 0) {
        md += `**Issues**:\n`;
        f.issues.forEach(i => md += `- ${i}\n`);
        md += `\n`;
      }
      if (f.recommendations.length > 0) {
        md += `**Recommendations**:\n`;
        f.recommendations.forEach(r => md += `- ${r}\n`);
        md += `\n`;
      }
    });

    md += `## Simulation Results\n\n`;
    simulations.forEach((sim, i) => {
      md += `### Sample ${i + 1}: ${sim.input.subject} / ${sim.input.level}\n\n`;
      md += `**Question**: ${sim.input.question}\n\n`;
      md += `**Flags**: ${sim.flags.length > 0 ? sim.flags.map(f => `\`${f.type}:${f.severity}\``).join(', ') : 'None'}\n\n`;
      if (sim.flags.length > 0) {
        md += `**Flag Details**:\n`;
        sim.flags.forEach(f => {
          md += `- **${f.type}** (${f.severity}): ${f.description}${f.location ? ` [${f.location}]` : ''}\n`;
        });
        md += `\n`;
      }
      md += `**Simulated Response Preview**:\n\`\`\`\n${sim.simulatedResponse.substring(0, 500)}...\n\`\`\`\n\n`;
      md += `---\n\n`;
    });

    md += `## Refined Prompt (ChatGPT-Style)\n\n`;
    md += `### System Block\n\`\`\`\n${refinedPrompt.systemBlock}\n\`\`\`\n\n`;
    md += `### Developer Block\n\`\`\`\n${refinedPrompt.developerBlock}\n\`\`\`\n\n`;
    md += `### Context Placeholders\n\n`;
    Object.entries(refinedPrompt.contextPlaceholders).forEach(([k, v]) => {
      md += `- \`${k}\`: ${v}\n`;
    });
    md += `\n`;

    md += `### Few-Shot Examples\n\n`;
    refinedPrompt.fewShotExamples.forEach((ex, i) => {
      md += `#### Example ${i + 1}: ${ex.subject} / ${ex.level}\n\n`;
      md += `**Q**: ${ex.question}\n\n`;
      md += `**A**: ${ex.idealResponse.substring(0, 400)}...\n\n`;
    });

    md += `### Explicit Constraints\n\n`;
    refinedPrompt.explicitConstraints.forEach(c => {
      md += `- **${c.name}** (${c.enforcement}): ${c.rule}\n`;
    });

    md += `\n---\n\n## Database Record (JSON)\n\n`;
    md += `\`\`\`json\n${JSON.stringify(dbRecord, null, 2)}\n\`\`\`\n`;

    return md;
  }
}

// ============================================================================
// CLI Entry Point
// ============================================================================

interface CliArgs {
  template: string;
  samples?: string;
  output?: string;
  help?: boolean;
}

function parseArgs(): CliArgs {
  const args: CliArgs = { template: '' };
  const argv = process.argv.slice(2);

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      args.help = true;
    } else if (arg === '--template' || arg === '-t') {
      args.template = argv[++i];
    } else if (arg === '--samples' || arg === '-s') {
      args.samples = argv[++i];
    } else if (arg === '--output' || arg === '-o') {
      args.output = argv[++i];
    } else if (!args.template && !arg.startsWith('-')) {
      args.template = arg;
    } else if (!args.samples && !arg.startsWith('-')) {
      args.samples = arg;
    }
  }
  return args;
}

function printHelp(): void {
  console.log(`
Prompt Audit Skill - Audit prompt templates for student AI database

Usage:
  npx tsx .claude/skills/prompt-audit/index.ts --template <file> [--samples <file>] [--output <file>]
  npx tsx .claude/skills/prompt-audit/index.ts <template-file> [<samples-file>]

Arguments:
  --template, -t    Path to prompt template file (markdown/text with {{placeholders}})
  --samples, -s     Path to sample inputs JSON (optional, uses built-in defaults)
  --output, -o      Output file for audit report (default: stdout)
  --help, -h        Show this help

Template Placeholders:
  {{question}}           Student's question (required)
  {{subject}}            Academic subject (ECE, CS, Mech, Civil, Math, History, etc.)
  {{level}}              Academic level (+3, 1st year, 2nd year, 3rd year, 4th year, PG, M.Tech)
  {{curriculum_context}} Course name, textbook, syllabus (optional)
  {{preferred_language}} Programming language for code questions (optional)

Sample Inputs Format (JSON):
[
  {"question": "Derive transfer function of RLC circuit", "subject": "ECE", "level": "B.Tech 3rd year"},
  {"question": "Implement Dijkstra in Python", "subject": "CS", "level": "B.E. 2nd year"},
  {"question": "Causes of French Revolution", "subject": "History", "level": "BA 2nd year"}
]

Output:
  - Audit report (markdown) with scores, findings, simulations
  - Refined "ChatGPT-style" prompt with system/developer blocks
  - Database-ready JSON record

Exit Codes:
  0 = Success (audit complete)
  1 = Error (missing template, file not found, etc.)
  2 = Audit failed (score < 3.5)
`);
}

async function main(): Promise<void> {
  const args = parseArgs();

  if (args.help) {
    printHelp();
    process.exit(0);
  }

  if (!args.template) {
    console.error('Error: --template <file> is required');
    printHelp();
    process.exit(1);
  }

  // Load template
  if (!existsSync(args.template)) {
    console.error(`Error: Template file not found: ${args.template}`);
    process.exit(1);
  }
  const template = readFileSync(args.template, 'utf-8');

  // Load samples
  let samples: SampleInput[];
  if (args.samples) {
    if (!existsSync(args.samples)) {
      console.error(`Error: Samples file not found: ${args.samples}`);
      process.exit(1);
    }
    const samplesData = JSON.parse(readFileSync(args.samples, 'utf-8'));
    samples = samplesData;
  } else {
    // Default samples covering technical, analytical, humanities
    samples = [
      { question: 'Derive the transfer function of a second-order RLC series circuit', subject: 'ECE', level: 'B.Tech 3rd year', curriculum_context: 'Signals and Systems, Oppenheim Ch. 6' },
      { question: 'Explain the causes of the French Revolution', subject: 'History', level: 'BA 2nd year', curriculum_context: 'Modern European History, Doyle "Origins of French Revolution"' },
      { question: 'Write a Python function to implement Dijkstra\'s shortest path algorithm', subject: 'CS', level: 'B.E. 2nd year', curriculum_context: 'Data Structures & Algorithms, CLRS Ch. 24' },
      { question: 'Calculate the natural frequency and damping ratio of a mass-spring-damper system', subject: 'Mech', level: 'B.Tech 2nd year', curriculum_context: 'Mechanical Vibrations, Rao Ch. 2' },
      { question: 'Prove that the square root of 2 is irrational', subject: 'Math', level: '+3 1st year', curriculum_context: 'Discrete Mathematics, Rosen Ch. 1' }
    ];
  }

  console.log(`📋 Auditing template: ${args.template}`);
  console.log(`🧪 Testing with ${samples.length} sample inputs...\n`);

  // Run audit
  const auditor = new PromptAuditor(template, samples);
  const auditResult = auditor.runAudit();

  // Run simulations
  const simulator = new PromptSimulator(template);
  const simulations = simulator.runSimulations(samples);

  // Generate refined prompt
  const generator = new RefinedPromptGenerator(auditResult.findings, samples);
  const refinedPrompt = generator.generate();

  // Generate database record
  const dbGenerator = new DatabaseRecordGenerator(refinedPrompt, auditResult.scores, simulations, samples);
  const dbRecord = dbGenerator.generate();

  // Generate report
  const report = ReportGenerator.generateAuditReport(template, samples, auditResult, simulations, refinedPrompt, dbRecord);

  // Output
  if (args.output) {
    writeFileSync(args.output, report);
    console.log(`✅ Report written to: ${args.output}`);
  } else {
    console.log(report);
  }

  // Also output database record as separate JSON file if output specified
  if (args.output) {
    const jsonOutput = args.output.replace(/\.md$/, '.json');
    writeFileSync(jsonOutput, JSON.stringify(dbRecord, null, 2));
    console.log(`✅ Database record written to: ${jsonOutput}`);
  }

  // Exit with appropriate code
  if (auditResult.scores.weightedAverage < 3.5) {
    console.log('\n⚠️  Audit score below threshold (3.5). Prompt needs revision.');
    process.exit(2);
  }

  console.log('\n✅ Audit complete. Score:', auditResult.scores.weightedAverage);
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});