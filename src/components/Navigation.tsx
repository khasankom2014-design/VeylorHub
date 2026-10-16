import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { ProfileModal } from './ProfileModal.tsx';
import {
  LayoutDashboard,
  Kanban,
  FolderGit2,
  Newspaper,
  Users,
  LogOut,
  Shield,
  Settings,
  Edit3,
  Code2,
  MessageSquare,
  BookOpen,
  Activity,
} from 'lucide-react';

export type NavigationView =
  | 'dashboard'
  | 'flow'
  | 'projects'
  | 'updates'
  | 'code'
  | 'chat'
  | 'team'
  | 'docs'
  | 'diagnostics';

interface NavigationProps {
  currentView: NavigationView;
  onNavigate: (view: NavigationView) => void;
  children: React.ReactNode;
}

export const Navigation: React.FC<NavigationProps> = ({ currentView, onNavigate, children }) => {
  const { user, logout } = useAuth();
  const [showProfileModal, setShowProfileModal] = useState(false);

  const isOwner = user?.role === 'owner';

  const navItems = [
    { id: 'dashboard', label: 'Главная', icon: LayoutDashboard },
    { id: 'projects', label: 'Мои проекты', icon: FolderGit2 },
    { id: 'code', label: 'Редактор кода', icon: Code2, badge: 'AI' },
    { id: 'chat', label: 'Мессенджер', icon: MessageSquare },
    { id: 'flow', label: 'Задачи', icon: Kanban },
    { id: 'docs', label: 'Документация', icon: BookOpen },
    { id: 'updates', label: 'Новости & Релизы', icon: Newspaper },
    ...(isOwner
      ? [
          { id: 'team', label: 'Команда & Доступ', icon: Users, badge: 'Владелец' },
          { id: 'diagnostics', label: 'Диагностика', icon: Activity },
        ]
      : []),
  ] as const;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900/60 border-r border-slate-800 flex flex-col justify-between p-4 shrink-0">
        <div className="space-y-6">
          {/* Logo */}
          <div className="flex items-center gap-3 px-2 pt-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-cyan-500 flex items-center justify-center font-black text-lg text-white shadow-md shadow-indigo-600/20 border border-indigo-400/30">
              V
            </div>
            <div>
              <div className="font-bold text-base text-white tracking-tight flex items-center gap-1.5">
                Veylor Labs
              </div>
              <div className="text-[11px] text-cyan-400 font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Закрытый контур
              </div>
            </div>
          </div>

          {/* Navigation links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id as any)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {'badge' in item && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Profile & Logout */}
        <div className="pt-4 border-t border-slate-800 space-y-2">
          {/* Clickable Profile Card */}
          <div
            onClick={() => setShowProfileModal(true)}
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-800/60 transition cursor-pointer group border border-transparent hover:border-slate-800"
            title="Нажмите для редактирования профиля"
          >
            <div className="relative">
              <img
                src={
                  user?.avatar ||
                  `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.name || 'Veylor')}`
                }
                alt={user?.name}
                className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 object-cover group-hover:border-indigo-500 transition"
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow">
                <Edit3 className="w-2.5 h-2.5" />
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-white truncate flex items-center justify-between">
                <span>{user?.name}</span>
                <Settings className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 transition" />
              </div>
              <div className="text-xs text-slate-400 truncate font-mono">{user?.email}</div>
              <div className="mt-1 flex items-center gap-1.5">
                {user?.role === 'owner' ? (
                  <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/15 text-indigo-300 font-semibold border border-indigo-500/30">
                    <Shield className="w-2.5 h-2.5 text-indigo-400" />
                    Владелец
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    Участник
                  </span>
                )}
                {user?.title && (
                  <span className="text-[10px] text-slate-500 truncate max-w-[80px]">
                    · {user.title}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full py-2 px-3 rounded-lg text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition flex items-center justify-center gap-2 border border-rose-500/15"
          >
            <LogOut className="w-3.5 h-3.5" />
            Выйти из системы
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-y-auto">
        {children}
      </main>

      {/* Profile Editing Modal */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </div>
  );
};
