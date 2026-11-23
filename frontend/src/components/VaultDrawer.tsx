import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Layers,
  Trash2,
  Loader2,
  Camera,
  MessageSquare,
  BookmarkPlus,
  Clock,
  UserCheck,
  UploadCloud,
  FileText,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import {
  fetchVaultSessions,
  fetchSessionDetail,
  saveCurrentSession,
  deleteVaultSession,
  ingestVaultDocument,
  type SessionSummary,
  type SessionDetail,
  type OperatorUser,
} from '../api';
import type { DisplayMessage } from './DiagnosticFeed';

export interface VaultDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: OperatorUser | null;
  currentMessages: DisplayMessage[];
  currentDutImage: string | null;
  onRestoreSession: (session: {
    messages: DisplayMessage[];
    dutImage: string | null;
    sessionId: string;
  }) => void;
  onOpenAuthModal: () => void;
  onSessionsChange?: (count: number) => void;
  vaultConceptsCount?: number;
  onConceptsChange?: (newCount: number) => void;
}

function formatRelativeTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 7) return `${diffDay}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return 'Recent';
  }
}

export const VaultDrawer: React.FC<VaultDrawerProps> = ({
  isOpen,
  onClose,
  currentUser,
  currentMessages,
  currentDutImage,
  onRestoreSession,
  onOpenAuthModal,
  onSessionsChange,
  vaultConceptsCount = 0,
  onConceptsChange,
}) => {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null);
  const [actionSessionId, setActionSessionId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const loadSessions = useCallback(async () => {
    if (!currentUser) {
      setSessions([]);
      onSessionsChange?.(0);
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await fetchVaultSessions();
      setSessions(data);
      onSessionsChange?.(data.length);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to load archived sessions.');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, onSessionsChange]);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      void loadSessions();
    }, 0);
    return () => clearTimeout(timer);
  }, [isOpen, loadSessions]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleArchiveCurrent = async () => {
    if (!currentUser) {
      onOpenAuthModal();
      return;
    }
    if (currentMessages.length === 0 && !currentDutImage) {
      setErrorMessage('No active session telemetry to archive.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    try {
      let persistentDutImage: string | null = currentDutImage;
      if (currentDutImage && currentDutImage.startsWith('blob:')) {
        try {
          const res = await fetch(currentDutImage);
          const blob = await res.blob();
          persistentDutImage = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } catch {
          persistentDutImage = null;
        }
      }

      const saved: SessionDetail = await saveCurrentSession({
        dut_image: persistentDutImage,
        messages: currentMessages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          metadata: m.metadata,
        })),
      });
      await loadSessions();
      setErrorMessage(null);
      setActionSessionId(saved.id);
      setTimeout(() => setActionSessionId(null), 2000);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to archive run.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadSession = async (sess: SessionSummary) => {
    setActionSessionId(sess.id);
    setErrorMessage(null);
    try {
      const detail = await fetchSessionDetail(sess.id);
      onRestoreSession({
        messages: detail.messages.map((m, idx) => ({
          id: m.id || `restored-${idx}`,
          role: m.role,
          content: m.content,
          metadata: m.metadata as DisplayMessage['metadata'],
        })),
        dutImage: detail.dut_image,
        sessionId: detail.id,
      });
      onClose();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to load session details.');
    } finally {
      setActionSessionId(null);
    }
  };

  const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (!window.confirm('Delete this archived study session?')) return;
    setActionSessionId(sessionId);
    setErrorMessage(null);
    try {
      await deleteVaultSession(sessionId);
      const updated = sessions.filter((s) => s.id !== sessionId);
      setSessions(updated);
      onSessionsChange?.(updated.length);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to delete session.');
    } finally {
      setActionSessionId(null);
    }
  };

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingDoc(true);
    setErrorMessage(null);
    setUploadSuccessMsg(null);
    try {
      const res = await ingestVaultDocument(file);
      setUploadSuccessMsg(`Indexed ${file.name} (+${res.chunks_indexed} chunks)`);
      if (onConceptsChange) {
        onConceptsChange(vaultConceptsCount + res.chunks_indexed);
      }
      setTimeout(() => setUploadSuccessMsg(null), 3000);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to ingest document.');
    } finally {
      setIsUploadingDoc(false);
      e.target.value = '';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end select-none">
          {/* Dimmed backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Slide-over Knowledge Vault Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full sm:w-[440px] h-full bg-[#0B0D1D]/85 backdrop-blur-2xl [-webkit-backdrop-filter:blur(24px)] border-l border-white/[0.10] shadow-drawer flex flex-col text-[#F4F6FB]"
          >
            {/* Header */}
            <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-white/[0.08] bg-white/[0.02] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.10] backdrop-blur-md flex items-center justify-center text-[#2B3BFF] shrink-0">
                  <Layers className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    <h2 className="text-xs font-mono font-bold tracking-wider uppercase text-[#F4F6FB] truncate">
                      Knowledge Vault
                    </h2>
                    {vaultConceptsCount > 0 && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.10] text-[#35FEE4] font-semibold shrink-0">
                        {vaultConceptsCount} CHUNKS
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#94A3B8] font-mono truncate">
                    Documents & session context
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                type="button"
                className="p-2 rounded-lg text-[#94A3B8] hover:text-[#F4F6FB] bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.07] hover:border-white/[0.14] transition-all duration-150 min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer focus-visible:ring-2 focus-visible:ring-[#2B3BFF] focus-visible:outline-none shrink-0"
                title="Close drawer (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Document Ingestion Quick Zone */}
            <div className="p-4 border-b border-white/[0.08] bg-white/[0.015]">
              <input
                id="vault-document-upload-input"
                name="vault-doc"
                type="file"
                ref={docInputRef}
                onChange={handleDocUpload}
                accept="application/pdf,text/plain,text/markdown,.pdf,.txt,.md"
                aria-label="Upload document to Knowledge Vault"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => docInputRef.current?.click()}
                disabled={isUploadingDoc}
                className="w-full p-3 rounded-xl border border-dashed border-white/[0.12] hover:border-white/[0.25] bg-white/[0.03] hover:bg-white/[0.07] backdrop-blur-md transition-all flex items-center justify-center gap-2.5 text-xs font-mono text-[#94A3B8] hover:text-[#35FEE4] cursor-pointer focus-visible:ring-2 focus-visible:ring-[#2B3BFF] focus-visible:outline-none"
              >
                {isUploadingDoc ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#35FEE4]" />
                    <span className="text-[#35FEE4]">Indexing document into vault…</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4 text-[#2B3BFF]" />
                    <span>Upload & index document (.PDF, .TXT, .MD)</span>
                  </>
                )}
              </button>

              {uploadSuccessMsg && (
                <div className="mt-2 text-[11px] font-mono text-[#35FEE4] bg-emerald-950/40 border border-emerald-800/50 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#35FEE4]" />
                  <span>{uploadSuccessMsg}</span>
                </div>
              )}
            </div>

            {/* Content Body: Sessions & Management */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 diagnostic-feed-scrollbar">
              {errorMessage && (
                <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs font-mono flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span className="min-w-0 flex-1 break-words [overflow-wrap:anywhere] leading-normal">{errorMessage}</span>
                </div>
              )}

              {!currentUser ? (
                /* Guest Mode Card */
                <div className="p-5 rounded-2xl bg-white/[0.035] backdrop-blur-md border border-white/[0.09] flex flex-col items-center text-center gap-3 my-auto shadow-card">
                  <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.10] flex items-center justify-center text-[#35FEE4]">
                    <UserCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#F4F6FB]">
                      Sign In to Sync Sessions
                    </h3>
                    <p className="text-[11px] text-[#94A3B8] mt-1 leading-relaxed">
                      Authenticate to archive study notes, problem sets, diagrams, and recall past multi-turn learning sessions.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenAuthModal();
                    }}
                    className="mt-2 w-full py-2 rounded-xl bg-gradient-to-r from-[#4F5DFF]/25 via-[#7C88FF]/20 to-[#35FEE4]/25 hover:from-[#4F5DFF]/35 hover:to-[#35FEE4]/35 active:scale-[0.98] text-[#F4F6FB] font-mono text-xs uppercase tracking-wider font-semibold transition-all backdrop-blur-xl border border-white/[0.18] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15)] cursor-pointer focus-visible:ring-2 focus-visible:ring-[#2B3BFF] focus-visible:outline-none"
                  >
                    Sign In / Register
                  </button>
                </div>
              ) : (
                <>
                  {/* Archive Current Session Button */}
                  <button
                    type="button"
                    onClick={handleArchiveCurrent}
                    disabled={isSaving || (currentMessages.length === 0 && !currentDutImage)}
                    className={`w-full p-3 rounded-xl border font-mono text-xs flex items-center justify-between transition-all duration-150 focus-visible:ring-2 focus-visible:ring-[#2B3BFF] focus-visible:outline-none ${
                      currentMessages.length > 0 || currentDutImage
                        ? 'bg-white/[0.05] hover:bg-white/[0.09] backdrop-blur-md border-white/[0.12] hover:border-white/[0.20] text-[#F4F6FB] cursor-pointer shadow-xs'
                        : 'bg-white/[0.02] border-white/[0.06] text-[#64748B] cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin text-[#35FEE4]" />
                      ) : (
                        <BookmarkPlus className="w-4 h-4 text-[#2B3BFF]" />
                      )}
                      <span className="font-semibold uppercase tracking-wider">
                        {isSaving ? 'SAVING SESSION...' : 'SAVE CURRENT SESSION'}
                      </span>
                    </div>
                    <span className="text-[10px] text-[#94A3B8] flex items-center gap-1">
                      {currentDutImage && <Camera className="w-2.5 h-2.5 text-[#35FEE4]" />}
                      {currentMessages.length} msgs
                    </span>
                  </button>

                  {/* Sessions List */}
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-mono text-[#64748B] uppercase tracking-wider px-1">
                      SAVED SESSIONS ({sessions.length})
                    </span>

                    {isLoading ? (
                      <div className="flex flex-col items-center justify-center py-12 gap-2 text-[#64748B] font-mono text-xs">
                        <Loader2 className="w-5 h-5 animate-spin text-[#2B3BFF]" />
                        <span>Loading saved sessions...</span>
                      </div>
                    ) : sessions.length === 0 ? (
                      <div className="p-8 rounded-2xl bg-white/[0.03] backdrop-blur-sm border border-white/[0.08] flex flex-col items-center text-center gap-2.5 my-6">
                        <FileText className="w-8 h-8 text-[#64748B]" />
                        <span className="text-xs font-mono font-medium text-[#F4F6FB] uppercase">
                          No Saved Sessions
                        </span>
                        <p className="text-[11px] text-[#94A3B8] max-w-[240px]">
                          Complete an analysis, then click &ldquo;Save Current Session&rdquo; to store it in your workspace.
                        </p>
                      </div>
                    ) : (
                      sessions.map((sess) => {
                        const isBusy = actionSessionId === sess.id;
                        return (
                          <div
                            key={sess.id}
                            tabIndex={0}
                            role="button"
                            aria-label={`Restore session: ${sess.title || 'Untitled Session'}`}
                            onClick={() => handleLoadSession(sess)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleLoadSession(sess);
                              }
                            }}
                            className="group p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] backdrop-blur-md border border-white/[0.08] hover:border-white/[0.16] transition-all duration-150 cursor-pointer flex flex-col gap-2 shadow-xs focus-visible:ring-2 focus-visible:ring-[#2B3BFF] focus-visible:outline-none"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="text-xs font-medium text-[#F4F6FB] group-hover:text-[#35FEE4] transition-colors line-clamp-1 font-mono">
                                {sess.title}
                              </h4>
                              <button
                                type="button"
                                onClick={(e) => handleDeleteSession(e, sess.id)}
                                className="text-[#64748B] hover:text-rose-400 p-1 rounded hover:bg-rose-950/40 transition-colors"
                                title="Delete archived session"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="flex items-center justify-between text-[10px] font-mono text-[#64748B]">
                              <div className="flex items-center gap-2">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-[#64748B]" />
                                  <span>{formatRelativeTime(sess.updated_at)}</span>
                                </span>
                                <span className="flex items-center gap-1 bg-white/[0.04] px-1.5 py-0.5 rounded text-[#94A3B8] border border-white/[0.08]">
                                  <MessageSquare className="w-2.5 h-2.5 text-[#2B3BFF]" />
                                  {sess.message_count}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5">
                                {sess.has_dut && (
                                  <span className="flex items-center gap-1 text-[9px] font-semibold text-[#35FEE4] bg-[#35FEE4]/10 border border-[#35FEE4]/25 px-1.5 py-0.5 rounded">
                                    <Camera className="w-2.5 h-2.5" />
                                    SCOPE
                                  </span>
                                )}
                                <span className="text-[10px] text-[#35FEE4] group-hover:underline flex items-center gap-0.5">
                                  {isBusy ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <span>Restore →</span>
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-white/[0.08] text-[10px] font-mono text-[#64748B] flex items-center justify-between bg-white/[0.02] flex-shrink-0">
              <span>ARC Knowledge Subsystem</span>
              <span className="text-[#35FEE4]">Synced Locally</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
