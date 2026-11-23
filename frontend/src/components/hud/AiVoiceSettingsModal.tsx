import React from 'react';
import { X, Mic, Volume2, Play, Loader2, AlertCircle } from 'lucide-react';
import { ARC_VOICES, type VoiceSettings, type VoicePreviewStatus } from '../../hooks/useArcVoice';

interface AiVoiceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  voiceSettings: VoiceSettings;
  onUpdateVoiceSettings: (settings: Partial<VoiceSettings>) => void;
  onTestVoice: (voiceId?: string) => void;
  isSpeaking?: boolean;
  previewingVoiceId?: string | null;
  previewStatus?: VoicePreviewStatus | null;
  systemVoiceCount?: number;
  isSingleSystemVoice?: boolean;
}

export const AiVoiceSettingsModal: React.FC<AiVoiceSettingsModalProps> = ({
  isOpen,
  onClose,
  voiceSettings,
  onUpdateVoiceSettings,
  onTestVoice,
  isSpeaking: _isSpeaking, // deprecated - kept for prop compatibility
  previewingVoiceId = null,
  previewStatus = null,
  systemVoiceCount,
  isSingleSystemVoice = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in select-none font-mono">
      <div className="w-full max-w-xl max-h-[calc(100dvh-2rem)] rounded-2xl bg-[#0B0D1D]/90 backdrop-blur-2xl border border-white/[0.10] shadow-[0_20px_60px_rgba(0,0,0,0.85),inset_0_1px_0_0_rgba(255,255,255,0.08)] p-4 sm:p-5 flex flex-col gap-3 sm:gap-4 text-[#F4F6FB] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] gap-2 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.10] backdrop-blur-md flex items-center justify-center text-[#2B3BFF] shrink-0">
              <Mic className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <h2 className="text-sm font-bold text-[#F4F6FB] truncate">ARC Voice Subsystem</h2>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-semibold bg-white/[0.05] text-[#35FEE4] border border-white/[0.09] shrink-0">
                  Web Speech API
                </span>
              </div>
              <p className="text-[11px] text-[#94A3B8] truncate">Fast conversational voice personas with browser speech synthesis</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[#94A3B8] hover:text-[#F4F6FB] bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.07] hover:border-white/[0.14] transition-all duration-150 min-h-[38px] min-w-[38px] flex items-center justify-center cursor-pointer shrink-0"
            aria-label="Close voice settings"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode & Audio Telemetry Settings */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 rounded-xl bg-white/[0.02] border border-white/[0.07] backdrop-blur-md shrink-0">
          {/* Interaction Mode */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider flex items-center justify-between">
              <span>Interaction Mode</span>
              <span className="text-[9px] font-normal text-[#64748B]">
                {voiceSettings.interactionMode === 'live' ? 'Duplex Loop' : 'Single Turn'}
              </span>
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => onUpdateVoiceSettings({ interactionMode: 'single' })}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5 ${
                  voiceSettings.interactionMode === 'single'
                    ? 'bg-[#2B3BFF]/20 border-[#2B3BFF] text-[#F4F6FB] shadow-[0_0_10px_rgba(43,59,255,0.25)]'
                    : 'bg-white/[0.03] hover:bg-white/[0.07] border-white/[0.07] text-[#94A3B8] hover:text-[#F4F6FB]'
                }`}
              >
                <span>Push-to-Talk</span>
              </button>
              <button
                type="button"
                onClick={() => onUpdateVoiceSettings({ interactionMode: 'live' })}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5 ${
                  voiceSettings.interactionMode === 'live'
                    ? 'bg-[#35FEE4]/15 border-[#35FEE4]/50 text-[#35FEE4] shadow-[0_0_10px_rgba(53,254,228,0.2)]'
                    : 'bg-white/[0.03] hover:bg-white/[0.07] border-white/[0.07] text-[#94A3B8] hover:text-[#F4F6FB]'
                }`}
              >
                <span>Live Continuous</span>
              </button>
            </div>
          </div>

          {/* Speech Rate & Auto-Speak */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">
                Speech Rate
              </label>
              <button
                type="button"
                onClick={() => onUpdateVoiceSettings({ autoSpeak: !voiceSettings.autoSpeak })}
                className={`text-[10px] px-2 py-0.5 rounded font-mono border transition-all cursor-pointer ${
                  voiceSettings.autoSpeak
                    ? 'bg-[#2B3BFF]/20 border-[#2B3BFF]/60 text-[#35FEE4]'
                    : 'bg-white/[0.04] border-white/[0.08] text-[#64748B] hover:text-[#94A3B8]'
                }`}
              >
                Auto-Speak: {voiceSettings.autoSpeak ? 'ON' : 'OFF'}
              </button>
            </div>
            <div className="grid grid-cols-4 gap-1">
              {[0.8, 1.0, 1.2, 1.5].map((rate) => {
                const isSelected = Math.abs((voiceSettings.speechRate || 1.0) - rate) < 0.05;
                return (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => onUpdateVoiceSettings({ speechRate: rate })}
                    className={`py-1 rounded text-xs font-mono font-medium border transition-all duration-150 cursor-pointer text-center ${
                      isSelected
                        ? 'bg-[#2B3BFF]/25 border-white/[0.30] text-[#35FEE4] shadow-[0_0_8px_rgba(43,59,255,0.3)]'
                        : 'bg-white/[0.03] hover:bg-white/[0.07] border-white/[0.07] text-[#94A3B8] hover:text-[#F4F6FB]'
                    }`}
                  >
                    {rate}x
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 1. Voice Persona Selection (Scrollable Body) */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <label className="block text-xs font-bold text-[#94A3B8] uppercase mb-2 shrink-0">Voice Personas</label>
          <div className="space-y-2 flex-1 overflow-y-auto pr-1 diagnostic-feed-scrollbar">
            {ARC_VOICES.map((v) => {
              const isSelected = voiceSettings.voiceId === v.id;
              return (
                <div
                  key={v.id}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all duration-150 backdrop-blur-md ${
                    isSelected
                      ? 'bg-white/[0.09] border-white/[0.22] text-[#F4F6FB] shadow-[0_4px_16px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.08)]'
                      : 'bg-white/[0.03] hover:bg-white/[0.08] border-white/[0.08] hover:border-white/[0.16] text-[#94A3B8] hover:text-[#F4F6FB]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onUpdateVoiceSettings({ voiceId: v.id })}
                    className="flex-1 text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#F4F6FB]">{v.name}</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/[0.04] text-[#35FEE4] border border-white/[0.08]">
                        {v.tag}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#94A3B8] mt-0.5 line-clamp-1">{v.desc}</p>
                    <div className="text-[10px] text-[#64748B] mt-1 flex items-center gap-2">
                      <span>Accent: {v.accent}</span>
                      <span>•</span>
                      <span>Gender: {v.gender}</span>
                    </div>
                  </button>

                  <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => onTestVoice(v.id)}
                      disabled={previewingVoiceId !== null && previewingVoiceId !== v.id}
                      className={`p-1.5 rounded-lg border transition-all duration-150 cursor-pointer flex items-center gap-1 text-[11px] font-mono shadow-xs backdrop-blur-md ${
                        previewingVoiceId === v.id
                          ? 'bg-[#2B3BFF]/20 border-white/[0.20] text-[#35FEE4] opacity-70'
                          : 'border-white/[0.08] hover:border-white/[0.16] bg-white/[0.04] hover:bg-white/[0.09] text-[#35FEE4] hover:text-[#F4F6FB]'
                      }`}
                      title={`Preview ${v.name}`}
                    >
                      {previewingVoiceId === v.id ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin text-[#35FEE4]" />
                          <span>Playing...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 fill-current" />
                          <span>Preview</span>
                        </>
                      )}
                    </button>
                    {isSelected && (
                      <span className="w-2.5 h-2.5 rounded-full bg-[#35FEE4] shadow-[0_0_8px_#35FEE4]" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Voice Engine Telemetry & Preview Status */}
        <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-md shrink-0 flex flex-col gap-1.5 font-mono">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[#94A3B8] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  previewStatus
                    ? 'bg-[#35FEE4] shadow-[0_0_8px_#35FEE4]'
                    : systemVoiceCount && systemVoiceCount > 0
                    ? 'bg-emerald-400/80 shadow-[0_0_6px_rgba(52,211,153,0.5)]'
                    : 'bg-amber-400'
                }`}
              />
              Voice Telemetry
            </span>
            <span className="text-[10px] text-[#64748B]">
              {systemVoiceCount !== undefined && systemVoiceCount > 0
                ? `${systemVoiceCount} system voice${systemVoiceCount === 1 ? '' : 's'} on OS`
                : 'Web Speech API'}
            </span>
          </div>

          {previewStatus ? (
            <div className="flex items-start gap-2 pt-0.5 text-[11px] leading-relaxed">
              <div className="flex flex-col gap-0.5 text-[#35FEE4]">
                <div className="flex items-center gap-1.5 font-bold flex-wrap">
                  <span className="px-1.5 py-0.2 rounded bg-[#35FEE4]/10 border border-[#35FEE4]/30 text-[9px] text-[#35FEE4]">
                    SYSTEM BROWSER VOICE
                  </span>
                  <span className="text-[#F4F6FB]">{previewStatus.voiceName}</span>
                </div>
                <span className="text-[10px] text-[#94A3B8]">
                  {previewStatus.isSingleSystemVoice ? (
                    <span className="text-amber-400/90 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0 text-amber-400" />
                      Only 1 system voice detected on this OS. Persona pitch and cadence are actively modulated to differentiate timbre.
                    </span>
                  ) : (
                    <span>Matched to closest system voice by gender, locale, and timbre.</span>
                  )}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between text-[10px] text-[#64748B]">
              <span>Click Preview on any voice card to test persona audio.</span>
              {isSingleSystemVoice && (
                <span className="text-amber-400/80">1 OS voice detected (pitch modulated)</span>
              )}
            </div>
          )}
        </div>

        {/* 2. Test Audio Action */}
        <div className="flex items-center justify-between pt-2 border-t border-white/[0.08] shrink-0">
          <button
            type="button"
            onClick={() => onTestVoice(voiceSettings.voiceId)}
            disabled={previewingVoiceId !== null && previewingVoiceId !== voiceSettings.voiceId}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all duration-150 cursor-pointer backdrop-blur-md ${
              previewingVoiceId === voiceSettings.voiceId
                ? 'bg-[#2B3BFF]/20 border-white/[0.20] text-[#35FEE4] opacity-70'
                : 'border-white/[0.08] hover:border-white/[0.16] bg-white/[0.04] hover:bg-white/[0.09] text-[#35FEE4] hover:text-[#F4F6FB]'
            }`}
          >
            {previewingVoiceId === voiceSettings.voiceId ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#35FEE4]" />
                <span>Playing...</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5" />
                <span>Test Active Voice</span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#2B3BFF] hover:bg-[#3848FF] text-[#F4F6FB] text-xs font-bold cursor-pointer transition-all shadow-[0_0_14px_rgba(43,59,255,0.35)]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
