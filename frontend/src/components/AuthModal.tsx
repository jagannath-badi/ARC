import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Lock, User, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
import { loginOperator, registerOperator, type OperatorUser } from '../api';

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: OperatorUser) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const handleClose = useCallback(() => {
    setUsername('');
    setPassword('');
    setError(null);
    setIsLoading(false);
    onClose();
  }, [onClose]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        handleClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = username.trim();
    if (!cleanUser) {
      setError('Please provide a valid operator username.');
      return;
    }
    if (password.length < 6) {
      setError('Password must contain at least 6 characters.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const result =
        mode === 'register'
          ? await registerOperator(cleanUser, password)
          : await loginOperator(cleanUser, password);

      onSuccess(result.user);
      handleClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in select-none">
      <div
        ref={modalRef}
        className="w-full max-w-sm bg-[#0B0D1D]/90 backdrop-blur-xl border border-white/[0.12] rounded-2xl shadow-[0_16px_50px_rgba(0,0,0,0.8),inset_0_1px_0_0_rgba(255,255,255,0.06)] p-5 sm:p-6 relative flex flex-col gap-4 text-[#F4F6FB]"
      >
        {/* Floating Close Button */}
        <button
          onClick={handleClose}
          type="button"
          className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 p-2 rounded-lg text-[#64748B] hover:text-[#F4F6FB] hover:bg-white/[0.06] transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.10] flex items-center justify-center text-[#818CF8] flex-shrink-0">
            <ShieldCheck className="w-5 h-5 text-[#35FEE4]" />
          </div>
          <div>
            <h3 className="text-xs font-mono font-bold tracking-wider uppercase text-[#F4F6FB]">
              Workspace Authentication
            </h3>
            <p className="text-[11px] text-[#94A3B8]">
              Sign in to sync your vault documents and sessions
            </p>
          </div>
        </div>

        {/* Mode Tabs */}
        <div className="grid grid-cols-2 p-1 bg-[#05060F]/80 border border-white/[0.08] rounded-xl text-xs font-mono">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`py-1.5 rounded-lg transition-all cursor-pointer ${
              mode === 'login'
                ? 'bg-white/[0.10] border border-white/[0.16] text-white font-bold shadow-xs'
                : 'text-[#64748B] hover:text-[#F4F6FB] border border-transparent'
            }`}
          >
            LOG IN
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`py-1.5 rounded-lg transition-all cursor-pointer ${
              mode === 'register'
                ? 'bg-white/[0.10] border border-white/[0.16] text-white font-bold shadow-xs'
                : 'text-[#64748B] hover:text-[#F4F6FB] border border-transparent'
            }`}
          >
            REGISTER
          </button>
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="auth-operator-username" className="text-[10px] font-mono uppercase tracking-wider text-[#94A3B8] flex items-center gap-1">
              <User className="w-3 h-3 text-[#818CF8]" />
              Username
            </label>
            <input
              id="auth-operator-username"
              name="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
              className="px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.10] focus:border-[#4F5DFF]/60 focus:ring-1 focus:ring-[#4F5DFF]/40 outline-none text-xs font-mono text-[#F4F6FB] placeholder:text-[#64748B] transition-all"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="auth-operator-password" className="text-[10px] font-mono uppercase tracking-wider text-[#94A3B8] flex items-center gap-1">
              <Lock className="w-3 h-3 text-[#818CF8]" />
              Password
            </label>
            <input
              id="auth-operator-password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.10] focus:border-[#4F5DFF]/60 focus:ring-1 focus:ring-[#4F5DFF]/40 outline-none text-xs font-mono text-[#F4F6FB] placeholder:text-[#64748B] transition-all"
              required
            />
          </div>

          {error && (
            <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[11px] font-mono flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 w-full py-2.5 rounded-xl bg-gradient-to-r from-[#4F5DFF]/25 via-[#7C88FF]/20 to-[#35FEE4]/25 hover:from-[#4F5DFF]/35 hover:to-[#35FEE4]/35 active:scale-[0.98] text-[#F4F6FB] font-mono text-xs uppercase tracking-wider font-semibold transition-all backdrop-blur-xl border border-white/[0.18] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15)] flex items-center justify-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#2B3BFF] focus-visible:outline-none"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#35FEE4]" />
            ) : mode === 'login' ? (
              'Authenticate'
            ) : (
              'Create Account'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
