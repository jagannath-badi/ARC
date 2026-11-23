import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X, Camera } from 'lucide-react';
import {
  analyzeImage,
  fetchAvailableModels,
  fetchCurrentOperator,
  streamChatMessage,
  fetchVaultSessions,
  fetchSessionDetail,
  deleteVaultSession,
  ingestVaultDocument,
  sendFeedbackToVault,
  type ChatResponse,
  type ModelOption,
  type OperatorUser,
  type SessionSummary,
  type ArcResponseStyle,
} from './api';
import { ArcTopBar } from './components/ArcTopBar';
import { ArcSessionRail } from './components/ArcSessionRail';
import { ArcHero } from './components/ArcHero';
import { ArcComposer } from './components/ArcComposer';
import { ArcCommandPalette } from './components/ArcCommandPalette';

import { DiagnosticFeed, type DisplayMessage } from './components/DiagnosticFeed';
import { VaultDrawer } from './components/VaultDrawer';
import { AuthModal } from './components/AuthModal';
import { AiCoreSettingsModal } from './components/hud/AiCoreSettingsModal';
import { AiVoiceSettingsModal } from './components/hud/AiVoiceSettingsModal';
import { useArcVoice } from './hooks/useArcVoice';
import { useFileAttachment } from './hooks/useFileAttachment';

const DEFAULT_MODELS: ModelOption[] = [
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

function createMessageId(prefix: 'user' | 'assistant'): string {
  return `${prefix}-${Date.now()}`;
}

export default function App() {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [activeDutImage, setActiveDutImage] = useState<string | null>(null);
  const [activeDutName, setActiveDutName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [availableModels, setAvailableModels] = useState<ModelOption[]>(DEFAULT_MODELS);
  const [selectedModel, setSelectedModel] = useState<string>('auto');
  const [currentUser, setCurrentUser] = useState<OperatorUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [vaultConcepts, setVaultConcepts] = useState(0);
  const [cognitiveStep, setCognitiveStep] = useState<string | null>(null);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [streamingMsgId, setStreamingMsgId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [privacyMode, setPrivacyMode] = useState<'strict' | 'guarded' | 'relaxed'>('guarded');
  const [responseStyle, setResponseStyle] = useState<ArcResponseStyle>(() => {
    try {
      const saved = localStorage.getItem('arc_response_style');
      if (saved === 'guided' || saved === 'natural' || saved === 'concise' || saved === 'engineer' || saved === 'academic') {
        return saved as ArcResponseStyle;
      }
    } catch {
      // ignore
    }
    return 'academic';
  });

  const handleResponseStyleChange = (style: ArcResponseStyle) => {
    setResponseStyle(style);
    try {
      localStorage.setItem('arc_response_style', style);
    } catch {
      // ignore
    }
  };

  // Modular Workbench State
  const [isRailOpen, setIsRailOpen] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [savedSessions, setSavedSessions] = useState<SessionSummary[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const activeObjectUrlsRef = useRef<Set<string>>(new Set());
  const abortControllerRef = useRef<AbortController | null>(null);
  const activeDutImageRef = useRef<string | null>(null);

  useEffect(() => {
    activeDutImageRef.current = activeDutImage;
  }, [activeDutImage]);

  const {
    attachment,
    setAttachment: handleFileSelect,
    clearAttachment: removeAttachedFile,
  } = useFileAttachment({
    shouldRevoke: (url) => url !== activeDutImageRef.current,
    onFileSelect: (file, previewUrl) => {
      activeObjectUrlsRef.current.add(previewUrl);
      const isDoc =
        file.type === 'application/pdf' ||
        file.name.toLowerCase().endsWith('.pdf') ||
        file.name.toLowerCase().endsWith('.txt') ||
        file.name.toLowerCase().endsWith('.md');
      setActiveDutImage(previewUrl);
      setActiveDutName(file.name);
      if (isDoc) {
        void ingestVaultDocument(file)
          .then((r) => setVaultConcepts((c) => c + r.chunks_indexed))
          .catch(() => {});
      }
    },
    onError: setErrorMessage,
  });

  const {
    isVoiceEnabled,
    isListening,
    isSpeaking,
    voiceSettings,
    liveTranscript,
    voiceError,
    clearVoiceError,
    updateVoiceSettings,
    toggleVoiceMode,
    startListening,
    stopListening,
    speak,
    cancelSpeech,
    hardResetVoice,
    testVoicePersona,
    previewingVoiceId,
    previewStatus,
    systemVoiceCount,
    isSingleSystemVoice,
  } = useArcVoice({
    onTranscript: (t) => {
      setInputPrompt(t);
    },
    onFinalTranscript: (t) => {
      if (t.trim()) void handleSendMessage(t.trim());
    },
  });

  const voiceState: 'idle' | 'listening' | 'transcribing' | 'speaking' = isSpeaking
    ? 'speaking'
    : isListening
    ? 'listening'
    : 'idle';

  const loadSessions = useCallback(async () => {
    setIsLoadingSessions(true);
    try {
      const data = await fetchVaultSessions();
      setSavedSessions(data);
    } catch {
      // Guest or offline
    } finally {
      setIsLoadingSessions(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchAvailableModels().then(setAvailableModels).catch(() => {});
      void fetchCurrentOperator().then(setCurrentUser).catch(() => {});
      void loadSessions();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadSessions]);

  useEffect(() => {
    const urls = activeObjectUrlsRef.current;
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
      urls.clear();
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  // Keyboard shortcut listener (Ctrl+K, Cmd+K, Ctrl+B, Cmd+B)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setIsRailOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Clipboard paste listener for images
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const file = Array.from(e.clipboardData?.items || [])
        .find((i) => i.type.startsWith('image/'))
        ?.getAsFile();
      if (file) handleFileSelect(file);
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [handleFileSelect]);

  const handleEjectDut = () => {
    if (activeDutImage) {
      if (activeDutImage.startsWith('blob:')) {
        URL.revokeObjectURL(activeDutImage);
      }
      activeObjectUrlsRef.current.delete(activeDutImage);
    }
    setActiveDutImage(null);
    setActiveDutName(null);
    removeAttachedFile();
  };

  const handleClearChat = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    hardResetVoice();
    setSpeakingMsgId(null);
    setCognitiveStep(null);
    setIsLoading(false);
    activeObjectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    activeObjectUrlsRef.current.clear();
    setActiveDutImage(null);
    setActiveDutName(null);
    setMessages([]);
    setErrorMessage(null);
    setActiveSessionId(null);
    removeAttachedFile();
  };

  const handleRestoreSession = async (summary: SessionSummary) => {
    try {
      const detail = await fetchSessionDetail(summary.id);
      const restored: DisplayMessage[] = detail.messages.map((m, idx) => ({
        id: m.id || `restored-${idx}-${Date.now()}`,
        role: m.role,
        content: m.content,
        metadata:
          m.metadata?.provider && m.metadata?.model_id
            ? {
                provider: m.metadata.provider,
                model_id: m.metadata.model_id,
                attempts: typeof m.metadata.attempts === 'number' ? m.metadata.attempts : 1,
                fallback_used: Boolean(m.metadata.fallback_used),
                original_model:
                  typeof m.metadata.original_model === 'string' ? m.metadata.original_model : null,
              }
            : undefined,
      }));
      setMessages(restored);
      if (detail.dut_image) {
        setActiveDutImage(detail.dut_image);
        setActiveDutName('Archived Scope');
      }
      setActiveSessionId(detail.id);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to restore session.');
    }
  };

  const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (!window.confirm('Delete this archived study session?')) return;
    try {
      await deleteVaultSession(sessionId);
      setSavedSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (activeSessionId === sessionId) {
        setActiveSessionId(null);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to delete session.');
    }
  };

  const handleSendMessage = async (overridePrompt?: string) => {
    const text = (overridePrompt !== undefined ? overridePrompt : inputPrompt).trim();
    if (!text && !attachment.file) return;

    setErrorMessage(null);
    setIsLoading(true);

    const fileToUpload = attachment.file;
    const isImage = Boolean(fileToUpload && fileToUpload.type.startsWith('image/'));
    const isTextDoc = Boolean(
      fileToUpload &&
        (fileToUpload.type === 'text/plain' ||
          fileToUpload.type === 'text/markdown' ||
          fileToUpload.name.toLowerCase().endsWith('.txt') ||
          fileToUpload.name.toLowerCase().endsWith('.md'))
    );

    // Reuse attachment.previewUrl for image preview instead of creating duplicate object URLs
    const msgImg = isImage && attachment.previewUrl ? attachment.previewUrl : undefined;
    if (msgImg) {
      activeObjectUrlsRef.current.add(msgImg);
    }

    let textContent = text;
    if (isTextDoc && fileToUpload) {
      try {
        const fileContent = await fileToUpload.text();
        const header = `=== ATTACHED FILE: ${fileToUpload.name} ===\n${fileContent}\n=== END ATTACHED FILE ===`;
        textContent = textContent ? `${textContent}\n\n${header}` : header;
      } catch (docErr) {
        console.warn('Failed to read text attachment:', docErr);
      }
    }

    const userMsgId = createMessageId('user');
    setMessages((prev) => [
      ...prev,
      {
        id: userMsgId,
        role: 'user',
        content: text || (isTextDoc && fileToUpload ? `(Attached note: ${fileToUpload.name})` : '(Analysis artifact)'),
        imagePreviewUrl: msgImg,
      },
    ]);

    // Immediately clear composer input and draft attachment on submit
    setInputPrompt('');
    removeAttachedFile();

    if (fileToUpload && !isTextDoc) {
      try {
        const targetProvider = availableModels.find((m) => m.id === selectedModel)?.provider;
        const res: ChatResponse = await analyzeImage(
          fileToUpload,
          textContent || undefined,
          selectedModel,
          targetProvider,
          undefined,
          responseStyle,
          privacyMode
        );
        const aId = createMessageId('assistant');
        setMessages((prev) => [
          ...prev,
          {
            id: aId,
            role: 'assistant',
            content: res.answer,
            metadata: {
              provider: res.provider,
              model_id: res.model_id,
              attempts: res.attempts,
              fallback_used: res.fallback_used,
              original_model: res.original_model,
            },
          },
        ]);
        if (isVoiceEnabled && voiceSettings.autoSpeak && res.answer) {
          setSpeakingMsgId(aId);
          void speak(res.answer, () => setSpeakingMsgId(null));
        }
      } catch (err: unknown) {
        setErrorMessage(err instanceof Error ? err.message : 'Error analyzing artifact.');
      } finally {
        setIsLoading(false);
      }
    } else {
      if (abortControllerRef.current) abortControllerRef.current.abort();
      const ctrl = new AbortController();
      abortControllerRef.current = ctrl;
      const aId = createMessageId('assistant');
      setMessages((prev) => [
        ...prev,
        {
          id: aId,
          role: 'assistant',
          content: '',
          metadata: {
            provider: 'ARC Core',
            model_id: selectedModel,
            attempts: 1,
            fallback_used: false,
          },
        },
      ]);
      setStreamingMsgId(aId);

      try {
        const targetProvider = availableModels.find((m) => m.id === selectedModel)?.provider;
        await streamChatMessage(
          textContent,
          messages.map((m) => ({ role: m.role, content: m.content })),
          {
            model: selectedModel,
            provider: targetProvider,
            style: responseStyle,
            responseStyle,
            privacyMode,
            vaultContext: serializeContext(messages),
            signal: ctrl.signal,
            onStep: (step) => setCognitiveStep(step),
            onChunk: (chunk) =>
              setMessages((prev) =>
                prev.map((m) => (m.id === aId ? { ...m, content: m.content + chunk } : m))
              ),
            onDone: (res) => {
              setCognitiveStep(null);
              setStreamingMsgId(null);
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === aId
                    ? {
                        ...m,
                        content: res.answer,
                        metadata: {
                          provider: res.provider,
                          model_id: res.model_id,
                          attempts: res.attempts,
                          fallback_used: res.fallback_used,
                        },
                      }
                    : m
                )
              );
              if (isVoiceEnabled && voiceSettings.autoSpeak && res.answer) {
                setSpeakingMsgId(aId);
                void speak(res.answer, () => setSpeakingMsgId(null));
              }
            },
            onError: (err) => {
              setErrorMessage(err.message);
              setStreamingMsgId(null);
              // Clean up empty assistant bubble
              setMessages((prev) =>
                prev.filter((m) => m.id !== aId || m.content.trim().length > 0)
              );
            },
          }
        );
      } catch (err: unknown) {
        setErrorMessage(err instanceof Error ? err.message : 'Streaming error.');
        setStreamingMsgId(null);
        setMessages((prev) =>
          prev.filter((m) => m.id !== aId || m.content.trim().length > 0)
        );
      } finally {
        setIsLoading(false);
        setCognitiveStep(null);
        abortControllerRef.current = null;
        setMessages((prev) =>
          prev.filter((m) => m.role !== 'assistant' || m.content.trim().length > 0)
        );
      }
    }
  };

  const handleReadAloud = (id: string, text: string) => {
    if (speakingMsgId === id) {
      cancelSpeech();
      setSpeakingMsgId(null);
    } else {
      setSpeakingMsgId(id);
      void speak(text, () => setSpeakingMsgId(null), true);
    }
  };

  const serializeContext = (msgs: DisplayMessage[]): string => {
    const MAX_TOTAL = 2500;
    const MAX_PER_MSG = 200;
    // Get older messages (not in the recent history window)
    const olderMsgs = msgs.slice(0, -5);

    let totalChars = 0;
    const contextLines = [];

    // Iterate backwards through older messages
    for (let i = olderMsgs.length - 1; i >= 0; i--) {
      const m = olderMsgs[i];
      const content = m.content.substring(0, MAX_PER_MSG);
      const line = `${m.role}: ${content}`;

      if (totalChars + line.length > MAX_TOTAL) break;

      contextLines.unshift(line);
      totalChars += line.length + 2;
    }
    return contextLines.join('\n\n');
  };

  const handleToggleVoice = useCallback(() => {
    if (isVoiceEnabled || isSpeaking) {
      cancelSpeech();
      setSpeakingMsgId(null);
    }
    toggleVoiceMode();
  }, [cancelSpeech, isSpeaking, isVoiceEnabled, toggleVoiceMode]);

  const composerCommonProps = {
    inputPrompt,
    setInputPrompt,
    onSend: handleSendMessage,
    isLoading,
    attachedFile: attachment.file,
    onAttachFile: handleFileSelect,
    onRemoveAttachment: removeAttachedFile,
    isListening,
    isSpeaking,
    onToggleListening: () => (isListening ? stopListening() : void startListening()),
    liveTranscript,
    voiceError,
    onClearVoiceError: clearVoiceError,
  };

  return (
    <div className="h-[100dvh] max-h-[100dvh] overflow-hidden flex flex-col bg-[#05060F] text-[#F4F6FB] font-sans w-full max-w-[100vw] relative">
      {/* 56px ARC Top Bar */}
      <ArcTopBar
        availableModels={availableModels}
        selectedModel={selectedModel}
        onSelectModel={setSelectedModel}
        vaultConceptsCount={savedSessions.length}
        onToggleVault={() => setIsVaultOpen(true)}
        isVoiceEnabled={isVoiceEnabled}
        onToggleVoice={handleToggleVoice}
        onOpenSettings={() => setShowSettings(true)}
        onOpenVoiceSettings={() => setShowVoiceSettings(true)}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        isRailOpen={isRailOpen}
        onToggleRail={() => setIsRailOpen((prev) => !prev)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        voiceState={voiceState}
        isStreaming={isLoading}
        cognitiveStep={cognitiveStep}
      />

      {/* Error Alert Banner */}
      {errorMessage && (
        <div className="px-3 sm:px-4 py-2 bg-rose-950/40 border-b border-rose-800/50 text-rose-300 flex items-center justify-between gap-2 text-xs font-mono z-30 animate-in fade-in duration-150">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span className="min-w-0 flex-1 break-words [overflow-wrap:anywhere] text-xs leading-normal">[ARC SYSTEM NOTICE]: {errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-400 hover:text-rose-200 p-1 rounded hover:bg-rose-900/40 cursor-pointer shrink-0 min-h-[32px] min-w-[32px] flex items-center justify-center"
            aria-label="Dismiss error notice"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Modular Workbench Body */}
      <div className="flex-1 min-h-0 flex flex-row overflow-hidden relative">
        {/* Mobile Backdrop Overlay for Session Rail */}
        {isRailOpen && (
          <div
            onClick={() => setIsRailOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-30 md:hidden animate-in fade-in duration-150"
            aria-hidden="true"
          />
        )}

        {/* Zone 1: Collapsible Left Session Rail (240px) */}
        <ArcSessionRail
          isOpen={isRailOpen}
          onToggle={() => setIsRailOpen((prev) => !prev)}
          onNewSession={handleClearChat}
          currentMessages={messages}
          currentDutImage={activeDutImage}
          savedSessions={savedSessions}
          onRestoreSession={handleRestoreSession}
          onDeleteSession={handleDeleteSession}
          activeSessionId={activeSessionId}
          isLoadingSessions={isLoadingSessions}
        />

        {/* Zone 2: Precision Drafting Center Canvas */}
        <main className="flex-1 min-h-0 overflow-hidden flex flex-col relative z-10 arc-dot-grid">
          <AnimatePresence mode="wait">
            {messages.length === 0 ? (
              /* HERO STUDIO: Centered hero with composer */
              <motion.div
                key="hero-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                className="flex-1 min-h-0 overflow-y-auto diagnostic-feed-scrollbar flex flex-col items-center justify-center p-4 sm:p-6"
              >
                <ArcHero
                  composerProps={composerCommonProps}
                  currentUser={currentUser}
                />
              </motion.div>
            ) : (
              /* ACTIVE WORKSPACE: Diagnostic Feed + Shared-Element Bottom Docked Composer */
              <motion.div
                key="workspace-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="flex-1 min-h-0 overflow-hidden flex flex-col"
              >
                {/* Active Visual Scope Banner (if image is attached) */}
                {activeDutImage && (
                  <div className="px-3 sm:px-6 py-2 bg-[#0B0D1D] border-b border-[#1B2042] flex items-center justify-between gap-2 sm:gap-3 flex-shrink-0 text-xs font-mono z-10 shadow-xs">
                    <div className="flex items-center gap-2 text-[#35FEE4] min-w-0 flex-1">
                      <span className="w-2 h-2 rounded-full bg-[#35FEE4] animate-pulse shadow-[0_0_8px_rgba(53,254,228,0.6)] shrink-0" />
                      {activeDutImage.startsWith('data:image') || activeDutImage.startsWith('blob:') ? (
                        <img
                          src={activeDutImage}
                          alt={activeDutName || 'Mounted Scope Artifact'}
                          className="w-7 h-7 rounded object-cover border border-[#35FEE4]/30 bg-black/40 shrink-0 shadow-xs"
                        />
                      ) : (
                        <Camera className="w-3.5 h-3.5 shrink-0" />
                      )}
                      <span className="font-semibold text-[#F4F6FB] hidden xs:inline shrink-0">Active Scope Artifact:</span>
                      <span className="truncate text-[#94A3B8]">{activeDutName}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleEjectDut}
                      className="px-2.5 py-1 rounded text-[11px] font-mono bg-[#10132A] border border-[#1B2042] hover:border-rose-500/50 text-[#94A3B8] hover:text-rose-400 transition-colors cursor-pointer shrink-0 min-h-[32px]"
                    >
                      Eject
                    </button>
                  </div>
                )}

                {/* Diagnostic & Study Feed */}
                <DiagnosticFeed
                  messages={messages}
                  isLoading={isLoading}
                  onQuickAction={(p) => setInputPrompt(p)}
                  speakingMessageId={speakingMsgId}
                  streamingMessageId={streamingMsgId}
                  onReadAloud={handleReadAloud}
                  cognitiveStep={cognitiveStep}
                  onSaveToVault={async (t) => {
                    await sendFeedbackToVault(t);
                    void loadSessions();
                  }}
                />

                {/* Bottom Docked Composer with Shared-Element Transition */}
                <div className="px-3 sm:px-6 pb-3 sm:pb-5 flex-shrink-0 z-20">
                  <motion.div
                    layoutId="arc-composer-container"
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    className="max-w-4xl mx-auto shadow-workbench rounded-2xl"
                  >
                    <ArcComposer
                      {...composerCommonProps}
                      placeholder="Ask a follow-up question or attach notes/diagrams..."
                    />
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Zone 3: Slide-over Knowledge Vault Drawer */}
      <VaultDrawer
        isOpen={isVaultOpen}
        onClose={() => setIsVaultOpen(false)}
        currentUser={currentUser}
        currentMessages={messages}
        currentDutImage={activeDutImage}
        onRestoreSession={(r) => {
          setMessages(r.messages);
          if (r.dutImage) {
            setActiveDutImage(r.dutImage);
            setActiveDutName('Archived Artifact');
          }
          void loadSessions();
        }}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        vaultConceptsCount={vaultConcepts}
        onConceptsChange={setVaultConcepts}
      />

      {/* Command Palette (Ctrl+K / Cmd+K) */}
      <ArcCommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNewSession={handleClearChat}
        onToggleRail={() => setIsRailOpen((prev) => !prev)}
        onToggleVault={() => setIsVaultOpen((prev) => !prev)}
        onOpenVoiceSettings={() => setShowVoiceSettings(true)}
        onOpenSettings={() => setShowSettings(true)}
        availableModels={availableModels}
        onSelectModel={setSelectedModel}
        onSelectStarterPrompt={(promptText) => {
          void handleSendMessage(promptText);
        }}
        onSelectStyle={handleResponseStyleChange}
      />

      {/* Modals & Dialogs */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(u) => {
          setCurrentUser(u);
          void loadSessions();
        }}
      />
      <AiCoreSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        availableModels={availableModels}
        selectedModel={selectedModel}
        onSelectModel={setSelectedModel}
        privacyMode={privacyMode}
        onPrivacyModeChange={setPrivacyMode}
        responseStyle={responseStyle}
        onResponseStyleChange={handleResponseStyleChange}
      />
      <AiVoiceSettingsModal
        isOpen={showVoiceSettings}
        onClose={() => {
          cancelSpeech();
          setShowVoiceSettings(false);
        }}
        voiceSettings={voiceSettings}
        onUpdateVoiceSettings={updateVoiceSettings}
        onTestVoice={testVoicePersona}
        isSpeaking={isSpeaking}
        previewingVoiceId={previewingVoiceId}
        previewStatus={previewStatus}
        systemVoiceCount={systemVoiceCount}
        isSingleSystemVoice={isSingleSystemVoice}
      />
    </div>
  );
}
