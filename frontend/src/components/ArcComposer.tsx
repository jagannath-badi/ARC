import React, { useRef, useEffect } from 'react';
import {
  ArrowUp,
  Paperclip,
  Mic,
  MicOff,
  X,
  FileText,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
} from 'lucide-react';

export interface ArcComposerProps {
  inputPrompt: string;
  setInputPrompt: (val: string) => void;
  onSend: (override?: string) => void;
  isLoading: boolean;
  attachedFile: File | null;
  onAttachFile: (file: File) => void;
  onRemoveAttachment: () => void;
  isListening: boolean;
  isSpeaking: boolean;
  onToggleListening: () => void;
  liveTranscript?: string;
  voiceError?: string | null;
  onClearVoiceError?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export const ArcComposer: React.FC<ArcComposerProps> = ({
  inputPrompt,
  setInputPrompt,
  onSend,
  isLoading,
  attachedFile,
  onAttachFile,
  onRemoveAttachment,
  isListening,
  isSpeaking,
  onToggleListening,
  liveTranscript,
  voiceError,
  onClearVoiceError,
  placeholder = 'Ask a question or paste a diagram...',
  autoFocus = false,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea based on input content
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const newHeight = Math.min(el.scrollHeight, 180);
    el.style.height = `${Math.max(newHeight, 44)}px`;
  }, [inputPrompt]);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && (inputPrompt.trim() || attachedFile)) {
        onSend();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    // 1. If an image is pasted directly into the textarea, attach it as DUT/scope artifact
    const items = Array.from(e.clipboardData?.items || []);
    const imageItem = items.find((item) => item.type.startsWith('image/'));
    if (imageItem) {
      const file = imageItem.getAsFile();
      if (file) {
        e.preventDefault();
        onAttachFile(file);
        return;
      }
    }

    // 2. Multi-line & numbered text paste formatting preservation
    const rawText = e.clipboardData?.getData('text/plain');
    if (rawText) {
      e.preventDefault();
      // Normalize line endings to standard \n without collapsing spaces or stripping list markers
      const normalized = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

      const textarea = textareaRef.current;
      if (textarea) {
        const start = textarea.selectionStart ?? 0;
        const end = textarea.selectionEnd ?? 0;
        const currentVal = textarea.value;
        const nextVal = currentVal.substring(0, start) + normalized + currentVal.substring(end);
        setInputPrompt(nextVal);

        const nextCursor = start + normalized.length;
        requestAnimationFrame(() => {
          if (textareaRef.current) {
            textareaRef.current.selectionStart = nextCursor;
            textareaRef.current.selectionEnd = nextCursor;
          }
        });
      } else {
        setInputPrompt(normalized);
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onAttachFile(file);
    }
    e.target.value = '';
  };

  const isImage = attachedFile?.type.startsWith('image/');
  const canSend = !isLoading && (inputPrompt.trim().length > 0 || attachedFile !== null);

  return (
    <div className="w-full relative select-none">
      <input
        type="file"
        id="arc-file-attachment-input"
        name="attachment"
        aria-label="Upload document, notes, or image attachment"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,text/plain,text/markdown,.pdf,.txt,.md"
        className="hidden"
      />

      <div className="bg-[#0B0D1D]/75 backdrop-blur-xl [-webkit-backdrop-filter:blur(24px)] border border-white/[0.10] focus-within:border-white/[0.22] focus-within:ring-2 focus-within:ring-white/[0.08] rounded-2xl shadow-[0_12px_36px_-4px_rgba(0,0,0,0.8),inset_0_1px_0_0_rgba(255,255,255,0.08)] transition-[border-color,box-shadow] duration-150 p-2.5 sm:p-3 flex flex-col gap-2">
        {/* Voice Dictation Status Banner */}
        {(isListening || liveTranscript || voiceError) && (
          <div className="px-3 py-2 rounded-xl bg-white/[0.04] backdrop-blur-md border border-white/[0.10] text-xs font-mono flex items-center justify-between gap-2 animate-in fade-in duration-150">
            {voiceError ? (
              <div className="flex items-center gap-2 text-rose-400 min-w-0 flex-1">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
                <span className="truncate min-w-0 flex-1">{voiceError}</span>
              </div>
            ) : isListening ? (
              <div className="flex items-center gap-2 text-[#35FEE4] min-w-0 flex-1">
                <span className="w-2 h-2 rounded-full bg-[#35FEE4] animate-ping" />
                <span className="font-semibold text-[11px] uppercase tracking-wider">Listening</span>
                {liveTranscript && (
                  <span className="text-[#F4F6FB] italic truncate font-sans min-w-0 flex-1">
                    &ldquo;{liveTranscript}&rdquo;
                  </span>
                )}
              </div>
            ) : null}

            <div className="flex items-center gap-2 flex-shrink-0">
              {voiceError && onClearVoiceError && (
                <button
                  type="button"
                  onClick={onClearVoiceError}
                  aria-label="Dismiss voice notice"
                  className="p-1 hover:bg-rose-950/40 rounded text-rose-400 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
              {isListening && (
                <button
                  type="button"
                  onClick={onToggleListening}
                  aria-label="Finish voice dictation"
                  className="px-2 py-0.5 rounded bg-white/[0.08] hover:bg-white/[0.15] border border-white/[0.12] text-[#F4F6FB] text-[10px] font-mono cursor-pointer transition-colors"
                >
                  Done
                </button>
              )}
            </div>
          </div>
        )}

        {/* Attached File Chip Preview */}
        {attachedFile && (
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.04] backdrop-blur-md border border-white/[0.10] text-xs font-mono text-[#F4F6FB] max-w-full">
            <div className="flex items-center gap-2.5 min-w-0 flex-1 truncate">
              {isImage ? (
                <div className="w-6 h-6 rounded bg-white/[0.06] border border-white/[0.10] flex items-center justify-center text-[#35FEE4] flex-shrink-0">
                  <ImageIcon className="w-3.5 h-3.5" aria-hidden="true" />
                </div>
              ) : (
                <div className="w-6 h-6 rounded bg-white/[0.06] border border-white/[0.10] flex items-center justify-center text-[#818CF8] flex-shrink-0">
                  <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                </div>
              )}
              <div className="min-w-0 flex-1 truncate">
                <span className="font-medium text-[#F4F6FB] truncate block">
                  {attachedFile.name}
                </span>
                <span className="text-[10px] text-[#94A3B8] tabular-nums truncate block">
                  {(attachedFile.size / 1024).toFixed(1)} KB •{' '}
                  {isImage ? 'Visual Inspection Scope' : 'Document Ingest'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onRemoveAttachment}
              aria-label="Remove attached file"
              className="p-1.5 min-h-[32px] min-w-[32px] flex items-center justify-center rounded-md text-[#64748B] hover:text-rose-400 hover:bg-white/[0.06] transition-colors cursor-pointer ml-2 flex-shrink-0"
              title="Remove attachment"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Main Text Input Area */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            id="arc-composer-prompt"
            name="prompt"
            aria-label="Study query, research prompt, or question"
            autoComplete="off"
            spellCheck={false}
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={placeholder}
            disabled={isLoading}
            rows={1}
            className="w-full bg-transparent resize-none outline-none text-base sm:text-[15px] text-[#F4F6FB] placeholder:text-[#64748B] py-1 px-1 font-sans leading-relaxed min-h-[44px] cursor-text"
          />
        </div>

        {/* Composer Controls Tray */}
        <div className="flex items-center justify-between pt-1 border-t border-white/[0.08] mt-0.5">
          {/* Left Buttons: Attach, Mic */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              aria-label="Attach notes, image, or document (PDF, TXT, MD)"
              className={`p-2 min-h-[40px] min-w-[40px] rounded-lg border text-xs flex items-center justify-center transition-all duration-150 backdrop-blur-md cursor-pointer focus-visible:ring-2 focus-visible:ring-[#2B3BFF] focus-visible:outline-none ${
                attachedFile
                  ? 'bg-[#2B3BFF]/20 border-white/[0.20] text-[#35FEE4]'
                  : 'bg-white/[0.04] hover:bg-white/[0.09] border-white/[0.09] hover:border-white/[0.16] text-[#94A3B8] hover:text-[#F4F6FB]'
              }`}
              title="Attach notes, image, or document (PDF, TXT, MD)"
            >
              <Paperclip className="w-4 h-4" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={onToggleListening}
              disabled={isLoading}
              aria-label={isListening ? 'Stop listening' : 'Dictate with voice'}
              className={`p-2 min-h-[40px] min-w-[40px] rounded-lg border text-xs flex items-center justify-center transition-all duration-150 backdrop-blur-md cursor-pointer focus-visible:ring-2 focus-visible:ring-[#2B3BFF] focus-visible:outline-none ${
                isListening
                  ? 'bg-[#35FEE4]/15 border-[#35FEE4]/50 text-[#35FEE4] animate-pulse'
                  : isSpeaking
                  ? 'bg-[#2B3BFF]/20 border-white/[0.20] text-[#818CF8]'
                  : 'bg-white/[0.04] hover:bg-white/[0.09] border-white/[0.09] hover:border-white/[0.16] text-[#94A3B8] hover:text-[#F4F6FB]'
              }`}
              title={isListening ? 'Stop listening' : 'Dictate with voice'}
            >
              {isListening ? (
                <MicOff className="w-4 h-4" aria-hidden="true" />
              ) : (
                <Mic className="w-4 h-4" aria-hidden="true" />
              )}
            </button>
          </div>

          {/* Right Controls: Shortcut Legend & Send Action */}
          <div className="flex items-center gap-2.5">
            <span className="hidden md:inline-block text-[10px] font-mono text-[#64748B]">
              <kbd className="px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] text-[9px] text-[#94A3B8]">Enter</kbd> to run
            </span>

            <button
              type="button"
              onClick={() => onSend()}
              disabled={!canSend}
              aria-label="Run prompt (Enter)"
              className={`p-2 sm:px-3 sm:py-2 min-h-[40px] min-w-[40px] rounded-lg font-medium text-xs flex items-center justify-center gap-1.5 transition-all duration-150 shadow-xs focus-visible:ring-2 focus-visible:ring-[#2B3BFF] focus-visible:outline-none ${
                canSend
                  ? 'bg-[#2B3BFF] hover:bg-[#3848FF] active:scale-[0.98] text-[#F4F6FB] shadow-[0_0_14px_rgba(43,59,255,0.4)] cursor-pointer'
                  : 'bg-white/[0.03] text-[#64748B] border border-white/[0.06] cursor-not-allowed shadow-none'
              }`}
              title="Run query (Enter)"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#F4F6FB]" aria-hidden="true" />
              ) : (
                <>
                  <ArrowUp className="w-4 h-4" aria-hidden="true" />
                  <span className="hidden sm:inline font-mono">Run</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
