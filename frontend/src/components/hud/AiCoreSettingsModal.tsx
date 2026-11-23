import React from 'react';
import { X, Cpu, Zap, Shield, BookOpen } from 'lucide-react';
import type { ModelOption, ArcResponseStyle } from '../../api';

interface AiCoreSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableModels: ModelOption[];
  selectedModel: string;
  onSelectModel: (id: string) => void;
  privacyMode: 'strict' | 'guarded' | 'relaxed';
  onPrivacyModeChange: (mode: 'strict' | 'guarded' | 'relaxed') => void;
  responseStyle?: ArcResponseStyle;
  onResponseStyleChange?: (style: ArcResponseStyle) => void;
}

export const AiCoreSettingsModal: React.FC<AiCoreSettingsModalProps> = ({
  isOpen,
  onClose,
  availableModels,
  selectedModel,
  onSelectModel,
  privacyMode,
  onPrivacyModeChange,
  responseStyle = 'academic',
  onResponseStyleChange,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in select-none font-mono">
      <div className="w-full max-w-xl max-h-[calc(100dvh-2rem)] rounded-2xl bg-[#0B0D1D]/90 backdrop-blur-2xl border border-white/[0.10] shadow-[0_20px_60px_rgba(0,0,0,0.85),inset_0_1px_0_0_rgba(255,255,255,0.08)] p-4 sm:p-5 flex flex-col gap-3 sm:gap-4 text-[#F4F6FB] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] gap-2 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.10] backdrop-blur-md flex items-center justify-center text-[#2B3BFF] shrink-0">
              <Cpu className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-bold text-[#F4F6FB] truncate">ARC Cognitive Engine Settings</h2>
              <p className="text-[11px] text-[#94A3B8] truncate">Configure multi-discipline reasoning engines, routing policies, and verification guards</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[#94A3B8] hover:text-[#F4F6FB] bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.07] hover:border-white/[0.14] transition-all duration-150 min-h-[38px] min-w-[38px] flex items-center justify-center cursor-pointer shrink-0"
            aria-label="Close cognitive engine settings"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="flex-1 min-h-0 overflow-y-auto diagnostic-feed-scrollbar space-y-4 pr-1">
          {/* 1. Reasoning Provider Cards */}
          <div>
            <label className="block text-xs font-bold text-[#94A3B8] uppercase mb-2">Primary Cognitive Engine</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              onClick={() => onSelectModel('auto')}
              className={`p-3 rounded-xl border text-left transition-all duration-150 cursor-pointer backdrop-blur-md ${
                selectedModel === 'auto'
                  ? 'bg-white/[0.09] border-white/[0.22] text-[#F4F6FB] shadow-[0_4px_16px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.08)]'
                  : 'bg-white/[0.03] hover:bg-white/[0.08] border-white/[0.08] hover:border-white/[0.16] text-[#94A3B8] hover:text-[#F4F6FB]'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold text-[#F4F6FB]">
                <span>Smart Router</span>
                <Zap className="w-3.5 h-3.5 text-[#35FEE4]" />
              </div>
              <div className="text-[10px] text-[#94A3B8] mt-1">Autonomous multi-discipline routing across all branches</div>
            </button>

            {availableModels.map((m) => (
              <button
                key={m.id}
                onClick={() => onSelectModel(m.id)}
                className={`p-3 rounded-xl border text-left transition-all duration-150 cursor-pointer backdrop-blur-md ${
                  selectedModel === m.id
                    ? 'bg-white/[0.09] border-white/[0.22] text-[#F4F6FB] shadow-[0_4px_16px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.08)]'
                    : 'bg-white/[0.03] hover:bg-white/[0.08] border-white/[0.08] hover:border-white/[0.16] text-[#94A3B8] hover:text-[#F4F6FB]'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold text-[#F4F6FB]">
                  <span className="truncate mr-2">{m.label}</span>
                  <span className="text-[9px] text-[#35FEE4] bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.08] flex-shrink-0">
                    {m.provider}
                  </span>
                </div>
                <div className="text-[10px] text-[#94A3B8] mt-1 line-clamp-2">{m.specialty}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 2. Study & Response Style */}
        {onResponseStyleChange && (
          <div className="pt-2 border-t border-white/[0.08]">
            <label className="block text-xs font-bold text-[#94A3B8] uppercase mb-2 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-[#35FEE4]" />
              Study & Interaction Style
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {[
                { id: 'academic', label: 'Academic', desc: 'Rigor & proof' },
                { id: 'guided', label: 'Guided Tutor', desc: 'Scaffolded steps' },
                { id: 'natural', label: 'Natural', desc: 'Office-hours mentor' },
                { id: 'concise', label: 'Concise', desc: 'High density' },
              ].map((s) => {
                const isSelected = (responseStyle || 'academic') === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => onResponseStyleChange(s.id as ArcResponseStyle)}
                    className={`p-2.5 rounded-xl border text-left transition-all duration-150 cursor-pointer backdrop-blur-md ${
                      isSelected
                        ? 'bg-white/[0.09] border-white/[0.22] text-[#35FEE4] font-bold shadow-[0_0_12px_rgba(255,255,255,0.1)]'
                        : 'bg-white/[0.03] border-white/[0.08] text-[#94A3B8] hover:text-[#F4F6FB] hover:bg-white/[0.08]'
                    }`}
                  >
                    <div className="font-semibold text-xs leading-none truncate">{s.label}</div>
                    <div className="text-[10px] text-[#64748B] mt-1 font-sans truncate">{s.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. Privacy Mode Guard */}
        <div className="pt-2 border-t border-white/[0.08]">
          <label className="block text-xs font-bold text-[#94A3B8] uppercase mb-2 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-[#2B3BFF]" />
            Telemetry Privacy Mode
          </label>
          <div className="grid grid-cols-3 gap-2 text-xs">
            {(['strict', 'guarded', 'relaxed'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => onPrivacyModeChange(mode)}
                className={`p-2.5 rounded-xl border capitalize text-center transition-all duration-150 cursor-pointer backdrop-blur-md ${
                  privacyMode === mode
                    ? 'bg-white/[0.09] border-white/[0.22] text-[#35FEE4] font-bold shadow-[0_0_12px_rgba(255,255,255,0.1)]'
                    : 'bg-white/[0.03] border-white/[0.08] text-[#94A3B8] hover:text-[#F4F6FB] hover:bg-white/[0.08]'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-white/[0.08] shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#2B3BFF] hover:bg-[#3848FF] text-[#F4F6FB] text-xs font-bold cursor-pointer transition-all shadow-[0_0_14px_rgba(43,59,255,0.35)]"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
