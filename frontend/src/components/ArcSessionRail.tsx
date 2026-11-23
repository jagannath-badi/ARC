import React from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  PanelLeftClose,
  Clock,
  MessageSquare,
  Trash2,
  Camera,
  Layers,
} from 'lucide-react';
import type { SessionSummary } from '../api';
import type { DisplayMessage } from './DiagnosticFeed';

export interface ArcSessionRailProps {
  isOpen: boolean;
  onToggle: () => void;
  onNewSession: () => void;
  currentMessages: DisplayMessage[];
  currentDutImage: string | null;
  savedSessions: SessionSummary[];
  onRestoreSession: (session: SessionSummary) => void;
  onDeleteSession: (e: React.MouseEvent, sessionId: string) => void;
  activeSessionId?: string | null;
  isLoadingSessions?: boolean;
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

export const ArcSessionRail: React.FC<ArcSessionRailProps> = ({
  isOpen,
  onToggle,
  onNewSession,
  currentMessages,
  currentDutImage,
  savedSessions,
  onRestoreSession,
  onDeleteSession,
  activeSessionId,
  isLoadingSessions,
}) => {
  return (
    <motion.aside
      initial={false}
      animate={{
        width: isOpen ? 240 : 0,
        opacity: isOpen ? 1 : 0,
      }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      className={`h-full border-r border-white/[0.08] bg-[#0B0D1D]/80 backdrop-blur-xl [-webkit-backdrop-filter:blur(20px)] [box-shadow:inset_-1px_0_0_0_rgba(255,255,255,0.05)] flex flex-col flex-shrink-0 z-40 md:z-10 fixed inset-y-0 left-0 md:relative overflow-hidden select-none text-[#F4F6FB] ${
        isOpen ? 'w-[240px]' : 'w-0 border-r-0 pointer-events-none md:pointer-events-auto'
      }`}
    >
      <div className="w-[240px] h-full flex flex-col">
        {/* Rail Header */}
        <div className="h-12 px-3.5 border-b border-white/[0.08] flex items-center justify-between flex-shrink-0 bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-[#2B3BFF]" aria-hidden="true" />
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#F4F6FB]">
              WORKBENCH
            </span>
          </div>
          <button
            type="button"
            onClick={onToggle}
            aria-label="Collapse session rail (Ctrl+B)"
            className="p-1.5 rounded-md text-[#94A3B8] hover:text-[#F4F6FB] bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.07] hover:border-white/[0.14] focus-visible:ring-2 focus-visible:ring-[#2B3BFF] focus-visible:outline-none transition-all duration-150 cursor-pointer"
            title="Collapse session rail (Ctrl+B)"
          >
            <PanelLeftClose className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Action: New Session Trigger */}
        <div className="p-3 border-b border-white/[0.08] bg-transparent">
          <button
            type="button"
            onClick={onNewSession}
            aria-label="Start fresh session"
            className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-[#4F5DFF]/25 via-[#7C88FF]/20 to-[#35FEE4]/25 hover:from-[#4F5DFF]/35 hover:to-[#35FEE4]/35 active:scale-[0.98] text-[#F4F6FB] text-xs font-mono font-medium flex items-center justify-center gap-2 transition-all duration-150 backdrop-blur-xl border border-white/[0.18] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15)] cursor-pointer focus-visible:ring-2 focus-visible:ring-[#2B3BFF] focus-visible:outline-none"
          >
            <Plus className="w-3.5 h-3.5 text-[#35FEE4]" aria-hidden="true" />
            <span>New Session</span>
          </button>
        </div>

        {/* Sessions Scroll List */}
        <div className="flex-1 min-h-0 overflow-y-auto diagnostic-feed-scrollbar p-2 space-y-1.5 overscroll-contain">
          {/* Active Run Card (if conversation has started) */}
          {currentMessages.length > 0 && (
            <div className="p-2.5 rounded-xl border border-white/[0.12] bg-white/[0.04] backdrop-blur-md text-xs font-mono flex flex-col gap-1.5 shadow-[0_4px_16px_rgba(0,0,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.06)]">
              <div className="flex items-center justify-between text-[10px] text-[#35FEE4]">
                <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#35FEE4] animate-pulse" />
                  <span>Active Workspace</span>
                </div>
                <span className="px-1.5 py-0.2 rounded bg-white/[0.05] border border-white/[0.10] text-[#818CF8] font-semibold tabular-nums">
                  {currentMessages.length}&nbsp;msgs
                </span>
              </div>
              <p className="text-[11px] text-[#F4F6FB] font-sans font-medium line-clamp-2 leading-snug">
                {currentMessages[0]?.content || 'Active Study Session'}
              </p>
              {currentDutImage && (
                <div className="flex items-center gap-1 text-[10px] text-[#35FEE4]">
                  <Camera className="w-3 h-3" aria-hidden="true" />
                  <span>Scope Mounted</span>
                </div>
              )}
            </div>
          )}

          {/* Section Divider */}
          <div className="px-1.5 pt-2 pb-1 text-[10px] font-mono uppercase tracking-wider text-[#64748B] flex items-center justify-between">
            <span>ARCHIVED</span>
            {savedSessions.length > 0 && (
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/[0.05] border border-white/[0.08] text-[#94A3B8] tabular-nums font-semibold">
                {savedSessions.length}
              </span>
            )}
          </div>

          {/* Saved Sessions Items */}
          {isLoadingSessions ? (
            <div className="p-4 text-center text-xs font-mono text-[#64748B]">
              Loading sessions…
            </div>
          ) : savedSessions.length === 0 ? (
            <div className="p-4 text-center text-[11px] font-mono text-[#64748B] bg-white/[0.02] backdrop-blur-sm rounded-xl border border-white/[0.08]">
              No saved sessions yet.
            </div>
          ) : (
            savedSessions.map((sess) => {
              const isActive = activeSessionId === sess.id;
              return (
                <div
                  key={sess.id}
                  onClick={() => onRestoreSession(sess)}
                  tabIndex={0}
                  role="button"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onRestoreSession(sess);
                    }
                  }}
                  aria-label={`Restore session: ${sess.title || 'Untitled Session'}`}
                  className={`group p-2.5 rounded-xl border transition-all duration-150 backdrop-blur-md cursor-pointer flex flex-col gap-1 focus-visible:ring-2 focus-visible:ring-[#2B3BFF] focus-visible:outline-none ${
                    isActive
                      ? 'bg-white/[0.09] border-white/[0.22] text-[#F4F6FB] shadow-[0_2px_12px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.08)]'
                      : 'bg-white/[0.03] hover:bg-white/[0.08] border-white/[0.08] hover:border-white/[0.16] text-[#94A3B8] hover:text-[#F4F6FB]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1.5 min-w-0">
                    <span className="text-xs font-medium font-mono truncate leading-snug text-[#F4F6FB] min-w-0 flex-1">
                      {sess.title || 'Untitled Session'}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSession(e, sess.id);
                      }}
                      aria-label={`Delete archived session: ${sess.title || 'Untitled'}`}
                      className="opacity-0 group-hover:opacity-100 p-1 text-[#64748B] hover:text-rose-400 hover:bg-rose-950/30 rounded transition-opacity cursor-pointer"
                      title="Delete session"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-[#64748B]">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatRelativeTime(sess.created_at)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {sess.has_dut && (
                        <span className="flex items-center gap-0.5 text-[#35FEE4]">
                          <Camera className="w-2.5 h-2.5" />
                        </span>
                      )}
                      <span className="flex items-center gap-0.5">
                        <MessageSquare className="w-2.5 h-2.5" />
                        <span className="tabular-nums">{sess.message_count}</span>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </motion.aside>
  );
};
