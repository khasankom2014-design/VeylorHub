import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api.ts';
import { Task, Project, User } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Kanban,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  Trash2,
  X,
  Filter,
  Search,
  ArrowRight,
  ArrowLeft,
  Calendar,
  User as UserIcon,
  Tag,
  Check,
} from 'lucide-react';

const COLUMNS: { id: Task['status']; title: string; color: string; indicator: string }[] = [
  { id: 'todo', title: 'К выполнению', color: 'border-slate-800', indicator: 'bg-slate-500' },
  { id: 'in_progress', title: 'В работе', color: 'border-indigo-500/30', indicator: 'bg-indigo-500' },
  { id: 'review', title: 'На проверке', color: 'border-amber-500/30', indicator: 'bg-amber-500' },
  { id: 'done', title: 'Выполнено', color: 'border-emerald-500/30', indicator: 'bg-emerald-500' },
];

const PRIORITIES: Record<Task['priority'], { label: string; text: string; dot: string }> = {
  urgent: { label: 'Срочный', text: 'text-rose-400', dot: 'bg-rose-500' },
  high: { label: 'Высокий', text: 'text-amber-400', dot: 'bg-amber-500' },
  medium: { label: 'Средний', text: 'text-indigo-400', dot: 'bg-indigo-500' },
  low: { label: 'Низкий', text: 'text-slate-400', dot: 'bg-slate-500' },
};

export const VeylorFlow: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Selected task for modal details
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // New task modal
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskProjectId, setTaskProjectId] = useState('');
  const [taskPriority, setTaskPriority] = useState<Task['priority']>('medium');
  const [taskAssigneeId, setTaskAssigneeId] = useState('');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [tasksRes, projectsRes, membersRes] = await Promise.all([
        api.getTasks(),
        api.getProjects(),
        api.getTeamMembers(),
      ]);
      setTasks(tasksRes.tasks);
      setProjects(projectsRes.projects);
      setMembers(membersRes.members);
      if (projectsRes.projects.length > 0 && !taskProjectId) {
        setTaskProjectId(projectsRes.projects[0].id);
      }
    } catch {
      // access checked on server
    } finally {
      setIsLoading(false);
    }
  }, [taskProjectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle || !taskProjectId) return;

    try {
      await api.createTask({
        title: taskTitle.trim(),
        description: taskDesc.trim(),
        projectId: taskProjectId,
        priority: taskPriority,
        assigneeId: taskAssigneeId || undefined,
      });
      setShowNewTaskModal(false);
      setTaskTitle('');
      setTaskDesc('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Ошибка создания задачи');
    }
  };

  const handleMoveStatus = async (taskId: string, newStatus: Task['status']) => {
    try {
      await api.updateTask(taskId, { status: newStatus });
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } catch (err: any) {
      alert(err.message || 'Ошибка обновления статуса');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Удалить эту задачу из Veylor Flow?')) return;
    try {
      await api.deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      if (selectedTask?.id === taskId) {
        setSelectedTask(null);
      }
    } catch (err: any) {
      alert(err.message || 'Ошибка удаления');
    }
  };

  // Filter pipeline
  const filteredTasks = tasks.filter((t) => {
    const matchesProject = selectedProject === 'all' || t.projectId === selectedProject;
    const matchesPriority = selectedPriority === 'all' || t.priority === selectedPriority;
    const matchesSearch =
      searchQuery.trim() === '' ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesProject && matchesPriority && matchesSearch;
  });

  const canManageTasks = user?.role === 'owner' || user?.permissions?.canManageTasks;

  const getNextStatus = (current: Task['status']): Task['status'] | null => {
    if (current === 'todo') return 'in_progress';
    if (current === 'in_progress') return 'review';
    if (current === 'review') return 'done';
    return null;
  };

  const getPrevStatus = (current: Task['status']): Task['status'] | null => {
    if (current === 'done') return 'review';
    if (current === 'review') return 'in_progress';
    if (current === 'in_progress') return 'todo';
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <Kanban className="w-6 h-6 text-indigo-400" />
              Veylor Flow
            </h1>
            <span className="text-xs font-mono text-slate-500">
              · {tasks.length} задач в контуре
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Командный трекер задач, этапов разработки и синхронизации рабочих процессов.
          </p>
        </div>

        {canManageTasks && (
          <button
            onClick={() => setShowNewTaskModal(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 shrink-0"
          >
            <Plus className="w-4 h-4" />
            Создать задачу
          </button>
        )}
      </div>

      {/* Control & Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-900/60 border border-slate-800/80 p-3 rounded-2xl">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по названию или описанию задачи..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-slate-500 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdowns */}
        <div className="flex items-center gap-2 overflow-x-auto">
          {/* Project selector */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 shrink-0">
            <span className="text-xs text-slate-500">Проект:</span>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="bg-transparent text-xs text-slate-200 outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900">Все проекты</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id} className="bg-slate-900">
                  {p.code} · {p.title}
                </option>
              ))}
            </select>
          </div>

          {/* Priority selector */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 shrink-0">
            <span className="text-xs text-slate-500">Приоритет:</span>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="bg-transparent text-xs text-slate-200 outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900">Любой</option>
              <option value="urgent" className="bg-slate-900">Срочный</option>
              <option value="high" className="bg-slate-900">Высокий</option>
              <option value="medium" className="bg-slate-900">Средний</option>
              <option value="low" className="bg-slate-900">Низкий</option>
            </select>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {COLUMNS.map((col) => {
          const colTasks = filteredTasks.filter((t) => t.status === col.id);
          return (
            <div
              key={col.id}
              className={`bg-slate-900/40 border ${col.color} rounded-2xl p-4 flex flex-col min-h-[520px] shadow-lg`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${col.indicator}`} />
                  <h3 className="font-semibold text-sm text-white">{col.title}</h3>
                </div>
                <span className="text-xs font-mono text-slate-500">
                  {colTasks.length}
                </span>
              </div>

              {/* Tasks List */}
              <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                {colTasks.map((task) => {
                  const proj = projects.find((p) => p.id === task.projectId);
                  const prio = PRIORITIES[task.priority];
                  const next = getNextStatus(task.status);
                  const prev = getPrevStatus(task.status);

                  return (
                    <div
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      className="bg-slate-950/80 border border-slate-800/80 hover:border-indigo-500/40 rounded-xl p-3.5 transition shadow-sm group cursor-pointer"
                    >
                      {/* Card Header: Project Code & Priority Indicator */}
                      <div className="flex items-center justify-between gap-2 mb-2 text-xs">
                        {proj ? (
                          <span className="font-mono text-[11px] font-semibold text-indigo-400">
                            {proj.code}
                          </span>
                        ) : (
                          <span className="text-slate-600 font-mono text-[11px]">—</span>
                        )}

                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${prio.dot}`} />
                          <span className={`text-[11px] font-medium ${prio.text}`}>
                            {prio.label}
                          </span>
                        </div>
                      </div>

                      <h4 className="text-sm font-semibold text-white mb-1.5 leading-snug group-hover:text-indigo-300 transition">
                        {task.title}
                      </h4>

                      {task.description && (
                        <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                          {task.description}
                        </p>
                      )}

                      {/* Card Footer */}
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="pt-2.5 border-t border-slate-900 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-1.5">
                          {task.assigneeName ? (
                            <div className="flex items-center gap-1 text-[11px] text-slate-300">
                              <img
                                src={
                                  task.assigneeAvatar ||
                                  `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(task.assigneeName)}`
                                }
                                alt={task.assigneeName}
                                className="w-5 h-5 rounded-full object-cover border border-slate-700"
                              />
                              <span className="truncate max-w-[85px]">{task.assigneeName}</span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-600 italic">Не назначен</span>
                          )}
                        </div>

                        {canManageTasks && (
                          <div className="flex items-center gap-1">
                            {prev && (
                              <button
                                onClick={() => handleMoveStatus(task.id, prev)}
                                className="p-1 rounded text-slate-500 hover:text-white hover:bg-slate-800 transition"
                                title="Переместить назад"
                              >
                                <ArrowLeft className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {next && (
                              <button
                                onClick={() => handleMoveStatus(task.id, next)}
                                className="p-1 rounded text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition"
                                title="Переместить вперед"
                              >
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {colTasks.length === 0 && (
                  <div className="h-28 border border-dashed border-slate-800/80 rounded-xl flex items-center justify-center text-xs text-slate-600">
                    Нет задач в этой колонке
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: TASK DETAILS */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedTask(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-3 text-xs text-slate-400 font-mono">
              <span className="text-indigo-400 font-bold">
                {projects.find((p) => p.id === selectedTask.projectId)?.code || 'VYL'}
              </span>
              <span>·</span>
              <span>ID: {selectedTask.id}</span>
              <span>·</span>
              <span>{new Date(selectedTask.createdAt).toLocaleDateString('ru-RU')}</span>
            </div>

            <h3 className="text-xl font-bold text-white mb-3">
              {selectedTask.title}
            </h3>

            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 mb-6 text-sm text-slate-300 whitespace-pre-line leading-relaxed">
              {selectedTask.description || <span className="italic text-slate-500">Нет описания</span>}
            </div>

            {/* Meta Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs mb-6">
              <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800">
                <span className="text-slate-500 block mb-1">Статус на доске:</span>
                <span className="font-semibold text-white">
                  {COLUMNS.find((c) => c.id === selectedTask.status)?.title}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800">
                <span className="text-slate-500 block mb-1">Приоритет:</span>
                <span className={`font-semibold ${PRIORITIES[selectedTask.priority].text}`}>
                  {PRIORITIES[selectedTask.priority].label}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800">
                <span className="text-slate-500 block mb-1">Ответственный:</span>
                <span className="font-semibold text-white">
                  {selectedTask.assigneeName || 'Не назначен'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800">
                <span className="text-slate-500 block mb-1">Создатель:</span>
                <span className="font-semibold text-white">
                  {selectedTask.createdByName}
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            {canManageTasks && (
              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <button
                  onClick={() => handleDeleteTask(selectedTask.id)}
                  className="px-3 py-1.5 rounded-lg text-xs text-rose-400 hover:text-rose-200 hover:bg-rose-500/10 transition flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Удалить задачу
                </button>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedTask.status}
                    onChange={(e) => handleMoveStatus(selectedTask.id, e.target.value as Task['status'])}
                    className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white outline-none cursor-pointer"
                  >
                    <option value="todo">К выполнению</option>
                    <option value="in_progress">В работе</option>
                    <option value="review">На проверке</option>
                    <option value="done">Выполнено</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: NEW TASK */}
      {showNewTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative">
            <button
              onClick={() => setShowNewTaskModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-1">Создать задачу в Flow</h3>
            <p className="text-xs text-slate-400 mb-6">
              Задача появится на командной доске и будет синхронизирована с проектом.
            </p>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Название задачи
                </label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Например: Аудит безопасности токенов сессий"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Описание / Контекст
                </label>
                <textarea
                  rows={3}
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  placeholder="Детали реализации, критерии готовности..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Проект
                  </label>
                  <select
                    value={taskProjectId}
                    onChange={(e) => setTaskProjectId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} — {p.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Приоритет
                  </label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as Task['priority'])}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="urgent">Срочный</option>
                    <option value="high">Высокий</option>
                    <option value="medium">Средний</option>
                    <option value="low">Низкий</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Исполнитель
                </label>
                <select
                  value={taskAssigneeId}
                  onChange={(e) => setTaskAssigneeId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="">Не назначен</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.role === 'owner' ? 'Владелец' : 'Участник'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewTaskModal(false)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white transition"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition shadow-md shadow-indigo-600/20"
                >
                  Добавить в Flow
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
