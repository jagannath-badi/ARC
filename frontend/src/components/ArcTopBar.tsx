import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronDown,
  Layers,
  Volume2,
  VolumeX,
  Settings,
  ShieldCheck,
  Check,
  Cpu,
  PanelLeft,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import type { ModelOption, OperatorUser } from '../api';
import { ArcGeometricMark } from './ArcGeometricMark';

export interface ArcTopBarProps {
  availableModels: ModelOption[];
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
  vaultConceptsCount: number;
  onToggleVault: () => void;
  isVoiceEnabled: boolean;
  onToggleVoice: () => void;
  onOpenSettings: () => void;
  onOpenVoiceSettings: () => void;
  currentUser: OperatorUser | null;
  onOpenAuth: () => void;
  isRailOpen: boolean;
  onToggleRail: () => void;
  onOpenCommandPalette: () => void;
  cameraPerspective?: 'isometric' | 'frontal' | 'orbit';
  onCyclePerspective?: () => void;
  voiceState?: 'idle' | 'listening' | 'transcribing' | 'speaking';
  isStreaming?: boolean;
  cognitiveStep?: string | null;
}

export const ArcTopBar: React.FC<ArcTopBarProps> = ({
  availableModels,
  selectedModel,
  onSelectModel,
  vaultConceptsCount,
  onToggleVault,
  isVoiceEnabled,
  onToggleVoice,
  onOpenSettings,
  onOpenVoiceSettings,
  currentUser,
  onOpenAuth,
  isRailOpen,
  onToggleRail,
  onOpenCommandPalette,
  cameraPerspective = 'isometric',
  onCyclePerspective,
  voiceState = 'idle',
  isStreaming = false,
  cognitiveStep = null,
}) => {
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const modelMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modelMenuRef.current && !modelMenuRef.current.contains(e.target as Node)) {
        setIsModelMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeModelObj = availableModels.find((m) => m.id === selectedModel);
  const activeLabel = activeModelObj?.label || selectedModel;

  const isMac =
    typeof navigator !== 'undefined' &&
    /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform || navigator.userAgent);

  return (
    <header className="h-14 border-b border-white/[0.08] bg-[#05060F]/80 backdrop-blur-xl [-webkit-backdrop-filter:blur(20px)] [box-shadow:0_1px_3px_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.06)] px-2 sm:px-4 flex items-center justify-between gap-1 sm:gap-3 z-30 flex-shrink-0 select-none text-[#F4F6FB]">
      {/* Left: Rail Toggle, ARC Wordmark & Workspace Badge */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
        <button
          type="button"
          onClick={onToggleRail}
          aria-label="Toggle session rail (Ctrl+B)"
          className={`p-1.5 rounded-lg border transition-all duration-150 backdrop-blur-md cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center focus-visible:ring-2 focus-visible:ring-[#2B3BFF] focus-visible:outline-none ${
            isRailOpen
              ? 'bg-[#2B3BFF]/20 border-white/[0.20] text-[#35FEE4]'
              : 'bg-white/[0.04] hover:bg-white/[0.09] border-white/[0.09] hover:border-white/[0.16] text-[#94A3B8] hover:text-[#F4F6FB]'
          }`}
          title="Toggle session rail (Ctrl+B)"
        >
          <PanelLeft className="w-4 h-4" aria-hidden="true" />
        </button>

        <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.09] backdrop-blur-md flex items-center justify-center text-[#F4F6FB] shadow-xs" aria-hidden="true">
          <ArcGeometricMark size={20} className="w-5 h-5 text-[#F4F6FB]" />
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <span className="font-extrabold text-[15px] tracking-tight text-[#F4F6FB] font-display">
            ARC
          </span>
        </div>
      </div>

      {/* Center: Model / Routing Status Indicator */}
      <div className="relative flex-1 flex justify-center max-w-sm" ref={modelMenuRef}>
        <button
          type="button"
          onClick={() => setIsModelMenuOpen((prev) => !prev)}
          aria-label="Select active model or cognitive routing strategy"
          className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg border border-white/[0.09] hover:border-white/[0.16] bg-white/[0.04] hover:bg-white/[0.09] backdrop-blur-md text-xs font-mono transition-all duration-150 text-[#F4F6FB] cursor-pointer min-h-[34px] sm:min-h-[36px] focus-visible:ring-2 focus-visible:ring-[#2B3BFF] focus-visible:outline-none shadow-xs max-w-full"
          title="Select active model or routing strategy"
          aria-expanded={isModelMenuOpen}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#35FEE4] animate-pulse shadow-[0_0_6px_rgba(53,254,228,0.6)] shrink-0" />
          <span className="font-medium truncate max-w-[115px] sm:max-w-[180px]">
            {activeLabel}
          </span>
          <ChevronDown
            className={`w-3 h-3 text-[#64748B] transition-transform duration-150 shrink-0 ${
              isModelMenuOpen ? 'rotate-180' : ''
            }`}
            aria-hidden="true"
          />
        </button>

        {isModelMenuOpen && (
          <div className="absolute top-full mt-1 w-64 sm:w-72 max-w-[calc(100vw-24px)] left-1/2 -translate-x-1/2 bg-[#0B0D1D]/90 backdrop-blur-2xl border border-white/[0.10] rounded-xl shadow-[0_16px_50px_rgba(0,0,0,0.8),inset_0_1px_0_0_rgba(255,255,255,0.08)] p-1 z-40 text-xs font-mono animate-in fade-in zoom-in-95 duration-150">
            <div className="px-2 py-1 text-[9px] uppercase font-bold text-[#64748B] border-b border-white/[0.08] mb-1 flex items-center justify-between">
              <span>Cognitive Engine Routing</span>
              <Cpu className="w-3 h-3 text-[#2B3BFF]" aria-hidden="true" />
            </div>

            {availableModels.map((m) => {
              const isSelected = selectedModel === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    onSelectModel(m.id);
                    setIsModelMenuOpen(false);
                  }}
                  className={`w-full px-2.5 py-2 text-left rounded-lg transition-all duration-150 cursor-pointer mb-0.5 ${
                    isSelected
                      ? 'bg-white/[0.09] text-[#F4F6FB] font-semibold border border-white/[0.20] shadow-[0_2px_10px_rgba(0,0,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.08)]'
                      : 'text-[#94A3B8] hover:text-[#F4F6FB] bg-transparent hover:bg-white/[0.06] border border-transparent hover:border-white/[0.10]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-[11px] sm:text-xs">{m.label}</span>
                    {isSelected && <Check className="w-3 h-3 text-[#35FEE4]" />}
                  </div>
                  <div className="text-[9px] sm:text-[10px] text-[#64748B] mt-0.5 leading-snug line-clamp-1">
                    {m.specialty}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Right: Telemetry Indicators, Command Palette, Vault Drawer, Settings, Voice */}
      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
        {/* Spatial / Telemetry Perspective Mode Pill */}
        {onCyclePerspective && (
          <button
            type="button"
            onClick={onCyclePerspective}
            aria-label={`Cycle perspective mode. Current: ${cameraPerspective}`}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/[0.09] hover:border-white/[0.16] bg-white/[0.04] hover:bg-white/[0.09] backdrop-blur-md focus-visible:ring-2 focus-visible:ring-[#2B3BFF] focus-visible:outline-none transition-all duration-150 cursor-pointer min-h-[38px] text-xs font-mono text-[#F4F6FB]"
            title="Cycle Perspective"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                voiceState === 'speaking'
                  ? 'bg-[#35FEE4] animate-bounce shadow-[0_0_8px_rgba(53,254,228,0.6)]'
                  : isStreaming || cognitiveStep
                  ? 'bg-[#2B3BFF] animate-spin'
                  : 'bg-[#35FEE4] animate-pulse'
              }`}
            />
            <span className="text-[#F4F6FB] font-semibold uppercase tracking-wider hidden sm:inline">
              {cameraPerspective === 'isometric' ? 'ISO' : cameraPerspective === 'frontal' ? 'FRONT' : 'ORBIT'}
            </span>
          </button>
        )}

        {/* Command Palette Trigger */}
        <button
          type="button"
          onClick={onOpenCommandPalette}
          aria-label="Open Command Palette (Ctrl+K)"
          className="hidden md:flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-white/[0.09] hover:border-white/[0.16] bg-white/[0.04] hover:bg-white/[0.09] backdrop-blur-md text-xs font-mono text-[#94A3B8] hover:text-[#F4F6FB] transition-all duration-150 cursor-pointer min-h-[38px] focus-visible:ring-2 focus-visible:ring-[#2B3BFF] focus-visible:outline-none"
          title="Open Command Palette (Ctrl+K)"
        >
          <Search className="w-3.5 h-3.5 text-[#2B3BFF]" aria-hidden="true" />
          <span className="text-[11px] hidden lg:inline">Palette</span>
          <kbd className="px-1.5 py-0.2 rounded text-[9px] bg-white/[0.05] border border-white/[0.08] text-[#94A3B8]">
            {isMac ? '⌘K' : 'Ctrl+K'}
          </kbd>
        </button>

        {/* Knowledge Vault Trigger */}
        <button
          type="button"
          onClick={onToggleVault}
          aria-label="Open Knowledge Vault & Session History"
          className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg border border-white/[0.09] hover:border-white/[0.16] bg-white/[0.04] hover:bg-white/[0.09] backdrop-blur-md text-xs font-mono text-[#F4F6FB] transition-all duration-150 cursor-pointer min-h-[36px] focus-visible:ring-2 focus-visible:ring-[#2B3BFF] focus-visible:outline-none"
          title="Open Knowledge Vault & Session History"
        >
          <Layers className="w-3.5 h-3.5 text-[#2B3BFF]" aria-hidden="true" />
          <span className="hidden md:inline font-medium">Vault</span>
          {vaultConceptsCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-semibold bg-[#2B3BFF]/20 text-[#818CF8] border border-white/[0.12] tabular-nums">
              {vaultConceptsCount}
            </span>
          )}
        </button>

        {/* Voice Toggle */}
        <button
          type="button"
          onClick={onToggleVoice}
          aria-label={isVoiceEnabled ? 'Voice responses active (Click to mute)' : 'Enable voice responses'}
          className={`p-2 rounded-lg border transition-all duration-150 backdrop-blur-md cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center focus-visible:ring-2 focus-visible:ring-[#2B3BFF] focus-visible:outline-none ${
            isVoiceEnabled
              ? 'bg-[#2B3BFF]/20 border-white/[0.20] text-[#35FEE4]'
              : 'bg-white/[0.04] hover:bg-white/[0.09] border-white/[0.09] hover:border-white/[0.16] text-[#94A3B8] hover:text-[#F4F6FB]'
          }`}
          title={isVoiceEnabled ? 'Voice responses active (Click to mute)' : 'Enable voice responses'}
        >
          {isVoiceEnabled ? (
            <Volume2 className="w-4 h-4" aria-hidden="true" />
          ) : (
            <VolumeX className="w-4 h-4" aria-hidden="true" />
          )}
        </button>

        {/* Voice Settings Trigger */}
        <button
          type="button"
          onClick={onOpenVoiceSettings}
          aria-label="Configure voice persona, rate, and auto-speak"
          className="hidden sm:flex p-2 rounded-lg border border-white/[0.09] hover:border-white/[0.16] bg-white/[0.04] hover:bg-white/[0.09] backdrop-blur-md text-[#94A3B8] hover:text-[#F4F6FB] transition-all duration-150 cursor-pointer min-h-[38px] min-w-[38px] items-center justify-center focus-visible:ring-2 focus-visible:ring-[#2B3BFF] focus-visible:outline-none"
          title="Voice Settings"
        >
          <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
        </button>

        {/* Settings Dialog Trigger */}
        <button
          type="button"
          onClick={onOpenSettings}
          aria-label="Workspace Settings"
          className="p-2 rounded-lg border border-white/[0.09] hover:border-white/[0.16] bg-white/[0.04] hover:bg-white/[0.09] backdrop-blur-md text-[#94A3B8] hover:text-[#F4F6FB] transition-all duration-150 cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center focus-visible:ring-2 focus-visible:ring-[#2B3BFF] focus-visible:outline-none"
          title="Workspace Settings"
        >
          <Settings className="w-4 h-4" aria-hidden="true" />
        </button>

        {/* Operator User / Auth */}
        <button
          type="button"
          onClick={onOpenAuth}
          aria-label={
            currentUser && currentUser.username && currentUser.username.toLowerCase() !== 'arc operator'
              ? `Signed in as ${currentUser.username}`
              : 'Sign in to sync vault'
          }
          className="flex items-center gap-1.5 p-2 sm:px-2.5 sm:py-1.5 rounded-lg border border-white/[0.09] hover:border-white/[0.16] bg-white/[0.04] hover:bg-white/[0.09] backdrop-blur-md text-xs font-mono text-[#94A3B8] hover:text-[#F4F6FB] transition-all duration-150 cursor-pointer min-h-[36px] focus-visible:ring-2 focus-visible:ring-[#2B3BFF] focus-visible:outline-none"
          title={
            currentUser && currentUser.username && currentUser.username.toLowerCase() !== 'arc operator'
              ? `Signed in as ${currentUser.username}`
              : 'Sign in to sync vault'
          }
        >
          <ShieldCheck
            className={`w-3.5 h-3.5 ${
              currentUser && currentUser.username && currentUser.username.toLowerCase() !== 'arc operator'
                ? 'text-[#35FEE4]'
                : 'text-[#64748B]'
            }`}
            aria-hidden="true"
          />
          {currentUser && currentUser.username && currentUser.username.toLowerCase() !== 'arc operator' ? (
            <span className="hidden sm:inline text-[11px] font-semibold text-[#F4F6FB]">
              {currentUser.username}
            </span>
          ) : (
            <span className="hidden sm:inline text-[11px]">Sign In</span>
          )}
        </button>
      </div>
    </header>
  );
};
