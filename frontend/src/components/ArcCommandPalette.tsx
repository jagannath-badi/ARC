import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  PanelLeft,
  Layers,
  Cpu,
  Volume2,
  Settings,
  Sparkles,
  CornerDownLeft,
  X,
  BookOpen,
} from 'lucide-react';
import type { ModelOption, ArcResponseStyle } from '../api';

export interface CommandItem {
  id: string;
  category: 'Workspace' | 'Models' | 'Academic Queries' | 'Study Styles';
  label: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  shortcut?: string;
}

export interface ArcCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNewSession: () => void;
  onToggleRail: () => void;
  onToggleVault: () => void;
  onOpenVoiceSettings: () => void;
  onOpenSettings: () => void;
  availableModels: ModelOption[];
  onSelectModel: (modelId: string) => void;
  onSelectStarterPrompt: (promptText: string) => void;
  onSelectStyle?: (style: ArcResponseStyle) => void;
}

export const ArcCommandPalette: React.FC<ArcCommandPaletteProps> = ({
  isOpen,
  onClose,
  onNewSession,
  onToggleRail,
  onToggleVault,
  onOpenVoiceSettings,
  onOpenSettings,
  availableModels,
  onSelectModel,
  onSelectStarterPrompt,
  onSelectStyle,
}) => {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setSearch('');
        setSelectedIndex(0);
        inputRef.current?.focus();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const items: CommandItem[] = [
    // Core Workspace Actions
    {
      id: 'new-session',
      category: 'Workspace',
      label: 'New Session',
      description: 'Reset bench and start a fresh session',
      icon: Plus,
      action: () => {
        onNewSession();
        onClose();
      },
      shortcut: 'Alt+N',
    },
    {
      id: 'toggle-rail',
      category: 'Workspace',
      label: 'Toggle Left Session Rail',
      description: 'Show/hide saved sessions',
      icon: PanelLeft,
      action: () => {
        onToggleRail();
        onClose();
      },
      shortcut: 'Ctrl+B',
    },
    {
      id: 'toggle-vault',
      category: 'Workspace',
      label: 'Open Knowledge Vault',
      description: 'Search ingested document chunks and context',
      icon: Layers,
      action: () => {
        onToggleVault();
        onClose();
      },
    },
    {
      id: 'voice-settings',
      category: 'Workspace',
      label: 'Configure Neural Voice Subsystem',
      description: 'Audio persona, rate, and speech parameters',
      icon: Volume2,
      action: () => {
        onOpenVoiceSettings();
        onClose();
      },
    },
    {
      id: 'intelligence-settings',
      category: 'Workspace',
      label: 'Cognitive Engine & Privacy Guards',
      description: 'Manage telemetry privacy and routing bounds',
      icon: Settings,
      action: () => {
        onOpenSettings();
        onClose();
      },
    },
    // Models
    ...availableModels.map((m) => ({
      id: `model-${m.id}`,
      category: 'Models' as const,
      label: `Switch Model: ${m.label}`,
      description: m.specialty,
      icon: Cpu,
      action: () => {
        onSelectModel(m.id);
        onClose();
      },
    })),
    // Study & Interaction Styles
    ...(onSelectStyle
      ? [
          {
            id: 'style-academic',
            category: 'Study Styles' as const,
            label: 'Set Style: Academic Rigor',
            description: 'Rigorous derivations, single-pill confidence badges, and KaTeX notation',
            icon: BookOpen,
            action: () => {
              onSelectStyle('academic');
              onClose();
            },
          },
          {
            id: 'style-guided',
            category: 'Study Styles' as const,
            label: 'Set Style: Guided Study & Tutoring',
            description: 'Active scaffolding, step-by-step reasoning, and concept check questions',
            icon: BookOpen,
            action: () => {
              onSelectStyle('guided');
              onClose();
            },
          },
          {
            id: 'style-natural',
            category: 'Study Styles' as const,
            label: 'Set Style: Natural Dialogue',
            description: 'Fluid academic mentoring in office-hours dialogue without robotic filler',
            icon: BookOpen,
            action: () => {
              onSelectStyle('natural');
              onClose();
            },
          },
          {
            id: 'style-concise',
            category: 'Study Styles' as const,
            label: 'Set Style: High-Density Concise',
            description: 'Compact analytical points and tables with zero conversational filler',
            icon: BookOpen,
            action: () => {
              onSelectStyle('concise');
              onClose();
            },
          },
        ]
      : []),
    // Academic & Cross-Discipline Queries
    {
      id: 'q-crispr',
      category: 'Academic Queries',
      label: 'CRISPR-Cas9 Mechanism vs. Base Editing',
      description: 'Compare double-strand break repair with deaminase transitions',
      icon: Sparkles,
      action: () => {
        onSelectStarterPrompt(
          'Compare the mechanism, efficiency, and off-target profiles of CRISPR-Cas9 nuclease vs. base editing and prime editing'
        );
        onClose();
      },
    },
    {
      id: 'q-macro-islm',
      category: 'Academic Queries',
      label: 'IS-LM Equilibrium & Monetary Transmission',
      description: 'Derive shifts in interest rates and output from central bank policy',
      icon: Sparkles,
      action: () => {
        onSelectStarterPrompt(
          'Derive the IS-LM macroeconomic equilibrium and analyze the transmission mechanism of central bank quantitative tightening'
        );
        onClose();
      },
    },
    {
      id: 'q-dijkstra-astar',
      category: 'Academic Queries',
      label: 'Dijkstra vs. A* Graph Search & Complexity',
      description: 'Compare admissibility of heuristics and worst-case bounds',
      icon: Sparkles,
      action: () => {
        onSelectStarterPrompt(
          'Analyze Dijkstra vs. A* pathfinding algorithms with proof of optimality under admissible heuristics and worst-case space complexity'
        );
        onClose();
      },
    },
    {
      id: 'q-literary-critique',
      category: 'Academic Queries',
      label: 'Narrative Framing & Unreliable Narrator',
      description: 'Deconstruct subjectivity and epistemic distance in modern literature',
      icon: Sparkles,
      action: () => {
        onSelectStarterPrompt(
          'Analyze how narrative framing and unreliable narration construct epistemic distance and thematic ambiguity in modern literary works'
        );
        onClose();
      },
    },
    {
      id: 'q-sallen-key',
      category: 'Academic Queries',
      label: 'Sallen-Key Filter Component Synthesis',
      description: 'Calculate low-pass values for fc = 10 kHz, Q = 0.707',
      icon: Sparkles,
      action: () => {
        onSelectStarterPrompt(
          'Calculate Sallen-Key low-pass filter component values for fc = 10 kHz and Q = 0.707'
        );
        onClose();
      },
    },
  ];

  const filteredItems = items.filter(
    (item) =>
      item.label.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(search.toLowerCase()))
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(filteredItems.length, 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev <= 0 ? Math.max(filteredItems.length - 1, 0) : prev - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const current = filteredItems[selectedIndex];
      if (current) current.action();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 select-none">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Palette Window */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -8 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-xl bg-[#0B0D1D]/90 backdrop-blur-2xl border border-white/[0.10] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.85),inset_0_1px_0_0_rgba(255,255,255,0.08)] flex flex-col overflow-hidden text-[#F4F6FB]"
          >
            {/* Search Input Bar */}
            <div className="flex items-center gap-2 sm:gap-3 px-3.5 sm:px-4 py-2.5 sm:py-3 border-b border-white/[0.08] bg-white/[0.02]">
              <Search className="w-4 h-4 text-[#2B3BFF] shrink-0" />
              <input
                ref={inputRef}
                id="arc-command-palette-input"
                name="command-search"
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Type a command, query, or switch model…"
                aria-label="Search workbench commands, queries, and models"
                className="flex-1 min-w-0 bg-transparent border-none outline-none text-sm text-[#F4F6FB] placeholder:text-[#64748B] font-sans"
              />
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/[0.05] border border-white/[0.08] text-[#94A3B8] shrink-0">
                Esc
              </kbd>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close command palette"
                className="sm:hidden p-1.5 rounded-lg text-[#94A3B8] hover:text-[#F4F6FB] bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.07] hover:border-white/[0.14] transition-all duration-150 shrink-0 cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Results List */}
            <div
              ref={listRef}
              className="max-h-[340px] overflow-y-auto diagnostic-feed-scrollbar p-2 space-y-1"
            >
              {filteredItems.length === 0 ? (
                <div className="py-8 text-center text-xs font-mono text-[#64748B]">
                  No matching command or query found.
                </div>
              ) : (
                filteredItems.map((item, idx) => {
                  const isSelected = idx === selectedIndex;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={item.action}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full px-3 py-2.5 rounded-xl text-left flex items-center justify-between transition-all duration-150 cursor-pointer ${
                        isSelected
                          ? 'bg-white/[0.08] text-[#F4F6FB] border border-white/[0.18] shadow-[0_2px_12px_rgba(0,0,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.08)]'
                          : 'text-[#94A3B8] border border-transparent hover:bg-white/[0.05] hover:border-white/[0.10] hover:text-[#F4F6FB]'
                      }`}
                    >
                      <div className="flex items-center gap-3 truncate mr-2">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                            isSelected
                              ? 'bg-white/[0.08] text-[#35FEE4] border border-white/[0.20]'
                              : 'bg-white/[0.03] text-[#64748B] border border-white/[0.08]'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="truncate">
                          <div className={`text-xs font-medium font-mono truncate leading-snug ${
                            isSelected ? 'text-[#F4F6FB]' : 'text-[#94A3B8]'
                          }`}>
                            {item.label}
                          </div>
                          {item.description && (
                            <div className="text-[10px] text-[#64748B] truncate">
                              {item.description}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {item.shortcut && (
                          <span className={`hidden sm:inline-block text-[10px] font-mono px-1.5 py-0.2 rounded border transition-colors ${
                            isSelected
                              ? 'bg-white/[0.08] border-white/[0.20] text-[#35FEE4]'
                              : 'bg-white/[0.04] border-white/[0.08] text-[#64748B]'
                          }`}>
                            {item.shortcut}
                          </span>
                        )}
                        {isSelected && (
                          <CornerDownLeft className="w-3.5 h-3.5 text-[#35FEE4]" />
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Palette Footer */}
            <div className="px-4 py-2 border-t border-white/[0.08] bg-white/[0.02] text-[10px] font-mono text-[#64748B] flex items-center justify-between">
              <div className="hidden sm:flex items-center gap-3">
                <span>↑↓ Navigate</span>
                <span>↵ Execute</span>
              </div>
              <span className="text-[#35FEE4] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#35FEE4] inline-block" />
                ARC Command Dispatch
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
