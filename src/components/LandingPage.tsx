import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import {
  Lock,
  ShieldCheck,
  Users,
  Layers,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  UserPlus,
  LogIn,
  X,
  Sparkles,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { login, register, inviteParam, clearInviteParam } = useAuth();

  const [authMode, setAuthMode] = useState<'login' | 'register' | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteToken, setInviteToken] = useState(inviteParam || '');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Invite token details if opened via direct link
  const [inviteDetails, setInviteDetails] = useState<{
    email: string;
    role: string;
    createdByName: string;
    status: string;
  } | null>(null);

  useEffect(() => {
    if (inviteParam) {
      setInviteToken(inviteParam);
      api.getInviteInfo(inviteParam)
        .then((info) => {
          setInviteDetails(info);
          if (info.email) {
            setEmail(info.email);
          }
          setAuthMode('register');
        })
        .catch(() => {
          // ignore invalid
        });
    }
  }, [inviteParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      if (authMode === 'login') {
        const res = await login(email.trim(), password);
        if (!res.success) {
          setErrorMessage(res.error || 'Ошибка входа');
        }
      } else if (authMode === 'register') {
        const res = await register({
          name: name.trim(),
          email: email.trim(),
          password,
          inviteToken: inviteToken.trim() || undefined,
        });
        if (!res.success) {
          setErrorMessage(res.error || 'Ошибка регистрации');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white relative">
      {/* Background patterns */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-indigo-600/15 blur-[120px] rounded-full pointer-events-none" />

      {/* Navigation Header */}
      <header className="relative z-20 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center font-black text-xl text-white shadow-lg shadow-indigo-500/25 border border-indigo-400/30">
              V
            </div>
            <div>
              <div className="font-bold text-lg text-white tracking-tight flex items-center gap-2">
                Veylor Hub
                <span className="px-2 py-0.5 rounded text-[10px] font-mono tracking-widest uppercase bg-slate-800 border border-slate-700 text-slate-300">
                  Closed Access
                </span>
              </div>
              <p className="text-xs text-slate-400">Платформа закрытого доступа</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setAuthMode('login');
                setErrorMessage(null);
                setPassword('veylor2026');
              }}
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent hover:border-slate-800 rounded-lg transition"
            >
              Войти
            </button>
            <button
              onClick={() => {
                setAuthMode('register');
                setErrorMessage(null);
                setPassword('');
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-lg shadow-indigo-600/20 border border-indigo-500/50 transition flex items-center gap-1.5"
            >
              Зарегистрироваться
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Hero */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 py-16 flex-1 flex flex-col justify-center">
        {/* Invite notification banner if link opened */}
        {inviteParam && (
          <div className="mb-8 p-4 rounded-xl bg-indigo-950/60 border border-indigo-500/40 text-indigo-200 flex items-center justify-between shadow-xl shadow-indigo-950/50">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 animate-pulse" />
              <div>
                <p className="text-sm font-semibold text-white">
                  Обнаружено персональное приглашение в Veylor Hub!
                </p>
                <p className="text-xs text-indigo-300">
                  {inviteDetails
                    ? `Вы приглашены администратором ${inviteDetails.createdByName} для ${inviteDetails.email}`
                    : `Код приглашения: ${inviteParam}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setAuthMode('register');
                  setInviteToken(inviteParam);
                }}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow transition"
              >
                Активировать
              </button>
              <button
                onClick={clearInviteParam}
                className="p-1.5 text-indigo-400 hover:text-indigo-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-indigo-300 mb-6 font-medium">
            <Lock className="w-3.5 h-3.5 text-indigo-400" />
            Закрытая экосистема • Доступ исключительно по приглашению
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
            Единое пространство управления проектами и командой
          </h1>

          <p className="text-lg text-slate-400 leading-relaxed mb-8">
            Veylor Hub — это защищенная среда для ключевых команд. Регистрация сама по себе не дает доступа к внутренней инфраструктуре: каждый участник подтверждается владельцем или персональным инвайтом.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => {
                setAuthMode('register');
                setPassword('');
              }}
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-xl shadow-indigo-600/25 border border-indigo-400/30 transition flex items-center gap-2 group"
            >
              Зарегистрироваться
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <button
              onClick={() => {
                setAuthMode('login');
                setPassword('veylor2026');
              }}
              className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800/80 text-slate-200 font-semibold border border-slate-800 transition"
            >
              Войти в систему
            </button>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Закрытый контур</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Неавторизованные пользователи и аккаунты без подтверждения остаются в безопасном экране ожидания без доступа к данным и API.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm">
            <div className="w-12 h-12 rounded-xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Управление командой</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Владелец платформы генерирует защищенные ссылки, распределяет роли, настраивает права и может мгновенно отозвать доступ.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm">
            <div className="w-12 h-12 rounded-xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Veylor Flow</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Интегрированный таск-менеджер и портфолио проектов. Доступен только верифицированным участникам команды.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500 font-mono">
        Veylor Hub & Veylor Flow • Платформа закрытого доступа и управления командой
      </footer>

      {/* Modal: Login or Register */}
      {authMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => {
                setAuthMode(null);
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                V
              </div>
              <h3 className="text-xl font-bold text-white">
                {authMode === 'login' ? 'Вход в Veylor Hub' : 'Регистрация аккаунта'}
              </h3>
            </div>

            <p className="text-xs text-slate-400 mb-6">
              {authMode === 'login'
                ? 'Введите ваши учетные данные для доступа к платформе'
                : 'Регистрация создает аккаунт. Доступ к данным открывается только после добавления в команду.'}
            </p>

            {errorMessage && (
              <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {authMode === 'register' && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Ваше имя
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Например: Роман Васильев"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Электронная почта
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Пароль
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {authMode === 'register' && (
                <div className="pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-slate-300 flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
                      Код приглашения (опционально)
                    </label>
                    <span className="text-[10px] text-slate-500">Есть инвайт?</span>
                  </div>
                  <input
                    type="text"
                    value={inviteToken}
                    onChange={(e) => setInviteToken(e.target.value)}
                    placeholder="veylor-invite-..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-indigo-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Если кода нет, аккаунт перейдет в статус «Ожидание приглашения».
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-6 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
              >
                {authMode === 'login' ? (
                  <>
                    <LogIn className="w-4 h-4" />
                    {isSubmitting ? 'Проверка данных...' : 'Войти в аккаунт'}
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    {isSubmitting ? 'Создание аккаунта...' : 'Создать аккаунт'}
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-800 text-center">
              {authMode === 'login' ? (
                <p className="text-xs text-slate-400">
                  Ещё нет аккаунта?{' '}
                  <button
                    onClick={() => {
                      setAuthMode('register');
                      setErrorMessage(null);
                    }}
                    className="text-indigo-400 hover:text-indigo-300 font-medium underline"
                  >
                    Зарегистрироваться
                  </button>
                </p>
              ) : (
                <p className="text-xs text-slate-400">
                  Уже зарегистрированы?{' '}
                  <button
                    onClick={() => {
                      setAuthMode('login');
                      setErrorMessage(null);
                    }}
                    className="text-indigo-400 hover:text-indigo-300 font-medium underline"
                  >
                    Войти
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
