import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { ShieldAlert, LogOut, RefreshCw, KeyRound, CheckCircle2, AlertCircle } from 'lucide-react';

export const WaitingScreen: React.FC = () => {
  const { user, logout, refreshUser, acceptInvite } = useAuth();
  const [inviteCode, setInviteCode] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [showCodeInput, setShowCodeInput] = useState(false);

  const handleRefresh = async () => {
    setIsChecking(true);
    setInviteError(null);
    try {
      await refreshUser();
    } finally {
      setTimeout(() => setIsChecking(false), 500);
    }
  };

  const handleApplyInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    setInviteError(null);
    setInviteSuccess(null);
    const res = await acceptInvite(inviteCode.trim());
    if (res.success) {
      setInviteSuccess(res.message || 'Приглашение принято! Доступ открыт.');
    } else {
      setInviteError(res.error || 'Не удалось применить код приглашения');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 relative overflow-hidden select-none">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.12)_0%,transparent_60%)] pointer-events-none" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-900/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-900/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-lg">
        {/* Logo and system status */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-xs font-mono text-indigo-400 mb-3 shadow-inner">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            СТАТУС: ЗАКРЫТЫЙ ПЕРИМЕТР
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-black text-lg text-white shadow-lg shadow-indigo-500/20">
              V
            </span>
            Veylor Hub
          </h1>
        </div>

        {/* Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-8 shadow-2xl backdrop-blur-xl">
          {/* Status Icon */}
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-6 text-amber-400 shadow-inner">
            <ShieldAlert className="w-8 h-8" />
          </div>

          {/* Canonical Headline as required */}
          <h2 className="text-xl font-semibold text-center text-white mb-3">
            Ожидание приглашения
          </h2>

          {/* Canonical message text as required */}
          <p className="text-slate-300 text-center text-sm leading-relaxed mb-6">
            Ваш аккаунт создан, но у вас пока нет доступа к Veylor Hub. Дождитесь, пока владелец платформы добавит вас в команду.
          </p>

          {/* Account info badge */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 mb-6">
            <div className="text-xs text-slate-500 uppercase tracking-wider font-mono mb-2">
              Информация о текущем аккаунте
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Пользователь:</span>
              <span className="text-slate-200 font-medium">{user?.name}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1.5">
              <span className="text-slate-400">Email:</span>
              <span className="text-slate-200 font-mono text-xs">{user?.email}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1.5">
              <span className="text-slate-400">Статус членства:</span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                Ожидает одобрения владельцем
              </span>
            </div>
          </div>

          {/* Notifications */}
          {inviteError && (
            <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{inviteError}</span>
            </div>
          )}

          {inviteSuccess && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{inviteSuccess}</span>
            </div>
          )}

          {/* Action: Check status / Refresh */}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isChecking}
            className="w-full mb-3 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-slate-200 text-sm font-medium transition flex items-center justify-center gap-2 border border-slate-700/60"
          >
            <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin text-indigo-400' : ''}`} />
            {isChecking ? 'Проверка обновлений доступа...' : 'Проверить статус доступа'}
          </button>

          {/* Code input toggle if user already has an invite token */}
          {!showCodeInput ? (
            <button
              type="button"
              onClick={() => setShowCodeInput(true)}
              className="w-full mb-6 text-xs text-indigo-400 hover:text-indigo-300 transition py-1 text-center"
            >
              Владелец отправил вам код приглашения? Активировать код
            </button>
          ) : (
            <form onSubmit={handleApplyInvite} className="mb-6 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Введите код приглашения:
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <KeyRound className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="veylor-invite-..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <button
                  type="submit"
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition shrink-0"
                >
                  Активировать
                </button>
              </div>
            </form>
          )}

          <div className="border-t border-slate-800/80 pt-4">
            {/* Primary Action strictly required: Logout button */}
            <button
              type="button"
              onClick={logout}
              className="w-full py-2.5 px-4 rounded-xl bg-rose-600/10 hover:bg-rose-600/20 text-rose-300 hover:text-rose-200 text-sm font-medium transition flex items-center justify-center gap-2 border border-rose-500/20"
            >
              <LogOut className="w-4 h-4" />
              Выйти из аккаунта
            </button>
          </div>
        </div>

        {/* Security disclaimer footer */}
        <p className="text-center text-xs text-slate-600 mt-6 font-mono">
          Veylor Hub Security Protocol • Доступ ограничен политикой платформы
        </p>
      </div>
    </div>
  );
};
