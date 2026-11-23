import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import {
  Loader2,
  Volume2,
  Square,
  BookmarkPlus,
  Check,
  Copy,
  Cpu,
} from 'lucide-react';

export interface DisplayMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  imagePreviewUrl?: string;
  metadata?: {
    provider: string;
    model_id: string;
    attempts: number;
    fallback_used: boolean;
    original_model?: string | null;
  };
}

export interface DiagnosticFeedProps {
  messages: DisplayMessage[];
  isLoading: boolean;
  speakingMessageId?: string | null;
  streamingMessageId?: string | null;
  onReadAloud?: (id: string, text: string) => void;
  cognitiveStep?: string | null;
  onSaveToVault?: (text: string) => Promise<boolean | void> | boolean | void;
  onQuickAction?: (prompt: string) => void;
  mobileFullBleed?: boolean;
}

/**
 * Transforms occurrences of confidence tags into a single clean styled badge at the AST level:
 * - CONFIRMED -> Emerald badge
 * - LIKELY -> Amber badge
 * - CANNOT CONFIRM -> Rose badge
 */
const BADGE_REGEX =
  /((?:\[\s*CANNOT CONFIRM\s*\]|\bCANNOT CONFIRM\b|\[\s*CONFIRMED\s*\]|\bCONFIRMED\b|\[\s*LIKELY\s*\]|\bLIKELY\b)(?:\s*[:—–-])?\s*)/g;

interface HastNode {
  type: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
  value?: string;
}

function rehypeConfidenceBadges() {
  return (tree: HastNode) => {
    function walk(node: HastNode) {
      if (!node.children || !Array.isArray(node.children)) return;

      // Skip code blocks and KaTeX math nodes
      if (
        node.tagName === 'code' ||
        node.tagName === 'pre' ||
        (node.properties?.className &&
          String(node.properties.className).includes('katex'))
      ) {
        return;
      }

      const nextChildren: HastNode[] = [];
      let prevWasBadge = false;

      for (const child of node.children) {
        if (child.type === 'text' && typeof child.value === 'string') {
          let textVal = child.value;
          if (prevWasBadge) {
            textVal = textVal.replace(/^[\s:—–-]+/, ' ');
          }

          const parts = textVal.split(BADGE_REGEX);
          if (parts.length > 1) {
            for (let i = 0; i < parts.length; i++) {
              const part = parts[i];
              if (!part) continue;

              if (part.includes('CONFIRMED') && !part.includes('CANNOT')) {
                nextChildren.push({
                  type: 'element',
                  tagName: 'span',
                  properties: {
                    className:
                      'inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-bold tracking-wide uppercase mx-1.5 align-middle badge-success',
                  },
                  children: [{ type: 'text', value: 'CONFIRMED' }],
                });
                prevWasBadge = true;
              } else if (part.includes('LIKELY')) {
                nextChildren.push({
                  type: 'element',
                  tagName: 'span',
                  properties: {
                    className:
                      'inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-bold tracking-wide uppercase mx-1.5 align-middle badge-warm',
                  },
                  children: [{ type: 'text', value: 'LIKELY' }],
                });
                prevWasBadge = true;
              } else if (part.includes('CANNOT CONFIRM')) {
                nextChildren.push({
                  type: 'element',
                  tagName: 'span',
                  properties: {
                    className:
                      'inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-bold tracking-wide uppercase mx-1.5 align-middle badge-danger',
                  },
                  children: [{ type: 'text', value: 'CANNOT CONFIRM' }],
                });
                prevWasBadge = true;
              } else {
                nextChildren.push({ type: 'text', value: part });
                prevWasBadge = false;
              }
            }
          } else {
            nextChildren.push({ ...child, value: textVal });
            prevWasBadge = false;
          }
        } else {
          walk(child);
          nextChildren.push(child);
          prevWasBadge = false;
        }
      }

      node.children = nextChildren;
    }

    walk(tree);
  };
}

/**
 * Normalizes LaTeX math delimiters outside fenced code blocks:
 * 1. Converts \[ ... \] (single or multi-line) to $$ ... $$ display math blocks
 * 2. Converts \( ... \) to $ ... $ inline math expressions
 * 3. Converts stray '[' and ']' on their own lines around LaTeX math blocks into $$ ... $$
 * 4. Wraps standalone LaTeX math environments (\begin{aligned}...\end{aligned}, etc.) in $$ ... $$ if not already delimited
 */
function normalizeLatexDelimiters(text: string): string {
  if (!text) return '';

  // 1. Convert \[ ... \] (single or multi-line) to $$ ... $$ display math blocks
  text = text.replace(/\\\[([\s\S]*?)\\\]/g, (_m, eq) => {
    return `\n\n$$\n${eq.trim()}\n$$\n\n`;
  });

  // 2. Convert \( ... \) to $ ... $ inline math expressions
  text = text.replace(/\\\(([\s\S]*?)\\\)/g, (_m, eq) => {
    return `$${eq.trim()}$`;
  });

  // 3. Convert stray '[' and ']' on their own lines enclosing LaTeX math
  // (addresses LLMs emitting raw square brackets without backslashes for display equations)
  text = text.replace(/(?:^|\n)[ \t]*\[[ \t]*\n([\s\S]*?\\[a-zA-Z][\s\S]*?)\n[ \t]*\][ \t]*(?=\n|$)/g, (_m, eq) => {
    return `\n\n$$\n${eq.trim()}\n$$\n\n`;
  });

  // 4. Wrap standalone LaTeX environments that are not already enclosed in $$
  // Environments: aligned, align, align*, equation, equation*, gather, gather*, matrix, pmatrix, bmatrix, vmatrix, Bmatrix, Vmatrix, cases
  const envRegex = /(?:^|\n)[ \t]*(\\begin\{(?:aligned|align\*?|equation\*?|gather\*?|pmatrix|bmatrix|vmatrix|Bmatrix|Vmatrix|matrix|cases)\}[\s\S]*?\\end\{(?:aligned|align\*?|equation\*?|gather\*?|pmatrix|bmatrix|vmatrix|Bmatrix|Vmatrix|matrix|cases)\})[ \t]*(?=\n|$)/g;

  text = text.replace(envRegex, (fullMatch, envBlock, offset, src) => {
    const before = src.slice(0, offset);
    const doubleDollarCount = (before.match(/\$\$/g) || []).length;
    if (doubleDollarCount % 2 === 1) {
      return fullMatch;
    }
    return `\n\n$$\n${envBlock.trim()}\n$$\n\n`;
  });

  return text;
}

function normalizeProseContent(raw: string): string {
  if (!raw) return '';
  const parts = raw.split(/(```[\s\S]*?(?:```|$))/g);
  for (let i = 0; i < parts.length; i += 2) {
    let part = parts[i].replace(/\r\n/g, '\n');
    part = part.replace(/\n{3,}/g, '\n\n');
    part = part.replace(/[^\S\n]{3,}/g, ' ');
    part = normalizeLatexDelimiters(part);
    parts[i] = part;
  }
  return parts.join('');
}

const markdownComponents: Components = {
  p: ({ children }) => (
    <p className="my-2.5 text-[#F4F6FB] leading-relaxed text-[15px] whitespace-pre-line">{children}</p>
  ),
  li: ({ children }) => (
    <li className="my-1 text-[#E2E8F0] leading-relaxed text-[15px]">{children}</li>
  ),
  span: ({ children, className, ...props }) => (
    <span className={className} {...props}>
      {children}
    </span>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-[#FFFFFF]">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="italic text-[#94A3B8]">{children}</em>
  ),
  h1: ({ children }) => (
    <h1 className="text-xl font-bold text-[#F4F6FB] mt-5 mb-2 font-display">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-lg font-bold text-[#F4F6FB] mt-4 mb-2 font-display">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-base font-semibold text-[#F4F6FB] mt-3 mb-1.5 font-display">{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-sm font-semibold text-[#F4F6FB] mt-2.5 mb-1 font-display">{children}</h4>
  ),
  ul: ({ children }) => (
    <ul className="list-disc list-outside space-y-1 my-2.5 ml-5 text-[#E2E8F0]">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-outside space-y-1 my-2.5 ml-5 text-[#E2E8F0]">{children}</ol>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-3 border-[#2B3BFF] pl-3.5 py-1.5 my-3 text-[#94A3B8] bg-[#10132A] rounded-r-lg text-[14px] italic">
      {children}
    </blockquote>
  ),
  code: ({ className, children, ...props }) => {
    return (
      <code
        className={
          className ||
          'px-1.5 py-0.5 rounded bg-[#10132A] text-[#35FEE4] text-xs font-mono border border-[#1B2042] break-words [overflow-wrap:anywhere]'
        }
        {...props}
      >
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="p-3.5 my-3 rounded-xl bg-[#080A16] border border-[#1B2042] overflow-x-auto text-xs font-mono text-[#F4F6FB] leading-relaxed">
      {children}
    </pre>
  ),
  table: ({ node: _node, ...props }) => (
    <div className="overflow-x-auto my-3 rounded-xl border border-[#1B2042] bg-[#0B0D1D]">
      <table className="min-w-full border-collapse text-xs text-left" {...props} />
    </div>
  ),
  thead: ({ node: _node, ...props }) => (
    <thead className="bg-[#0E1124] border-b border-[#1B2042] text-[#F4F6FB] font-mono" {...props} />
  ),
  th: ({ node: _node, ...props }) => (
    <th className="py-2.5 px-3.5 font-semibold border-r border-[#1B2042] last:border-r-0 tracking-wide text-[#F4F6FB]" {...props} />
  ),
  tbody: ({ node: _node, ...props }) => (
    <tbody className="divide-y divide-[#1B2042] bg-[#0B0D1D]" {...props} />
  ),
  tr: ({ node: _node, ...props }) => (
    <tr className="hover:bg-[#10132A] transition-colors" {...props} />
  ),
  td: ({ node: _node, ...props }) => (
    <td className="py-2.5 px-3.5 text-[#94A3B8] border-r border-[#1B2042] last:border-r-0 font-sans leading-relaxed" {...props} />
  ),
  a: ({ children, href, ...props }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-[#35FEE4] hover:text-[#8BFFEF] underline underline-offset-2 break-words [overflow-wrap:anywhere]"
      {...props}
    >
      {children}
    </a>
  ),
};

export const DiagnosticFeed: React.FC<DiagnosticFeedProps> = ({
  messages,
  isLoading,
  speakingMessageId,
  streamingMessageId,
  onReadAloud,
  cognitiveStep,
  onSaveToVault,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [savedMsgIds, setSavedMsgIds] = useState<Set<string>>(new Set());
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  // Auto-scroll when new chunks or messages arrive
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages, cognitiveStep, isLoading]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const handleSaveToVault = async (id: string, text: string) => {
    if (onSaveToVault) {
      await onSaveToVault(text);
      setSavedMsgIds((prev) => new Set(prev).add(id));
    }
  };

  return (
    <div
      ref={scrollContainerRef}
      className="flex-1 min-h-0 overflow-y-auto diagnostic-feed-scrollbar px-3 sm:px-6 py-4 space-y-4 max-w-4xl mx-auto w-full select-text"
    >
      {messages
        .filter((msg) => msg.role !== 'assistant' || msg.content.trim().length > 0 || isLoading)
        .map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className={`flex ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`min-w-0 break-words ${
                msg.role === 'user'
                  ? 'bg-[#10132A]/90 backdrop-blur-md [-webkit-backdrop-filter:blur(16px)] border border-[#2B3BFF]/25 text-[#F4F6FB] rounded-2xl rounded-tr-xs px-4 py-3 shadow-[0_4px_12px_rgba(0,0,0,0.45),inset_0_1px_0_0_rgba(255,255,255,0.07)] max-w-[85%]'
                  : 'bg-[#0B0D1D]/95 backdrop-blur-lg [-webkit-backdrop-filter:blur(18px)] border border-[#1B2042] hover:border-[#2B3BFF]/40 text-[#F4F6FB] rounded-2xl rounded-tl-xs px-5 py-4 arc-card-elevated max-w-[95%] sm:max-w-[92%]'
              }`}
            >
              {/* User message rendering */}
              {msg.role === 'user' ? (
                <>
                  {msg.imagePreviewUrl && (
                    <div className="mb-2.5 max-w-xs w-full max-w-full">
                      <img
                        src={msg.imagePreviewUrl}
                        alt="Uploaded inspection artifact"
                        className="bg-[#0B0D1D] border border-[#1B2042] rounded-xl p-1 max-h-48 object-contain block shadow-xs"
                      />
                    </div>
                  )}
                  <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed text-[#F4F6FB]">
                    {msg.content}
                  </p>
                </>
              ) : (
                /* Assistant message rendering with KaTeX and Markdown */
                <div className="text-[15px] break-words">
                  {!msg.content && isLoading ? (
                    <div className="flex items-center gap-2 text-xs font-mono text-[#35FEE4] py-1">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span className="shimmer-text">⚡ {cognitiveStep || 'Synthesizing response…'}</span>
                    </div>
                  ) : (
                    <>
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm, remarkMath]}
                        rehypePlugins={[rehypeKatex, rehypeConfidenceBadges]}
                        components={markdownComponents}
                      >
                        {normalizeProseContent(msg.content)}
                      </ReactMarkdown>
                      {isLoading && msg === messages[messages.length - 1] && (
                        <span className="streaming-cursor" />
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Assistant Engine Metadata Badge & Tooling Footer */}
              {msg.role === 'assistant' && msg.content && !isLoading && (
                <div className="mt-3.5 pt-2.5 border-t border-[#1B2042] flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-[#94A3B8]">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-md bg-[#2B3BFF]/15 border border-[#2B3BFF]/35 text-[#818CF8] font-semibold flex items-center gap-1">
                      <Cpu className="w-2.5 h-2.5 text-[#2B3BFF]" />
                      {msg.metadata?.provider || 'ARC Core'} / {msg.metadata?.model_id || 'auto-router'}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-[#10132A] border border-[#1B2042] text-[#94A3B8] font-medium">
                      {msg.metadata?.model_id?.includes('auto') ? 'AUTO-ROUTED' : 'DIRECT-ROUTED'}
                    </span>
                    {msg.metadata && (
                      <span className="px-2 py-0.5 rounded-md bg-[#10132A] border border-[#1B2042] text-[#94A3B8] font-medium tabular-nums">
                        {msg.metadata.attempts === 1 ? '1 CYCLE' : `${msg.metadata.attempts} CYCLES`}
                      </span>
                    )}
                    {msg.metadata?.fallback_used && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-950/40 text-amber-300 border border-amber-800/50 font-bold">
                        FALLBACK ACTIVE
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Copy Button */}
                    <button
                      type="button"
                      onClick={() => handleCopy(msg.id, msg.content)}
                      aria-label="Copy full response to clipboard"
                      className="flex items-center gap-1 px-2.5 py-1 sm:px-2 sm:py-0.5 rounded-md border border-[#1B2042] bg-[#10132A] hover:bg-[#161A38] text-[#94A3B8] hover:text-[#F4F6FB] transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[#2B3BFF] focus-visible:outline-none"
                      title="Copy full response"
                    >
                      {copiedMsgId === msg.id ? (
                        <>
                          <Check className="w-2.5 h-2.5 text-[#35FEE4]" />
                          <span className="text-[10px] text-[#35FEE4] font-sans">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-2.5 h-2.5" />
                          <span className="text-[10px] font-sans">Copy</span>
                        </>
                      )}
                    </button>

                    {/* Read Aloud Button */}
                    {onReadAloud && (
                      <button
                        type="button"
                        onClick={() => onReadAloud(msg.id, msg.content)}
                        aria-label={
                          speakingMessageId === msg.id || streamingMessageId === msg.id
                            ? 'Stop speech playback'
                            : 'Read response aloud with ARC Voice'
                        }
                        className={`flex items-center gap-1 px-2.5 py-1 sm:px-2 sm:py-0.5 rounded-md border transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[#2B3BFF] focus-visible:outline-none ${
                          speakingMessageId === msg.id || streamingMessageId === msg.id
                            ? 'bg-rose-950/40 text-rose-300 border-rose-800/50'
                            : 'border-[#1B2042] bg-[#10132A] hover:bg-[#161A38] text-[#94A3B8] hover:text-[#F4F6FB]'
                        }`}
                        title={speakingMessageId === msg.id ? 'Stop audio' : 'Read aloud'}
                      >
                        {speakingMessageId === msg.id ? (
                          <>
                            <Square className="w-2.5 h-2.5 fill-current" />
                            <span className="text-[10px] font-sans">Stop</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-2.5 h-2.5" />
                            <span className="text-[10px] font-sans">Speak</span>
                          </>
                        )}
                      </button>
                    )}

                    {/* Save to Vault Button */}
                    {onSaveToVault && (
                      <button
                        type="button"
                        onClick={() => handleSaveToVault(msg.id, msg.content)}
                        aria-label={
                          savedMsgIds.has(msg.id)
                            ? 'Response archived in Knowledge Vault'
                            : 'Save response to Knowledge Vault'
                        }
                        className={`flex items-center gap-1 px-2.5 py-1 sm:px-2 sm:py-0.5 rounded-md border transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[#2B3BFF] focus-visible:outline-none ${
                          savedMsgIds.has(msg.id)
                            ? 'bg-emerald-950/40 text-[#35FEE4] border-emerald-800/50'
                            : 'border-[#1B2042] bg-[#10132A] hover:bg-[#161A38] text-[#94A3B8] hover:text-[#F4F6FB]'
                        }`}
                        title={savedMsgIds.has(msg.id) ? 'Saved in Vault' : 'Save to Knowledge Vault'}
                      >
                        {savedMsgIds.has(msg.id) ? (
                          <>
                            <Check className="w-2.5 h-2.5 text-[#35FEE4]" />
                            <span className="text-[10px] font-sans">Saved</span>
                          </>
                        ) : (
                          <>
                            <BookmarkPlus className="w-2.5 h-2.5 text-[#2B3BFF]" />
                            <span className="text-[10px] font-sans">Vault</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ))}

      {/* Cognitive step indicator when synthesizing */}
      {isLoading && !messages.some((m) => m.role === 'assistant' && !m.content) && (
        <div className="flex justify-start animate-in fade-in duration-150">
          <div className="rounded-2xl rounded-tl-xs px-4 py-3 bg-[#0B0D1D]/95 backdrop-blur-md border border-[#1B2042] shadow-[0_4px_16px_rgba(0,0,0,0.5)] flex items-center gap-2.5 text-xs font-mono text-[#35FEE4]">
            <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0 text-[#35FEE4]" />
            <span className="font-semibold text-[#F4F6FB]">
              {cognitiveStep ? `ARC Synthesis: ${cognitiveStep}` : 'Synthesizing response…'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
