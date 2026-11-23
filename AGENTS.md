# ARC — AI Coding Agent Guidelines & Operating Manual

This document provides mandatory operational instructions, verified commands, architectural boundaries, and implementation patterns for AI coding agents working on the **ARC** codebase.

---

## 1. Project Architecture & Standards

ARC is an AI-powered multi-discipline academic workbench for students, researchers, and professional practitioners across STEM, Formal Sciences, Applied Technology, and Humanities.

The architecture consists of a unified, pure **TypeScript on Node.js API layer** integrated seamlessly with a **React 19 + TypeScript + Vite 8 + Tailwind CSS v4 + Framer Motion** frontend.

### Core Architectural Invariants

- **2D "Deep Obsidian" Engineering Theme**:
  - Base canvas: `#05060F` (Deep Obsidian) with technical dot grid overlay (`.arc-dot-grid`).
  - Elevated surfaces: `#0B0D1D` (cards & viewports) and `#10132A` (elevated modals, command palette, hover states).
  - Crisp 1px borders: `#1B2042` and `rgba(43, 59, 255, 0.22)`.
  - Primary active accent: `#2B3BFF` (Electric Indigo) for focus rings, action triggers, and formula telemetry.
  - Precision telemetry accent: `#35FEE4` (Tropical Mint) used sparingly for live streaming cursors, cognitive telemetry shimmer, and verified tokens.
  - Text hierarchy: `#F4F6FB` (primary text), `#94A3B8` (secondary), and `#64748B` (muted metadata).
- **Pure TypeScript / Node.js Stack**: The application runs completely on TypeScript and Node.js. Serverless API routes reside in `frontend/api/` and are executed by Vite's built-in dev middleware during development and as Node.js serverless functions in cloud/Vercel production.
- **Frontend / API Separation**: All client-side code lives in `frontend/src/` and all serverless API endpoints live in `frontend/api/`. `frontend/` must remain 100% free of Python files, scripts, or tooling.
- **LLM-First RAG Intelligence Gateway**: Query orchestration and multimodal vision route through an LLM-first RAG gateway (`OmniRoute`, `FreeLLMAPI`, Google Gemini 2.5 Flash / Pro, and OpenAI-compatible gateways).

---

## 2. Project Directory Structure

```text
CircuitSnap/
├── AGENTS.md                   # Agent guidelines & operating boundaries
├── README.md                   # Project overview & documentation
├── docs/                       # Architectural and engineering specifications
│   └── ARCHITECTURE.md         # Comprehensive system architecture specification
└── frontend/                   # Unified React + TypeScript + Node.js Application
    ├── index.html              # HTML shell with #05060F zero-flash background & SVG favicon
    ├── package.json            # Scripts: dev, build, lint, preview & dependencies
    ├── vite.config.ts          # Vite config with React, Tailwind v4, and integrated API middleware
    ├── vercel.json             # Vercel deployment & rewrite configuration
    ├── tsconfig.json           # Project references configuration
    ├── tsconfig.app.json       # App TypeScript configuration
    ├── tsconfig.node.json      # Node & API routes TypeScript configuration
    ├── api/                    # TypeScript Serverless API Routes
    │   ├── _lib/
    │   │   ├── http.ts         # Request/response helpers & body parsers
    │   │   └── provider.ts     # Provider routing (Google Gemini, OmniRoute, FreeLLMAPI, fallback)
    │   ├── health.ts           # GET /api/health endpoint
    │   ├── chat.ts             # POST /api/chat & /api/chat/stream endpoint (SSE streaming)
    │   ├── analyze.ts          # POST /api/analyze endpoint (multimodal schematic analysis)
    │   ├── models.ts           # GET /api/models endpoint
    │   ├── vault.ts            # Saved engineering sessions & vault store
    │   ├── learn.ts            # Knowledge vault stats & feedback endpoints
    │   └── auth.ts             # Operator profile & authentication endpoints
    └── src/
        ├── main.tsx            # React root, index.css, and KaTeX imports
        ├── App.tsx             # ARC workbench shell, state machines, DUT scope
        ├── api.ts              # Frontend API client wrappers
        ├── index.css           # 2D Deep Obsidian tokens, custom scrollbars, KaTeX styling
        ├── components/         # ARC UI components
        │   ├── ArcTopBar.tsx   # Top telemetry bar & ARC geometric mark
        │   ├── ArcSessionRail.tsx # Collapsible session history rail
        │   ├── ArcHero.tsx     # Focused engineering hero studio
        │   ├── ArcComposer.tsx # Multi-discipline prompt composer
        │   ├── ArcCommandPalette.tsx # Command palette (Ctrl+K / Cmd+K)
        │   ├── DiagnosticFeed.tsx # Real-time chat & diagnostic response feed
        │   └── VaultDrawer.tsx # Slide-over Knowledge Vault
        └── hooks/              # Custom hooks (file attachment, voice, etc.)
```

---

## 3. Verified Development & Verification Commands

All agents must use the following exact commands from the `frontend/` directory (`cd frontend`):

### Development Server (Port 5173)

Runs both the React workbench and all integrated TypeScript API routes:

```powershell
npm run dev
```

### Static Linter (`oxlint`)

```powershell
npm run lint
```

### TypeScript Typecheck & Production Build (`tsc -b && vite build`)

```powershell
npm run build
```

### Production Preview

```powershell
npm run preview
```

---

## 4. TypeScript Serverless API Endpoints (`frontend/api/`)

1. **`GET /api/health`**
   - Returns: `HealthResponse` (`{ status: "healthy", models: { default, model_id, provider, available_providers } }`)

2. **`POST /api/chat`**
   - Accepts JSON `ChatRequest`:
     - `message`: `str` (required, non-empty)
     - `history`: `list[ChatMessage]` (`role`: `'user'` | `'assistant'`, `content`: `str`)
     - `model` / `model_id`: `str | undefined`
     - `provider`: `str | undefined`
     - `style`: `'engineer'` | `'natural'` | `'concise'` (optional)
     - `privacy_mode`: `'strict'` | `'guarded'` | `'relaxed'` (optional)
     - `stream`: `boolean` (optional, default `false`)
   - When `stream: true` (or `Accept: text/event-stream`), streams SSE events: `event: step`, `event: chunk`, `event: done`, `event: error`.
   - When non-streaming, returns JSON `ChatResponse`:
     - `{ answer, provider, model_id, status: "success" | "error", error_type, fallback_used, attempts }`

3. **`POST /api/analyze`**
   - Accepts JSON payload:
     - `image`: Base64 data URL or raw base64 string
     - `mime_type`: Image MIME type (e.g., `image/png`, `image/jpeg`, `image/webp`)
     - `prompt`: `str` (optional analysis instruction)
     - `model`, `provider`, `model_id`: `str | undefined`
   - Returns JSON `ChatResponse`.

4. **`GET /api/models`**
   - Returns available model routing options and specialties across Gemini, OpenAI-compatible gateways (`OmniRoute`, `FreeLLMAPI`), and ARC Core.

---

## 5. Provider Routing, RAG Gateway & Security Isolation

1. **Zero Secret Exposure**:
   - Never read, grep, log, or disclose `.env`, `.env.local`, or environment API keys.
   - Do NOT log raw authorization headers or credentials in stdout or responses.

2. **Provider Resolution (`frontend/api/_lib/provider.ts`)**:
   - **Google Gemini**: Uses `@google/genai` when `GEMINI_API_KEY` is configured in the environment (defaults to `gemini-2.5-flash` with optional `gemini-2.5-pro`).
   - **OpenAI-Compatible Gateway**: Uses `OPENAI_API_KEY` and optional `OPENAI_BASE_URL` (supporting `OmniRoute`, `FreeLLMAPI`, cloud proxies, or local Ollama / vLLM).
   - **Diagnostic Standby Mode**: If no credentials are configured, ARC operates in a clean Diagnostic Standby Mode that clearly explains how to configure keys, never crashing or emitting blank assistant bubbles.
   - **Strict Prohibition on Groq**: Groq endpoints and integrations are strictly prohibited (`no Groq`).

3. **Provider Failover**:
   - `frontend/api/_lib/provider.ts` manages automated provider and model fallback (e.g., primary cloud provider failing over to local gateway or diagnostic standby). Agents must not circumvent or strip the fallback logic.

---

## 6. Frontend DUT State & Object URL Lifecycle

In `frontend/src/App.tsx`, image handling relies on two separate state tracks to ensure both persistent inspection and clean memory disposal:

1. **Draft Composer Attachment (`attachedFile`, `imagePreview`)**:
   - Represents the pending file attached to the input bar.
   - Cleared immediately upon sending a message (`removeAttachedFile()`) so subsequent follow-up text queries in the conversation do not re-upload the image payload.

2. **Persistent Active DUT (`activeDutImage`, `activeDutName`)**:
   - Represents the active **Device Under Test** mounted in the Left Optical Scope.
   - Pinned into state via `handleFileSelect(file)` (triggered by drop, file browse, or global clipboard paste `Ctrl+V`).
   - Persists in the Left Scope across multi-turn chat iterations even after `attachedFile` is cleared.

3. **Lifecycle & Cleanup Methods**:
   - **`activeObjectUrlsRef`**: A `useRef<Set<string>>(new Set())` tracking every generated `URL.createObjectURL(file)`.
   - **`removeAttachedFile()`**: Clears draft state; revokes `imagePreview` *only* if it does not match `activeDutImage`.
   - **`handleEjectDut()`**: Resets `activeDutImage` and `activeDutName` to `null` and returns the Left Scope to the standby reticle.
   - **`handleClearChat()` (Reset Bench)**: Revokes all URLs in `activeObjectUrlsRef`, clears messages, unmounts the active DUT, and resets error state.
   - **Unmount Hook**: An unmount `useEffect` revokes all active URLs in `activeObjectUrlsRef`.

---

## 7. Markdown, KaTeX & Single-Pill Badges

Before modifying formatting or rendering components in `frontend/src/App.tsx` or `frontend/src/components/`, inspect the current pipeline:

### Unified Markdown Pipeline

```tsx
<ReactMarkdown
  remarkPlugins={[remarkGfm, remarkMath]}
  rehypePlugins={[rehypeKatex, rehypeConfidenceBadges]}
  components={markdownComponents}
>
  {msg.content}
</ReactMarkdown>
```

### 1. Single-Pill Confidence Badges (`rehypeConfidenceBadges`)

- **AST-Level Processing**: Replaces confidence tokens directly inside HTML Abstract Syntax Tree (HAST) text nodes to prevent duplicate or triple-nested borders.
- **Tokens Caught & Deep Obsidian Styling**:
  - `CONFIRMED` (with optional `[]`, `:`, or `—`) -> emerald badge (`badge-success`: `bg-emerald-500/15 text-emerald-400 border border-emerald-500/35`).
  - `LIKELY` (with optional `[]`, `:`, or `—`) -> amber badge (`badge-warm`: `bg-amber-500/15 text-amber-400 border border-amber-500/35`).
  - `CANNOT CONFIRM` (with optional `[]`, `:`, or `—`) -> rose badge (`badge-danger`: `bg-rose-500/15 text-rose-400 border border-rose-500/35`).
- **Safety Boundaries**: Skips `<code>`, `<pre>`, and nodes containing `.katex` classes to prevent corrupting code snippets or formulas.
- **Rule**: Never reintroduce badge parsing into parent wrappers (`li`, `p`, `span`, `strong`).

### 2. KaTeX Math Notation

- **Dependencies**: `katex`, `remark-math`, `rehype-katex`, with stylesheet `katex/dist/katex.min.css` imported in `frontend/src/main.tsx`.
- **Supported Syntax**:
  - Inline math: `$f_c = \frac{1}{2\pi R C}$`
  - Display blocks: `$$A_v = -\frac{R_f}{R_{in}}$$`
- **Styling Overrides on Deep Obsidian** (`frontend/src/index.css`):
  - `.katex-display`: Horizontally scrollable on small screens (`overflow-x: auto`), overflow-y hidden, with `padding: 0.75rem 1rem`, background `#0B0D1D`, 1px border `#1B2042`, and 2px `#2B3BFF` left telemetry accent.
  - `.katex`: Scaled to `1.05em` with `text-rendering: auto` and text color `#F4F6FB`.

---

## 8. Verification Protocol & Git Discipline

Before marking any task as complete:

1. **Lint Check**: Run `npm run lint` inside `frontend/` (0 warnings, 0 errors).
2. **Build Check**: Run `npm run build` inside `frontend/` (`tsc -b && vite build` exit code 0).
3. **Git Diff Review**: Check `git status` and `git diff` to ensure no unexpected or destructive changes were made.
4. **Git Authorization Rule**: **Never** run `git commit`, `git push`, `git reset`, or `git checkout --` without explicit user instruction.

---

## 9. Mandatory Analyze-First & Thorough Verification Protocol

Before modifying, creating, or deleting any file in the repository, every coding agent must follow this sequence on **every** prompt:

1. **Analyze Folders & Files First:** Thoroughly inspect all relevant folders, files, imports, types, props, hooks, styles, and API routes before proposing or applying edits.
2. **Verify Exact Details (No Guesswork):** Never guess file contents, symbol names, prop shapes, state setters, or error paths. Confirm exact behavior across all affected files first, and state what was inspected and verified.
3. **Strict Frontend / Backend Separation:** Keep `frontend/` strictly TypeScript, React, Vite, Tailwind CSS, and Framer Motion (`framer-motion`) with zero `.py` files, and leave existing `backend/` and root `.py` files untouched unless explicitly requested.
4. **Verify Thoroughly After Editing:** Run `npm run lint` and `npm run build` in `frontend/`, and verify edge cases (such as input clearing and failed/502 error states) before finishing.
