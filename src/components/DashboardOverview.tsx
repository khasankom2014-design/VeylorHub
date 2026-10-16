import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import { User, Project, Task, TeamUpdate } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  ShieldCheck,
  Users,
  FolderGit2,
  Kanban,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  Lock,
  UserCheck,
  Flame,
  Settings,
  Code2,
  MessageSquare,
} from 'lucide-react';
import { ProfileModal } from './ProfileModal.tsx';
import { NavigationView } from './Navigation.tsx';

interface DashboardOverviewProps {
  onNavigate: (view: NavigationView) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [members, setMembers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [updates, setUpdates] = useState<TeamUpdate[]>([]);
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    Promise.all([
      api.getTeamMembers(),
      api.getProjects(),
      api.getTasks(),
      api.getUpdates(),
    ]).then(([mRes, pRes, tRes, uRes]) => {
      setMembers(mRes.members);
      setProjects(pRes.projects);
      setTasks(tRes.tasks);
      setUpdates(uRes.updates);
    }).catch(() => {
      // access checked
    });
  }, []);

  const myTasks = tasks.filter((t) => t.assigneeId === user?.id);
  const doneTasks = tasks.filter((t) => t.status === 'done');
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress');
  const urgentTasks = tasks.filter((t) => t.priority === 'urgent' && t.status !== 'done');

  return (
    <div className="space-y-6">
      {/* Welcome Hero Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2 text-xs font-mono text-indigo-400 mb-3">
            <Lock className="w-3.5 h-3.5" />
            <span>ЗАКРЫТЫЙ КОНТУР VEYLOR</span>
            <span>·</span>
            <span className="text-emerald-400 font-semibold">ДОСТУП АКТИВЕН</span>
          </div>

          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
                С возвращением, {user?.name}!
              </h1>
              <p className="text-sm text-slate-300 leading-relaxed mb-6">
                Вы вошли как{' '}
                <span className="font-semibold text-indigo-300">
                  {user?.role === 'owner' ? 'Владелец платформы (Owner)' : 'Участник команды (Member)'}
                </span>
                {user?.title ? ` · ${user.title}` : ''}. Все внутренние разделы Veylor Flow, проекты и данные команды синхронизированы в режиме реального времени.
              </p>
            </div>

            <button
              onClick={() => setShowProfileModal(true)}
              className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white transition shrink-0 hidden sm:flex items-center gap-2 text-xs font-medium"
              title="Редактировать профиль"
            >
              <Settings className="w-4 h-4 text-indigo-400" />
              <span>Редактировать профиль</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate('flow')}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/20"
            >
              <Kanban className="w-4 h-4" />
              Доска Veylor Flow
            </button>

            <button
              onClick={() => onNavigate('code')}
              className="px-4 py-2.5 bg-indigo-950/70 hover:bg-indigo-900/80 text-cyan-300 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 border border-indigo-700/50 shadow-md shadow-indigo-900/30"
            >
              <Code2 className="w-4 h-4 text-cyan-400" />
              Veylor Code Studio
              <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-mono">AI</span>
            </button>

            <button
              onClick={() => onNavigate('chat')}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 border border-slate-700"
            >
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              Мессенджер
            </button>

            {user?.role === 'owner' && (
              <button
                onClick={() => onNavigate('team')}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 border border-slate-700"
              >
                <Users className="w-4 h-4" />
                Управление командой
              </button>
            )}

            <button
              onClick={() => onNavigate('projects')}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 border border-slate-700"
            >
              <FolderGit2 className="w-4 h-4" />
              Проекты ({projects.length})
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => onNavigate('projects')}
          className="bg-slate-900/50 border border-slate-800/80 hover:border-indigo-500/30 rounded-2xl p-5 transition cursor-pointer group shadow-lg"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
            <span>Проекты</span>
            <FolderGit2 className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-extrabold text-white group-hover:text-indigo-400 transition font-mono">
            {projects.length}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <span>Инициативы в контуре</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        <div
          onClick={() => onNavigate('flow')}
          className="bg-slate-900/50 border border-slate-800/80 hover:border-indigo-500/30 rounded-2xl p-5 transition cursor-pointer group shadow-lg"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
            <span>Задачи в Flow</span>
            <Kanban className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-extrabold text-white group-hover:text-purple-400 transition font-mono">
            {tasks.length}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <span>{inProgressTasks.length} в работе · {doneTasks.length} выполнено</span>
          </div>
        </div>

        <div
          onClick={() => onNavigate('team')}
          className="bg-slate-900/50 border border-slate-800/80 hover:border-indigo-500/30 rounded-2xl p-5 transition cursor-pointer group shadow-lg"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
            <span>Состав команды</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-white group-hover:text-emerald-400 transition font-mono">
            {members.length}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <span>Активные участники</span>
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
            <span>Срочные задачи</span>
            <Flame className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-3xl font-extrabold text-rose-400 font-mono">
            {urgentTasks.length}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Требуют приоритетного внимания
          </div>
        </div>
      </div>

      {/* Code Studio & Messenger Spotlight Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Code Studio Card */}
        <div
          onClick={() => onNavigate('code')}
          className="bg-gradient-to-br from-slate-900 via-indigo-950/30 to-slate-900 border border-indigo-900/40 hover:border-cyan-500/50 rounded-2xl p-5 transition cursor-pointer group shadow-xl relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition">
              <Code2 className="w-5 h-5" />
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              Gemini AI
            </span>
          </div>
          <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition">
            Veylor Code Studio
          </h3>
          <p className="text-xs text-slate-400 mt-1 line-clamp-2">
            Редактор кода с неавтономным ИИ-ассистентом: аудит безопасности, оптимизация, проверка различий (Diff) и экспорт в ZIP.
          </p>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-cyan-400 font-semibold">
            <span>Открыть редактор кода</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1.5 transition-transform" />
          </div>
        </div>

        {/* Messenger Card */}
        <div
          onClick={() => onNavigate('chat')}
          className="bg-gradient-to-br from-slate-900 via-purple-950/20 to-slate-900 border border-slate-800 hover:border-purple-500/40 rounded-2xl p-5 transition cursor-pointer group shadow-xl relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-105 transition">
              <MessageSquare className="w-5 h-5" />
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Онлайн-контур
            </span>
          </div>
          <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition">
            Командный мессенджер
          </h3>
          <p className="text-xs text-slate-400 mt-1 line-clamp-2">
            Защищенные каналы (#general, #dev, #announcements), личные диалоги, обмен сниппетами кода и реакции.
          </p>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-purple-400 font-semibold">
            <span>Перейти в мессенджер</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1.5 transition-transform" />
          </div>
        </div>
      </div>

      {/* Two columns: Assigned tasks & Recent updates */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Assigned tasks */}
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Kanban className="w-4 h-4 text-indigo-400" />
              <h3 className="font-semibold text-white text-base">Мои задачи в Veylor Flow</h3>
            </div>
            <button
              onClick={() => onNavigate('flow')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
            >
              Все задачи ({tasks.length})
            </button>
          </div>

          <div className="space-y-3">
            {myTasks.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center italic">
                У вас нет назначенных задач. Перейдите в Flow, чтобы назначить задачу.
              </p>
            ) : (
              myTasks.slice(0, 4).map((task) => (
                <div
                  key={task.id}
                  onClick={() => onNavigate('flow')}
                  className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-indigo-500/30 transition cursor-pointer flex items-center justify-between gap-3 group"
                >
                  <div className="min-w-0">
                    <h4 className="text-sm font-medium text-white truncate group-hover:text-indigo-300 transition">
                      {task.title}
                    </h4>
                    <div className="text-xs text-slate-500 font-mono mt-0.5">
                      Статус:{' '}
                      <span className="text-slate-400">
                        {task.status === 'done' ? 'Выполнено' : task.status === 'in_progress' ? 'В работе' : 'К выполнению'}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-indigo-400 shrink-0">
                    {task.priority}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent updates */}
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <h3 className="font-semibold text-white text-base">Объявления команды</h3>
            </div>
            <button
              onClick={() => onNavigate('updates')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
            >
              Вся лента ({updates.length})
            </button>
          </div>

          <div className="space-y-3">
            {updates.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center italic">
                Объявлений пока нет.
              </p>
            ) : (
              updates.slice(0, 3).map((upd) => (
                <div
                  key={upd.id}
                  className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80"
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium text-indigo-300">{upd.authorName}</span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {new Date(upd.createdAt).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1">{upd.title}</h4>
                  <p className="text-xs text-slate-400 line-clamp-2">{upd.content}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Profile Modal */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </div>
  );
};
