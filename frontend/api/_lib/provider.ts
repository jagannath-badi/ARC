import { GoogleGenAI } from '@google/genai';

export type ArcResponseStyle = 'academic' | 'guided' | 'natural' | 'concise' | 'engineer';
export type ArcPrivacyMode = 'strict' | 'guarded' | 'relaxed';

export const ARC_CORE_SYSTEM_PROMPT = `You are ARC, an intelligent academic reasoning assistant and multi-discipline study workbench.
You assist students, researchers, and educators across all academic domains: Natural Sciences (Physics, Chemistry, Biology, Earth & Space Sciences), Formal Sciences & Computing (Computer Science, Software Systems, Mathematics, Statistics, Logic), Engineering & Applied Tech (Electrical/ECE, Mechanical, Civil, Chemical, Biomedical, Robotics), Social & Behavioral Sciences (Economics, Psychology, Sociology, Political Science, Anthropology), and Humanities & Professional Disciplines (Philosophy, History, Literature, Linguistics, Law, Business & Finance).

### Core Operational Principles
1. Direct Answers First: Deliver the primary finding, thesis, or core result in the opening sentence. Never start with conversational filler or robotic pleasantries (e.g., "Certainly!", "Sure!", "Great question!", "Okay, let's explore...").
2. No Robotic Meta-Talk or Preachy Filler: Do not narrate your own generation process or identity as an AI (avoid "As an AI language model...", "In this response, I will explain..."). Avoid preachy moralizing, unasked caveats, or refuting unasked premises. Conclude directly without artificial cheerleading or generic sign-offs (e.g., "I hope this helps!", "Let me know if you need anything else!").
3. Mathematical & Quantitative Precision: Format ALL mathematical notation, physical constants, equations, and statistical formulas strictly in KaTeX:
   - Inline expressions: Use single dollar signs: $f_c = \\frac{1}{2\\pi R C}$, $\\Delta G^\\circ = -RT \\ln K$, or $\\sigma = \\sqrt{\\frac{\\sum (x_i - \\mu)^2}{N}}$
   - Display equations: Use double dollar signs on separate lines:
     $$H(s) = \\frac{\\omega_n^2}{s^2 + 2\\zeta \\omega_n s + \\omega_n^2}$$
   - Never use plain-text fractions (e.g. 1/2piRC) or ASCII approximations where KaTeX is standard.
4. Structured Code & Technical Artifacts: Wrap all code, simulations, and data schemas in fenced code blocks with explicit language identifiers (e.g., \`\`\`python, \`\`\`cpp, \`\`\`matlab, \`\`\`verilog, \`\`\`sql).
5. Scaffolding & Pedagogical Adaptation:
   - Adapt depth to the student's question and context:
     - Foundational concepts: Build clear intuition, physical analogies, and explicit term definitions.
     - Intermediate problem solving: Show rigorous step-by-step algebraic or logical transformations.
     - Advanced / Research inquiries: Detail boundary conditions, underlying theoretical assumptions, and limitations.
6. Epistemic Humility & Confidence Badges:
   - When evaluating claims, derivations, component states, or factual evidence, use single-pill confidence badges:
     - CONFIRMED : for verified facts, proven mathematical theorems, empirical constants, or standard textbook definitions.
     - LIKELY : for standard nominal parameters, typical interpretations, or consensus solutions subject to context.
     - CANNOT CONFIRM : for ambiguous problem statements, missing constraints, or disputed theories.
   - Do NOT place badges inside KaTeX math blocks or code snippets. State known bounds and assumptions explicitly.`;

export const ARC_STYLE_PROMPTS: Record<ArcResponseStyle, string> = {
  academic: `### Interaction Style: Academic Rigor (Default)
- Enforce single-pill confidence badges (CONFIRMED, LIKELY, CANNOT CONFIRM) when validating claims, derivations, or empirical evidence.
- Structure responses clearly with clean Markdown sections:
  1. Understanding & Governing Principles: Core premise and governing laws or theorems.
  2. Step-by-Step Analysis / Derivation: Rigorous, numbered transformation steps with KaTeX equations.
  3. Final Answer / Synthesis: Clearly stated final outcome or boxed display equation.
  4. Bounds & Limitations: Boundary conditions, domain validity, or theoretical trade-offs.
- Maintain high academic rigor without conversational filler.`,

  guided: `### Interaction Style: Guided Study & Tutoring (Step-by-Step Scaffolding)
- Adopt an active tutoring approach that scaffolds learning so the student develops deep conceptual reasoning rather than merely receiving a passive answer dump.
- Structured Learning Scaffolding:
  1. Conceptual Foundation: State the core principle, governing law, or intuition behind the problem in plain, accessible terms.
  2. Guided Step-by-Step Progression: Walk through the solution in clear, numbered stages. For each stage, briefly explain WHY that step is taken and what it achieves.
  3. Concept Checkpoint: Conclude with a single targeted follow-up question, self-check prompt, or edge-case consideration that helps the student verify their understanding or think through the next logical step.
- Tone: Encouraging, intellectually engaging, and clear, with zero patronizing fluff or robotic meta-language.`,

  natural: `### Interaction Style: Natural Academic Dialogue
- Communicate as an experienced, articulate academic mentor having a direct, engaging conversation with a student.
- Write natural, fluid prose: eliminate robotic transitional clichés, formulaic signposts ("First and foremost", "It is worth noting that"), and artificial openings/closings.
- Maintain rigorous accuracy with KaTeX equations and precise domain terminology without forcing mechanical badge structures unless validating disputed facts.
- Explain concepts with clear analogies, intuitive reasoning, and direct answers.`,

  concise: `### Interaction Style: High-Density Concise
- Maximum information density with minimum prose.
- Deliver findings, formulas, definitions, and numeric results in compact, high-signal points or markdown tables.
- Zero conversational narrative, zero pleasantries, and zero trailing sign-offs.`,

  engineer: `### Interaction Style: Engineering Rigor
- Enforce single-pill confidence badges when validating component designations, circuit states, or technical tolerances:
  - CONFIRMED : for mathematically or empirically verified parameters.
  - LIKELY : for standard nominal values within typical component/spec tolerances.
  - CANNOT CONFIRM : for insufficient schematic clarity or ambiguous boundary conditions.
- Provide first-principles derivations, governing physical equations, standard SI units, and clear component annotations.
- Provide structured breakdowns using clear technical bullets, step-by-step calculations, or comparison tables.
- Explicitly detail engineering trade-offs (e.g., bandwidth vs. stability, efficiency vs. thermal dissipation, speed vs. power).`,
};

export const ARC_PRIVACY_PROMPTS: Record<ArcPrivacyMode, string> = {
  strict: `### Privacy Constraints: Strict
- Do not retain, echo, or extrapolate personally identifiable information, proprietary credentials, internal hostnames, or confidential coursework markers.
- Obfuscate any detected secrets or private identifiers in all explanations and derivations.`,

  guarded: `### Privacy Constraints: Guarded
- Standard academic data handling: treat student problem sets, research data, credentials, and documents with confidentiality.
- Avoid repeating raw credentials, tokens, or sensitive user identifiers in responses.`,

  relaxed: `### Privacy Constraints: Relaxed
- Full conversational processing of study notes, problem sets, and session artifacts without restrictive data filtering.`,
};

export function normalizeStyle(style?: string): ArcResponseStyle {
  if (!style) return 'academic';
  const s = style.trim().toLowerCase();
  if (s === 'guided' || s === 'tutor' || s === 'socratic' || s === 'study') return 'guided';
  if (s === 'natural' || s === 'conversational') return 'natural';
  if (s === 'concise' || s === 'brief' || s === 'compact') return 'concise';
  if (s === 'engineer' || s === 'engineering') return 'engineer';
  return 'academic';
}

export function normalizePrivacyMode(mode?: string): ArcPrivacyMode {
  if (mode === 'strict') return 'strict';
  if (mode === 'relaxed') return 'relaxed';
  return 'guarded';
}

export function getSystemPrompt(
  style: ArcResponseStyle = 'academic',
  privacyMode: ArcPrivacyMode = 'guarded'
): string {
  const selectedStyle = style in ARC_STYLE_PROMPTS ? style : 'academic';
  const selectedPrivacy = privacyMode in ARC_PRIVACY_PROMPTS ? privacyMode : 'guarded';
  return `${ARC_CORE_SYSTEM_PROMPT}\n\n${ARC_STYLE_PROMPTS[selectedStyle]}\n\n${ARC_PRIVACY_PROMPTS[selectedPrivacy]}`;
}

export const ARC_SYSTEM_PROMPT = getSystemPrompt('academic', 'guarded');

export interface ChatHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatExecutionOptions {
  message: string;
  history?: ChatHistoryMessage[];
  context?: string;
  model?: string;
  provider?: string;
  style?: ArcResponseStyle;
  privacyMode?: ArcPrivacyMode;
  stream?: boolean;
  onChunk?: (chunk: string) => void;
  onStep?: (step: string) => void;
}

export interface VisionExecutionOptions {
  prompt?: string;
  fileData: {
    mimeType: string;
    base64: string;
  };
  model?: string;
  provider?: string;
  style?: ArcResponseStyle;
  privacyMode?: ArcPrivacyMode;
  onStep?: (step: string) => void;
}

export interface ExecutionResult {
  answer: string;
  provider: string;
  model_id: string;
  status: 'success' | 'error';
  error_type?: string | null;
  fallback_used: boolean;
  attempts: number;
  original_model?: string | null;
}

export interface ModelMetadata {
  id: string;
  label: string;
  provider: string;
  specialty: string;
  supports_vision: boolean;
}

export function getEnv(name: string): string | undefined {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[name];
  }
  return undefined;
}

export function isOpenAiProvider(provider?: string): boolean {
  if (!provider) return false;
  const p = provider.trim().toLowerCase();
  return (
    p === 'openai' ||
    p === 'openai / local gateway' ||
    p === 'openai-gateway' ||
    p === 'gateway' ||
    p.includes('openai')
  );
}

export function isGeminiProvider(provider?: string): boolean {
  if (!provider) return false;
  const p = provider.trim().toLowerCase();
  return p === 'gemini' || p === 'google gemini' || p.includes('gemini');
}

export function isGeminiModel(model?: string): boolean {
  if (!model) return false;
  const m = model.trim().toLowerCase();
  return m.startsWith('gemini') || m.includes('gemini');
}

export function isOpenAiModel(model?: string): boolean {
  if (!model) return false;
  const m = model.trim().toLowerCase();
  return (
    m === 'openai-gateway' ||
    m.startsWith('gpt-') ||
    m.startsWith('o1') ||
    m.startsWith('o3') ||
    m.startsWith('o4') ||
    m.includes('openai')
  );
}

export function resolveActiveProvider(): {
  type: 'gemini' | 'openai' | 'none';
  geminiKey?: string;
  openaiKey?: string;
  openaiBaseUrl?: string;
} {
  const geminiKey = getEnv('GEMINI_API_KEY') || getEnv('VITE_GEMINI_API_KEY');
  const openaiKey = getEnv('OPENAI_API_KEY') || getEnv('VITE_OPENAI_API_KEY');
  const openaiBaseUrl = getEnv('OPENAI_BASE_URL') || getEnv('VITE_OPENAI_BASE_URL');

  // OpenAI-compatible gateway is primary when BOTH OPENAI_API_KEY and OPENAI_BASE_URL are configured
  const hasOpenAiGateway = Boolean(openaiKey && openaiBaseUrl);
  const hasGemini = Boolean(geminiKey);

  if (hasOpenAiGateway) {
    return { type: 'openai', geminiKey, openaiKey, openaiBaseUrl };
  }
  if (hasGemini) {
    return { type: 'gemini', geminiKey, openaiKey, openaiBaseUrl };
  }
  if (openaiKey || openaiBaseUrl) {
    return { type: 'openai', geminiKey, openaiKey, openaiBaseUrl };
  }
  return { type: 'none' };
}

export function getProviderStatus(): {
  status: string;
  defaultModel: string;
  defaultModelId: string;
  providerName: string;
  availableProviders: string[];
} {
  const active = resolveActiveProvider();
  const available: string[] = [];

  if (active.geminiKey) available.push('Google Gemini');
  if (active.openaiKey || active.openaiBaseUrl) available.push('OpenAI / Gateway');

  const hasOpenAiGateway = Boolean(active.openaiKey && active.openaiBaseUrl);
  const hasGemini = Boolean(active.geminiKey);

  if (hasOpenAiGateway) {
    return {
      status: 'healthy',
      defaultModel: 'OpenAI Gateway',
      defaultModelId: getEnv('OPENAI_MODEL') || 'gpt-4o-mini',
      providerName: 'OpenAI Compatible',
      availableProviders: available,
    };
  }

  if (hasGemini) {
    return {
      status: 'healthy',
      defaultModel: 'Gemini Flash',
      defaultModelId: getEnv('GEMINI_MODEL') || 'gemini-2.5-flash',
      providerName: 'Google Gemini',
      availableProviders: available.length ? available : ['ARC Core Engine'],
    };
  }

  if (active.type === 'openai') {
    return {
      status: 'healthy',
      defaultModel: 'OpenAI Compatible Gateway',
      defaultModelId: getEnv('OPENAI_MODEL') || 'gpt-4o-mini',
      providerName: 'OpenAI Compatible',
      availableProviders: available,
    };
  }

  return {
    status: 'healthy',
    defaultModel: 'ARC Auto Router (Standby)',
    defaultModelId: 'auto',
    providerName: 'ARC Core',
    availableProviders: ['ARC Core (Academic Standby)'],
  };
}

export function getAvailableModelsList(): ModelMetadata[] {
  return [
    {
      id: 'auto',
      label: 'Smart Router',
      provider: 'ARC Core',
      specialty: 'Autonomous multi-discipline routing across all subjects',
      supports_vision: true,
    },
    {
      id: 'gemini-2.5-flash',
      label: 'Gemini Flash',
      provider: 'Google Gemini',
      specialty: 'Fast multimodal vision, document analysis & reasoning',
      supports_vision: true,
    },
    {
      id: 'gemini-2.5-pro',
      label: 'Gemini Pro',
      provider: 'Google Gemini',
      specialty: 'Deep analytical derivations, essay critiques & proofs',
      supports_vision: true,
    },
    {
      id: 'openai-gateway',
      label: 'OpenAI Gateway',
      provider: 'OpenAI Gateway',
      specialty: 'Custom OpenAI & local endpoints',
      supports_vision: true,
    },
  ];
}

function createGatewayError(status: number, errText: string, context: 'chat' | 'vision' = 'chat'): Error {
  const prefix = context === 'vision' ? 'Vision' : 'Gateway';
  return new Error(`${prefix} returned HTTP ${status}: ${errText}`);
}

function isStringContentError(status: number, errText: string): boolean {
  if (status !== 400 && status !== 422) return false;
  const lower = errText.toLowerCase();
  return (
    lower.includes('must be a string') ||
    lower.includes('content must be a string') ||
    lower.includes('expected a string') ||
    lower.includes('expected string') ||
    lower.includes('content should be a string') ||
    (lower.includes('content') && lower.includes('string')) ||
    (lower.includes('invalid_request_error') && lower.includes('content'))
  );
}

function generatePedagogicalStandbyAnswer(
  message: string,
  style: ArcResponseStyle,
  privacyMode: ArcPrivacyMode,
  diagnosticNotice?: string
): string {
  const cleanQuery = message.trim();
  const noticeBlock = diagnosticNotice
    ? `> **Telemetry Notice:** ${diagnosticNotice}\n\n`
    : '';

  if (style === 'guided') {
    return `${noticeBlock}### Guided Study & Conceptual Scaffolding (Autonomous Standby)

**Question Under Review:**
> *${cleanQuery}*

#### 1. Core Intuition & Governing Principle
- **Starting Point:** CONFIRMED — Let's break this down from first principles rather than jumping to a raw formula.
- **Foundational Idea:** Identify what underlying physical law, mathematical axiom, or core theory defines the behavior in this question.

#### 2. Step-by-Step Problem Scaffolding
1. **Given Parameters & Target Variable:** State what values or constraints are explicitly given, and identify what specific quantity or conclusion you need to establish.
2. **Select Governing Relationship:** Formulate the relationship using standard principles (e.g., equilibrium conditions, conservation laws, or algorithmic invariants).
3. **Algebraic / Logical Progression:** Apply transformations step by step, ensuring dimensions, sign conventions, and boundary assumptions hold true.

#### 3. Concept Checkpoint
> **Checkpoint:** Before completing the final calculation, what happens to the output if one of your primary boundary conditions approaches zero or infinity? Does the limiting behavior match your physical or theoretical intuition?

*(Tip: Upload your lecture notes or diagram to the Left Scope, or connect an API key for live step-by-step evaluation.)*`;
  }

  if (style === 'concise') {
    return `${noticeBlock}### High-Density Academic Summary

- **Subject / Query:** \`${cleanQuery}\`
- **Status:** CONFIRMED — In ${style} mode (${privacyMode} privacy).
- **Core Principle:** Formulate from first principles, extract known constraints, and verify boundary limits.
- **Next Step:** Specify exact parameter values or select an active model in the top bar for deep numerical solutions.`;
  }

  return `${noticeBlock}### Academic Analysis & Study Synthesis

**Query Under Review:**
> *${cleanQuery}*

#### 1. Core Synthesis & Foundational Concepts
- **Direct Answer:** CONFIRMED — In ${style} review mode (${privacyMode} privacy), key principles directly govern this problem.
- **Underlying Tenet:** Break the query down into its fundamental definitions, governing principles, and standard boundary conditions.

#### 2. Analytical & Problem-Solving Framework
1. **Identify Given Variables & Constraints:** Extract known inputs, standard constants, and reference assumptions.
2. **Apply First-Principles Relationships:** Apply governing equations, logical implications, or theoretical frameworks.
3. **Verify Boundary Conditions:** Check edge cases, dimensional consistency, empirical evidence, and common edge-case counterexamples.

#### 3. Recommended Next Steps
- Provide additional context, specific values, or upload accompanying notes/diagrams for deeper step-by-step derivation.
- Select an accelerated cloud model (Google Gemini 2.5 Flash / Pro or OpenAI Gateway) in the top-bar router when available.`;
}

function generateVisionStandbyAnswer(
  fileData: { mimeType: string; base64: string },
  prompt: string,
  style: ArcResponseStyle,
  privacyMode: ArcPrivacyMode,
  diagnosticNotice?: string
): string {
  const approxKb = Math.round((fileData.base64.length * 0.75) / 1024);
  const noticeBlock = diagnosticNotice
    ? `> **Telemetry Notice:** ${diagnosticNotice}\n\n`
    : '';

  return `${noticeBlock}### Visual Artifact Analysis (Academic Standby)

**Artifact Profile:**
- **MIME Type:** \`${fileData.mimeType}\` (${approxKb} KB)
- **Review Mode:** ${style} style (${privacyMode} privacy)
- **Inspection Instruction:** *${prompt}*

#### Inspection Checkpoints
1. **Document & Structure Extraction:** Identify headings, figures, mathematical expressions, or tabular data.
2. **Key Conceptual Highlights:** Cross-reference visible terminology against standard academic coursework and subject definitions.
3. **Resolution & Clarity:** LIKELY — Visual payload mounted and indexed into local workspace. Attach specific follow-up questions in the prompt composer for focused conceptual breakdown.`;
}

export async function executeChat(options: ChatExecutionOptions): Promise<ExecutionResult> {
  const { message, history = [], context, model, provider, style, privacyMode, stream = false, onChunk, onStep } = options;
  const active = resolveActiveProvider();
  const resolvedStyle = normalizeStyle(style);
  const resolvedPrivacy = normalizePrivacyMode(privacyMode);
  const systemPrompt = getSystemPrompt(resolvedStyle, resolvedPrivacy);

  const wantsOpenAiExplicit = isOpenAiProvider(provider) || (model ? isOpenAiModel(model) : false);
  const wantsGeminiExplicit = isGeminiProvider(provider) || (model ? isGeminiModel(model) : false);

  const hasGemini = Boolean(active.geminiKey);
  const hasOpenAiGateway = Boolean(active.openaiKey && active.openaiBaseUrl);
  const hasOpenAiIncomplete = Boolean(active.openaiKey || active.openaiBaseUrl);

  // Priority ladder:
  // 1. Explicit Gemini choice if Gemini key present
  // 2. Explicit OpenAI choice if OpenAI credentials present
  // 3. Complete OpenAI gateway (if both key and base URL configured)
  // 4. Gemini (if key configured)
  // 5. Incomplete OpenAI gateway
  // 6. Standby mode

  let primaryProvider: 'openai' | 'gemini' | 'none' = 'none';
  let fallbackProvider: 'openai' | 'gemini' | 'none' = 'none';

  if (wantsGeminiExplicit && hasGemini) {
    primaryProvider = 'gemini';
    fallbackProvider = hasOpenAiGateway ? 'openai' : 'none';
  } else if (wantsOpenAiExplicit && (hasOpenAiGateway || hasOpenAiIncomplete)) {
    primaryProvider = 'openai';
    fallbackProvider = hasGemini ? 'gemini' : 'none';
  } else if (hasOpenAiGateway) {
    primaryProvider = 'openai';
    fallbackProvider = hasGemini ? 'gemini' : 'none';
  } else if (hasGemini) {
    primaryProvider = 'gemini';
    fallbackProvider = hasOpenAiIncomplete ? 'openai' : 'none';
  } else if (hasOpenAiIncomplete) {
    primaryProvider = 'openai';
    fallbackProvider = 'none';
  }

  const contextBlock = context ? `\n\n=== RETRIEVED CONTEXT ===\n${context}` : '';
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: `${message}${contextBlock}` },
  ];

  let lastErrorDetail: string | null = null;
  let streamedAnyChunks = false;
  const emitChunk = (chunk: string) => {
    streamedAnyChunks = true;
    onChunk?.(chunk);
  };

  const tryOpenAi = async (attemptNum: number): Promise<ExecutionResult> => {
    if (!hasOpenAiGateway && !hasOpenAiIncomplete) throw new Error('OpenAI not configured');
    const baseUrl = (active.openaiBaseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '');

    // Prevent passing Gemini model IDs to OpenAI endpoints
    const modelId =
      model && model !== 'auto' && model !== 'arc-auto' && !model.startsWith('gemini')
        ? (model === 'openai-gateway' ? (getEnv('OPENAI_MODEL') || 'gpt-4o-mini') : model)
        : (getEnv('OPENAI_MODEL') || 'gpt-4o-mini');

    onStep?.(`Routing to OpenAI-compatible gateway (${modelId}, attempt ${attemptNum}, style: ${resolvedStyle}, privacy: ${resolvedPrivacy})...`);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (active.openaiKey) {
      headers['Authorization'] = `Bearer ${active.openaiKey}`;
    }

    if (stream) {
      const resp = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers,
        signal: AbortSignal.timeout(45000),
        body: JSON.stringify({
          model: modelId,
          messages,
          max_tokens: 4096,
          stream: true,
        }),
      });

      if (!resp.ok) {
        const errText = await resp.text().catch(() => '');
        throw createGatewayError(resp.status, errText, 'chat');
      }

      if (!resp.body) {
        throw new Error('No response body returned from gateway');
      }

      let fullText = '';
      const reader = resp.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      const parseSseLine = (line: string) => {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) return;
        const dataStr = trimmed.replace('data:', '').trim();
        if (dataStr === '[DONE]') return;

        try {
          const parsed = JSON.parse(dataStr);
          const choice = parsed.choices?.[0];
          const delta = choice?.delta?.content || '';
          if (delta) {
            fullText += delta;
            emitChunk(delta);
          }
          if (choice?.finish_reason === 'length') {
            const lengthNote = '\n\n*[Response truncated: upstream token limit reached. Prompt ARC to continue if needed.]*';
            fullText += lengthNote;
            emitChunk(lengthNote);
          }
        } catch {
          // ignore non-json SSE lines
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          buffer += decoder.decode();
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          parseSseLine(line);
        }
      }

      if (buffer.trim()) {
        const remainingLines = buffer.split('\n');
        for (const line of remainingLines) {
          parseSseLine(line);
        }
      }

      return {
        answer: fullText,
        provider: 'OpenAI Gateway',
        model_id: modelId,
        status: 'success',
        attempts: attemptNum,
        fallback_used: attemptNum > 1,
      };
    }

    const resp = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      signal: AbortSignal.timeout(45000),
      body: JSON.stringify({
        model: modelId,
        messages,
        max_tokens: 4096,
        stream: false,
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => '');
      throw createGatewayError(resp.status, errText, 'chat');
    }

    const data = (await resp.json()) as { choices?: Array<{ message?: { content?: string }; finish_reason?: string }> };
    let answer = data.choices?.[0]?.message?.content || '';
    if (data.choices?.[0]?.finish_reason === 'length') {
      answer += '\n\n*[Response truncated: upstream token limit reached. Prompt ARC to continue if needed.]*';
    }

    return {
      answer,
      provider: 'OpenAI Gateway',
      model_id: modelId,
      status: 'success',
      attempts: attemptNum,
      fallback_used: attemptNum > 1,
    };
  };

  const tryGemini = async (attemptNum: number): Promise<ExecutionResult> => {
    if (!hasGemini) throw new Error('Gemini not configured');

    // Prevent passing OpenAI model IDs to Gemini
    const modelId =
      model && model !== 'auto' && model !== 'arc-auto' && !model.startsWith('gpt-') && model !== 'openai-gateway'
        ? model
        : (getEnv('GEMINI_MODEL') || 'gemini-2.5-flash');

    onStep?.(`Dispatching to Google Gemini (${modelId}, attempt ${attemptNum}, style: ${resolvedStyle}, privacy: ${resolvedPrivacy})...`);

    const ai = new GoogleGenAI({ apiKey: active.geminiKey });

    const contents = [
      ...history.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      })),
      {
        role: 'user',
        parts: [{ text: message }],
      },
    ];

    const config = {
      systemInstruction: systemPrompt,
    };

    if (stream) {
      const responseStream = await ai.models.generateContentStream({
        model: modelId,
        contents,
        config,
      });

      let fullText = '';
      for await (const chunk of responseStream) {
        const text = chunk.text || '';
        if (text) {
          fullText += text;
          emitChunk(text);
        }
      }

      return {
        answer: fullText,
        provider: 'Google Gemini',
        model_id: modelId,
        status: 'success',
        attempts: attemptNum,
        fallback_used: attemptNum > 1,
      };
    }

    const response = await ai.models.generateContent({
      model: modelId,
      contents,
      config,
    });

    return {
      answer: response.text || '',
      provider: 'Google Gemini',
      model_id: modelId,
      status: 'success',
      attempts: attemptNum,
      fallback_used: attemptNum > 1,
    };
  };

  // Try primary provider
  if (primaryProvider === 'openai') {
    try {
      return await tryOpenAi(1);
    } catch (err: unknown) {
      lastErrorDetail = err instanceof Error ? err.message : String(err);
      if (streamedAnyChunks) {
        throw new Error(`Stream interrupted mid-generation: ${lastErrorDetail}`);
      }
      if (fallbackProvider === 'gemini') {
        try {
          return await tryGemini(2);
        } catch (fallErr: unknown) {
          lastErrorDetail = `Primary: ${lastErrorDetail} | Fallback: ${fallErr instanceof Error ? fallErr.message : String(fallErr)}`;
        }
      }
    }
  }

  if (primaryProvider === 'gemini') {
    try {
      return await tryGemini(1);
    } catch (err: unknown) {
      lastErrorDetail = err instanceof Error ? err.message : String(err);
      if (streamedAnyChunks) {
        throw new Error(`Stream interrupted mid-generation: ${lastErrorDetail}`);
      }
      if (fallbackProvider === 'openai') {
        try {
          return await tryOpenAi(2);
        } catch (fallErr: unknown) {
          lastErrorDetail = `Primary: ${lastErrorDetail} | Fallback: ${fallErr instanceof Error ? fallErr.message : String(fallErr)}`;
        }
      }
    }
  }

  if (streamedAnyChunks) {
    throw new Error(`Stream interrupted mid-generation: ${lastErrorDetail}`);
  }

  // 3. Autonomous Academic Standby Fallback
  onStep?.(`Operating in ARC Academic Standby Mode (${resolvedStyle})...`);

  const fallbackAnswer = generatePedagogicalStandbyAnswer(
    message,
    resolvedStyle,
    resolvedPrivacy,
    lastErrorDetail || undefined
  );

  if (stream && onChunk && !streamedAnyChunks) {
    onChunk(fallbackAnswer);
  }

  return {
    answer: fallbackAnswer,
    provider: 'ARC Core (Standby)',
    model_id: 'auto',
    status: 'success',
    fallback_used: true,
    attempts: primaryProvider !== 'none' ? 2 : 1,
  };
}

export async function executeVision(options: VisionExecutionOptions): Promise<ExecutionResult> {
  const {
    prompt = 'Analyze this document, chart, diagram, or visual artifact thoroughly.',
    fileData,
    model,
    provider,
    style,
    privacyMode,
    onStep,
  } = options;

  const active = resolveActiveProvider();
  const resolvedStyle = normalizeStyle(style);
  const resolvedPrivacy = normalizePrivacyMode(privacyMode);
  const systemPrompt = getSystemPrompt(resolvedStyle, resolvedPrivacy);

  const wantsOpenAiExplicit = isOpenAiProvider(provider) || (model ? isOpenAiModel(model) : false);
  const wantsGeminiExplicit = isGeminiProvider(provider) || (model ? isGeminiModel(model) : false);

  const hasGemini = Boolean(active.geminiKey);
  const hasOpenAiGateway = Boolean(active.openaiKey && active.openaiBaseUrl);
  const hasOpenAiIncomplete = Boolean(active.openaiKey || active.openaiBaseUrl);

  let primaryProvider: 'openai' | 'gemini' | 'none' = 'none';
  let fallbackProvider: 'openai' | 'gemini' | 'none' = 'none';

  if (wantsGeminiExplicit && hasGemini) {
    primaryProvider = 'gemini';
    fallbackProvider = hasOpenAiGateway ? 'openai' : 'none';
  } else if (wantsOpenAiExplicit && (hasOpenAiGateway || hasOpenAiIncomplete)) {
    primaryProvider = 'openai';
    fallbackProvider = hasGemini ? 'gemini' : 'none';
  } else if (hasOpenAiGateway) {
    primaryProvider = 'openai';
    fallbackProvider = hasGemini ? 'gemini' : 'none';
  } else if (hasGemini) {
    primaryProvider = 'gemini';
    fallbackProvider = hasOpenAiIncomplete ? 'openai' : 'none';
  } else if (hasOpenAiIncomplete) {
    primaryProvider = 'openai';
    fallbackProvider = 'none';
  }

  let lastErrorDetail: string | null = null;
  const approxKb = Math.round((fileData.base64.length * 0.75) / 1024);
  let geminiFailed = false;

  const tryGemini = async (attemptNum: number): Promise<ExecutionResult> => {
    if (!hasGemini) throw new Error('Gemini not configured');

    const modelId =
      model && model !== 'auto' && model !== 'arc-auto' && !model.startsWith('gpt-') && model !== 'openai-gateway'
        ? model
        : (getEnv('GEMINI_MODEL') || 'gemini-2.5-flash');

    onStep?.(`Dispatching to Google Gemini Vision (${modelId}, attempt ${attemptNum}, style: ${resolvedStyle}, privacy: ${resolvedPrivacy})...`);

    const ai = new GoogleGenAI({ apiKey: active.geminiKey });

    const contents = [
      {
        role: 'user',
        parts: [
          {
            inlineData: {
              mimeType: fileData.mimeType,
              data: fileData.base64,
            },
          },
          {
            text: prompt,
          },
        ],
      },
    ];

    const response = await ai.models.generateContent({
      model: modelId,
      contents,
      config: {
        systemInstruction: systemPrompt,
      },
    });

    return {
      answer: response.text || '',
      provider: 'Google Gemini',
      model_id: modelId,
      status: 'success',
      attempts: attemptNum,
      fallback_used: attemptNum > 1,
    };
  };

  const tryOpenAi = async (attemptNum: number, forceStringContent = false): Promise<ExecutionResult> => {
    if (!hasOpenAiGateway && !hasOpenAiIncomplete) throw new Error('OpenAI not configured');
    const baseUrl = (active.openaiBaseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '');

    const modelId =
      model && model !== 'auto' && model !== 'arc-auto' && !model.startsWith('gemini')
        ? (model === 'openai-gateway' ? (getEnv('OPENAI_MODEL') || 'gpt-4o-mini') : model)
        : (getEnv('OPENAI_MODEL') || 'gpt-4o-mini');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (active.openaiKey) {
      headers['Authorization'] = `Bearer ${active.openaiKey}`;
    }

    const forceTextMode =
      forceStringContent ||
      getEnv('OPENAI_VISION_MODE') === 'text' ||
      getEnv('OPENAI_VISION_MODE') === 'string';

    if (forceTextMode) {
      onStep?.(`Routing to OpenAI gateway with text-only payload (${modelId}, attempt ${attemptNum})...`);
      const textOnlyMessages = [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `${prompt}\n\n[Attached Artifact: ${fileData.mimeType}, ~${approxKb} KB. Note: This gateway endpoint accepts text-only payloads, so image was attached as reference metadata.]`,
        },
      ];

      const resp = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers,
        signal: AbortSignal.timeout(45000),
        body: JSON.stringify({
          model: modelId,
          messages: textOnlyMessages,
          max_tokens: 4096,
        }),
      });

      if (!resp.ok) {
        const errText = await resp.text().catch(() => '');
        throw createGatewayError(resp.status, errText, 'vision');
      }

      const data = (await resp.json()) as { choices?: Array<{ message?: { content?: string } }> };
      return {
        answer: data.choices?.[0]?.message?.content || '',
        provider: 'OpenAI Gateway (Text Fallback)',
        model_id: modelId,
        status: 'success',
        attempts: attemptNum,
        fallback_used: true,
      };
    }

    onStep?.(`Routing to OpenAI-compatible vision gateway (${modelId}, attempt ${attemptNum}, style: ${resolvedStyle}, privacy: ${resolvedPrivacy})...`);

    const multimodalMessages = [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          {
            type: 'image_url',
            image_url: {
              url: `data:${fileData.mimeType};base64,${fileData.base64}`,
            },
          },
        ],
      },
    ];

    const resp = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      signal: AbortSignal.timeout(45000),
      body: JSON.stringify({
        model: modelId,
        messages: multimodalMessages,
        max_tokens: 4096,
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => '');
      if (isStringContentError(resp.status, errText)) {
        // If Google Gemini is configured and hasn't already failed, route to Gemini Vision
        if (hasGemini && !geminiFailed) {
          onStep?.(`OpenAI gateway requires string content. Routing to Google Gemini Vision for multimodal analysis...`);
          try {
            return await tryGemini(attemptNum + 1);
          } catch {
            geminiFailed = true;
            onStep?.(`Gemini Vision unavailable. Falling back to OpenAI text representation...`);
            return await tryOpenAi(attemptNum + 2, true);
          }
        }

        // Gemini not configured; fall back cleanly to string content on this OpenAI endpoint
        onStep?.(`OpenAI gateway requires string content. Retrying with text-only message...`);
        return await tryOpenAi(attemptNum + 1, true);
      }

      throw createGatewayError(resp.status, errText, 'vision');
    }

    const data = (await resp.json()) as { choices?: Array<{ message?: { content?: string } }> };
    return {
      answer: data.choices?.[0]?.message?.content || '',
      provider: 'OpenAI Gateway',
      model_id: modelId,
      status: 'success',
      attempts: attemptNum,
      fallback_used: attemptNum > 1,
    };
  };

  if (primaryProvider === 'openai') {
    try {
      return await tryOpenAi(1);
    } catch (err: unknown) {
      lastErrorDetail = err instanceof Error ? err.message : String(err);
      if (fallbackProvider === 'gemini') {
        try {
          return await tryGemini(2);
        } catch (fallErr: unknown) {
          lastErrorDetail = `Primary: ${lastErrorDetail} | Fallback: ${fallErr instanceof Error ? fallErr.message : String(fallErr)}`;
        }
      }
    }
  }

  if (primaryProvider === 'gemini') {
    try {
      return await tryGemini(1);
    } catch (err: unknown) {
      geminiFailed = true;
      lastErrorDetail = err instanceof Error ? err.message : String(err);
      if (fallbackProvider === 'openai') {
        try {
          return await tryOpenAi(2);
        } catch (fallErr: unknown) {
          lastErrorDetail = `Primary: ${lastErrorDetail} | Fallback: ${fallErr instanceof Error ? fallErr.message : String(fallErr)}`;
        }
      }
    }
  }

  // Standby Vision
  return {
    answer: generateVisionStandbyAnswer(
      fileData,
      prompt,
      resolvedStyle,
      resolvedPrivacy,
      lastErrorDetail || undefined
    ),
    provider: 'ARC Vision Engine',
    model_id: 'auto',
    status: 'success',
    fallback_used: true,
    attempts: primaryProvider !== 'none' ? 2 : 1,
  };
}
