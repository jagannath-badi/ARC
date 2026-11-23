# ARC — 2D Deep Obsidian Academic Workbench ⚡

> AI-powered multi-discipline academic reasoning assistant, optical diagnostic scope, and precision mathematical workbench.

ARC is a high-craft academic reasoning assistant engineered for students, researchers, and professional practitioners across the sciences, mathematics, computing, engineering, and humanities disciplines.

It combines an **LLM-first RAG intelligence gateway**, **optical schematic & artifact inspection**, and **exact mathematical KaTeX synthesis** within a focused **2D "Deep Obsidian"** academic reasoning workspace:

$$\text{See} \longrightarrow \text{Derive} \longrightarrow \text{Verify} \longrightarrow \text{Master}$$

---

## 🎨 2D "Deep Obsidian" Engineering Design System

ARC is built with a high-contrast, technical 2D aesthetic engineered for long research sessions and zero visual fatigue:

- **Base Canvas (`#05060F`)**: Deep Obsidian canvas with an architectural coordinate dot grid overlay (`.arc-dot-grid`).
- **Elevated Surfaces (`#0B0D1D` / `#10132A`)**: Multi-tiered technical cards, inspection viewports, and drawers with subtle specular highlights.
- **Crisp 1px Borders (`#1B2042` / `rgba(43, 59, 255, 0.22)`)**: Razor-sharp micro-borders for clear component boundary separation.
- **Electric Indigo Primary Accent (`#2B3BFF`)**: High-visibility focus rings, active triggers, and mathematical telemetry markers.
- **Tropical Mint Precision Telemetry (`#35FEE4`)**: Used sparingly for live streaming cursors, cognitive telemetry shimmer, and verified token highlights.
- **Typography Hierarchy**: Crisp `#F4F6FB` primary text, `#94A3B8` secondary descriptions, and `#64748B` muted technical metadata in Inter, Plus Jakarta Sans, and JetBrains Mono.

---

## ✨ Core Capabilities

### 🧠 Multi-Discipline Engineering Intelligence
- **Applied Mathematics**: Differential equations, linear algebra, Laplace/Z-transforms, Fourier analysis, and boundary-value derivations.
- **Circuits & Systems**: Analog/digital electronics, network theorems, filter synthesis, signals & systems, and hardware diagnostics.
- **Computing & Architecture**: Algorithms, complexity analysis, computer systems architecture, digital logic, and network protocol analysis.
- **Mechanics & Thermodynamics**: Statics, dynamics, fluid mechanics, heat transfer, and structural equilibrium.
- **Response Styles**: Switchable between `Engineering Rigor` (first-principles derivations & trade-offs), `Natural Dialogue` (direct engineer-to-engineer peer exchange), and `High-Density Concise` (pure formulas & numeric tables).

### 🔬 Optical Scope & Multimodal Hardware Diagnostics
Upload circuit schematics, breadboard photos, component markings, or lab notes for evidence-graded visual analysis:
- Employs strict, single-pill confidence badges:
  - `CONFIRMED` (directly visible and empirically/mathematically verified).
  - `LIKELY` (standard nominal values within typical engineering tolerances).
  - `CANNOT CONFIRM` (insufficient visual clarity, missing pinout labels, or ambiguous boundary conditions).
- Zero fabrication of unverified pinouts, component ratings, or electrical continuity.

### 📐 Precision KaTeX Mathematical Rendering
- Complete LaTeX mathematical typesetting rendered cleanly on Deep Obsidian:
  - Inline expressions: $f_c = \frac{1}{2\pi R C}$
  - Display blocks: $$A_v = -\frac{R_f}{R_{in}}$$
- Horizontally scrollable `.katex-display` containers prevent formula clipping on mobile or split viewports.

### 🗄️ Knowledge Vault & Session History
- Pin derivations, calculations, and diagnostic reports to the slide-over **Knowledge Vault**.
- Collapsible **Session Rail** tracks multi-turn engineering threads with instant reload.

---

## 🤖 LLM-First RAG Gateway & Model Routing

ARC dispatches queries through an **LLM-First RAG Intelligence Gateway** with automatic failover and clean standby operation:

| Engine / Model | Provider / Routing | Vision | Primary Specialty |
| :--- | :--- | :---: | :--- |
| **Google Gemini 2.5 Flash** | `@google/genai` (Cloud) | ✅ | Ultra-fast multimodal reasoning & high-precision KaTeX synthesis |
| **Google Gemini 2.5 Pro** | `@google/genai` (Cloud) | ✅ | Deep symbolic derivation, complex system architectures & proofs |
| **OpenAI-Compatible Gateway** | `OmniRoute` / `FreeLLMAPI` / vLLM / Ollama | ✅ | Cloud proxy or 100% offline local model inference |
| **ARC Diagnostic Standby** | Offline Core Fallback | ❌ | Safe, zero-crash standby mode providing configuration guidance |

> **Security & Guardrail Notice**: API keys are securely read from the execution environment (`GEMINI_API_KEY`, `OPENAI_API_KEY`, `OPENAI_BASE_URL`). ARC enforces zero secret disclosure and strictly prohibits unverified third-party endpoints (no Groq).

---

## 🧩 System Architecture

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   React 19 + TypeScript Frontend (Port 5173)           │
│  ArcTopBar │ ArcSessionRail │ ArcHero │ ArcComposer │ DiagnosticFeed    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / Server-Sent Events (SSE)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│             TypeScript Node.js Serverless API (frontend/api/)          │
│    /api/health   /api/chat (SSE)   /api/analyze   /api/models          │
│    /api/vault    /api/learn        /api/auth                           │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Provider Resolution (_lib/provider.ts)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       LLM-First RAG Gateway                            │
│   ┌─────────────────────┬──────────────────────┬───────────────────┐   │
│   ▼                     ▼                      ▼                   ▼   │
│ Google Gemini     OmniRoute Gateway       FreeLLMAPI        Diagnostic │
│ (@google/genai)   (OpenAI-Compatible)  (OpenAI-Compatible)   Standby   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Verified Development & Verification Commands

All development and verification commands run from the `frontend/` directory:

```powershell
cd frontend
```

### Start Development Server (Port 5173)
Runs the React 19 workbench and all integrated TypeScript API routes:
```powershell
npm run dev
```

### Run Static Linter (`oxlint`)
```powershell
npm run lint
```

### Typecheck & Production Build (`tsc -b && vite build`)
```powershell
npm run build
```

### Production Preview
```powershell
npm run preview
```

---

## 📦 Tech Stack

- **Frontend Core**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite 8](https://vitejs.dev/)
- **Styling & Motion**: [Tailwind CSS v4](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/)
- **Mathematics & Content**: [KaTeX](https://katex.org/), [ReactMarkdown](https://github.com/remarkjs/react-markdown), `remark-math`, `rehype-katex`
- **Icons**: [Lucide React](https://lucide.dev/)
- **Backend / API**: Pure TypeScript Serverless API routes on Node.js (`frontend/api/`)
- **AI RAG Gateway**: `@google/genai`, `OmniRoute`, `FreeLLMAPI`, and OpenAI-compatible gateways
- **Linter**: [Oxlint](https://oxc.rs/docs/guide/usage/linter.html)
