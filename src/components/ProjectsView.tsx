import React, { useState, useEffect, useCallback } from 'react';
import JSZip from 'jszip';
import { api } from '../services/api.ts';
import { Project, Task, User, CodeFile } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  FolderGit2,
  Plus,
  Calendar,
  CheckCircle2,
  X,
  Search,
  ArrowRight,
  ArrowLeft,
  Clock,
  Layers,
  Kanban,
  Check,
  Trash2,
  Filter,
  User as UserIcon,
  Code2,
  Download,
  AlertTriangle,
  FileCode,
  ExternalLink,
  Sparkles,
  FileCheck2,
} from 'lucide-react';

const PRIORITIES: Record<Task['priority'], { label: string; text: string; dot: string }> = {
  urgent: { label: 'Срочный', text: 'text-rose-400', dot: 'bg-rose-500' },
  high: { label: 'Высокий', text: 'text-amber-400', dot: 'bg-amber-500' },
  medium: { label: 'Средний', text: 'text-indigo-400', dot: 'bg-indigo-500' },
  low: { label: 'Низкий', text: 'text-slate-400', dot: 'bg-slate-500' },
};

const STATUS_LABELS: Record<Task['status'], { label: string; dot: string }> = {
  todo: { label: 'К выполнению', dot: 'bg-slate-500' },
  in_progress: { label: 'В работе', dot: 'bg-indigo-500' },
  review: { label: 'На проверке', dot: 'bg-amber-500' },
  done: { label: 'Выполнено', dot: 'bg-emerald-500' },
};

interface ProjectsViewProps {
  onNavigateToCode?: () => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({ onNavigateToCode }) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [codeFiles, setCodeFiles] = useState<CodeFile[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Active selected project for viewing tasks inside it
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [projectTaskFilterStatus, setProjectTaskFilterStatus] = useState<string>('all');

  // New Project modal
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [code, setCode] = useState('');
  const [color, setColor] = useState('#6366f1');

  // New Task modal (can be opened for a specific project)
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [targetProjectIdForTask, setTargetProjectIdForTask] = useState<string>('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<Task['priority']>('medium');
  const [newTaskAssigneeId, setNewTaskAssigneeId] = useState('');

  // Safe delete modals (no window.confirm!)
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [fileToDelete, setFileToDelete] = useState<CodeFile | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [projRes, tasksRes, membersRes, filesRes] = await Promise.all([
        api.getProjects(),
        api.getTasks(),
        api.getTeamMembers(),
        api.getCodeFiles(),
      ]);
      setProjects(projRes.projects);
      setTasks(tasksRes.tasks);
      setMembers(membersRes.members);
      setCodeFiles(filesRes.files);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const canCreateProject = user?.role === 'owner' || user?.permissions?.canCreateProjects;
  const canManageTasks = user?.role === 'owner' || user?.permissions?.canManageTasks;

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    try {
      await api.createProject({
        title: title.trim(),
        description: description.trim(),
        code: code.trim() || title.substring(0, 3).toUpperCase(),
        color,
      });
      setShowModal(false);
      setTitle('');
      setDescription('');
      setCode('');
      showToast('Новый проект успешно создан');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Ошибка создания проекта');
    }
  };

  const handleOpenCreateTaskForProject = (projId: string) => {
    setTargetProjectIdForTask(projId);
    setNewTaskTitle('');
    setNewTaskDesc('');
    setNewTaskPriority('medium');
    setNewTaskAssigneeId(user?.id || '');
    setShowNewTaskModal(true);
  };

  const handleCreateTaskInProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle || !targetProjectIdForTask) return;

    try {
      await api.createTask({
        title: newTaskTitle.trim(),
        description: newTaskDesc.trim(),
        projectId: targetProjectIdForTask,
        priority: newTaskPriority,
        assigneeId: newTaskAssigneeId || undefined,
      });
      setShowNewTaskModal(false);
      setNewTaskTitle('');
      setNewTaskDesc('');
      showToast('Задача добавлена в проект');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Ошибка создания задачи');
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: Task['status']) => {
    try {
      await api.updateTask(taskId, { status: newStatus });
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );
    } catch (err: any) {
      showToast(err.message || 'Ошибка изменения статуса');
    }
  };

  // Safe delete task execution
  const executeDeleteTask = async () => {
    if (!taskToDelete) return;
    try {
      setIsDeleting(true);
      await api.deleteTask(taskToDelete.id);
      setTasks((prev) => prev.filter((t) => t.id !== taskToDelete.id));
      showToast('Задача удалена');
      setTaskToDelete(null);
    } catch (err: any) {
      showToast(err.message || 'Ошибка удаления задачи');
    } finally {
      setIsDeleting(false);
    }
  };

  // Safe delete project execution
  const executeDeleteProject = async () => {
    if (!projectToDelete) return;
    try {
      setIsDeleting(true);
      await api.deleteProject(projectToDelete.id);
      setProjects((prev) => prev.filter((p) => p.id !== projectToDelete.id));
      setTasks((prev) => prev.filter((t) => t.projectId !== projectToDelete.id));
      if (activeProjectId === projectToDelete.id) {
        setActiveProjectId(null);
      }
      showToast(`Проект «${projectToDelete.title}» удален`);
      setProjectToDelete(null);
    } catch (err: any) {
      showToast(err.message || 'Ошибка удаления проекта');
    } finally {
      setIsDeleting(false);
    }
  };

  // Safe delete project code file execution
  const executeDeleteFile = async () => {
    if (!fileToDelete) return;
    try {
      setIsDeleting(true);
      await api.deleteCodeFile(fileToDelete.id);
      setCodeFiles((prev) => prev.filter((f) => f.id !== fileToDelete.id));
      showToast(`Файл «${fileToDelete.name}» удален`);
      setFileToDelete(null);
    } catch (err: any) {
      showToast(err.message || 'Ошибка удаления файла');
    } finally {
      setIsDeleting(false);
    }
  };

  // Download project files ZIP
  const handleDownloadProjectZip = async (project: Project, files: CodeFile[]) => {
    if (files.length === 0) {
      showToast('В проекте нет экспортированных файлов кода');
      return;
    }

    try {
      const zip = new JSZip();
      files.forEach((f) => {
        zip.file(f.name, f.content);
      });

      const readme = `# Проект: ${project.title} (${project.code})\n\n` +
        `Описание: ${project.description || 'Нет описания'}\n` +
        `Экспортировано из Veylor Hub: ${new Date().toLocaleString('ru-RU')}\n` +
        `Файлов в архиве: ${files.length}\n`;
      zip.file('README.md', readme);

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.code.toLowerCase()}-project-files.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast(`Архив проекта ${project.code} сформирован`);
    } catch (err: any) {
      showToast(err.message || 'Ошибка создания архива');
    }
  };

  const activeProject = projects.find((p) => p.id === activeProjectId);
  const activeProjectTasks = tasks.filter((t) => t.projectId === activeProjectId);
  const activeProjectFiles = codeFiles.filter((f) => f.projectId === activeProjectId);

  const filteredProjects = projects.filter((p) => {
    return (
      searchQuery.trim() === '' ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // ==========================================
  // VIEW: INSIDE A SPECIFIC PROJECT (PROJECT WORKSPACE)
  // ==========================================
  if (activeProject) {
    const completedTasks = activeProjectTasks.filter((t) => t.status === 'done');
    const inProgressTasks = activeProjectTasks.filter((t) => t.status === 'in_progress');
    const todoTasks = activeProjectTasks.filter((t) => t.status === 'todo');
    const reviewTasks = activeProjectTasks.filter((t) => t.status === 'review');
    const progress = activeProjectTasks.length > 0
      ? Math.round((completedTasks.length / activeProjectTasks.length) * 100)
      : 0;

    const visibleTasks = activeProjectTasks.filter((t) => {
      if (projectTaskFilterStatus === 'all') return true;
      return t.status === projectTaskFilterStatus;
    });

    const isProjectManager = user?.role === 'owner' || activeProject.createdBy === user?.id;

    return (
      <div className="space-y-6">
        {/* Toast */}
        {toastMessage && (
          <div className="fixed top-5 right-5 z-50 bg-slate-900 border border-indigo-500/50 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 font-mono text-xs animate-in slide-in-from-top-4 duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Breadcrumb Back Button */}
        <div>
          <button
            onClick={() => setActiveProjectId(null)}
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition py-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Вернуться ко всем проектам</span>
          </button>
        </div>

        {/* Project Header Banner */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div
            className="absolute top-0 right-0 w-72 h-72 rounded-full blur-3xl opacity-15 pointer-events-none"
            style={{ backgroundColor: activeProject.color }}
          />

          <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: activeProject.color }}
                />
                <span className="text-xs font-mono font-bold text-indigo-400">
                  {activeProject.code}
                </span>
                <span className="text-slate-600">·</span>
                <span className="text-xs text-slate-500 font-mono">
                  Создан {new Date(activeProject.createdAt).toLocaleDateString('ru-RU')}
                </span>
                <span className="text-slate-600">·</span>
                <span className="text-xs text-emerald-400 font-mono">Активен</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
                {activeProject.title}
              </h1>

              <p className="text-sm text-slate-300 leading-relaxed mb-6">
                {activeProject.description || 'Описание проекта не указано.'}
              </p>

              {/* Progress Bar */}
              <div className="max-w-md">
                <div className="flex justify-between text-xs mb-1.5 font-mono">
                  <span className="text-slate-400 text-xs">Готовность задач проекта</span>
                  <span className="text-indigo-400 font-semibold">{progress}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Quick Actions in Project Header */}
            <div className="shrink-0 flex flex-wrap md:flex-col gap-2">
              {canManageTasks && (
                <button
                  onClick={() => handleOpenCreateTaskForProject(activeProject.id)}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition flex items-center gap-2 shadow-lg shadow-indigo-600/20"
                >
                  <Plus className="w-4 h-4" />
                  Создать задачу в проекте
                </button>
              )}

              {activeProjectFiles.length > 0 && (
                <button
                  onClick={() => handleDownloadProjectZip(activeProject, activeProjectFiles)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-xl text-xs font-semibold transition flex items-center gap-2 border border-slate-700 shadow"
                >
                  <Download className="w-4 h-4" />
                  Скачать проект (.ZIP)
                </button>
              )}

              {onNavigateToCode && (
                <button
                  onClick={onNavigateToCode}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition flex items-center gap-2 border border-slate-700"
                >
                  <Code2 className="w-4 h-4 text-cyan-400" />
                  Code Studio
                </button>
              )}

              {isProjectManager && (
                <button
                  onClick={() => setProjectToDelete(activeProject)}
                  className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl text-xs font-semibold transition flex items-center gap-2 border border-rose-500/20"
                >
                  <Trash2 className="w-4 h-4" />
                  Удалить проект
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Project Code Files Section (NEW) */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-cyan-400" />
              <h3 className="font-bold text-white text-base">
                Модули и файлы кода проекта ({activeProjectFiles.length})
              </h3>
            </div>

            <div className="flex items-center gap-2">
              {activeProjectFiles.length > 0 && (
                <button
                  onClick={() => handleDownloadProjectZip(activeProject, activeProjectFiles)}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-mono font-medium flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Скачать все (.ZIP)</span>
                </button>
              )}
              {onNavigateToCode && (
                <button
                  onClick={onNavigateToCode}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-mono font-medium flex items-center gap-1.5 ml-3"
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>Открыть в Code Studio</span>
                </button>
              )}
            </div>
          </div>

          {activeProjectFiles.length === 0 ? (
            <div className="py-8 text-center text-slate-500">
              <Code2 className="w-8 h-8 mx-auto mb-2 text-slate-700" />
              <p className="text-xs text-slate-400">В этот проект пока не экспортированы файлы из редактора кода</p>
              <p className="text-[11px] text-slate-600 mt-1">
                Откройте Veylor Code Studio и нажмите «Экспорт в проект», чтобы привязать кодовую базу.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {activeProjectFiles.map((file) => (
                <div
                  key={file.id}
                  className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 hover:border-indigo-500/40 transition flex items-center justify-between gap-3 group"
                >
                  <div className="min-w-0 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600/15 border border-indigo-500/20 flex items-center justify-center text-cyan-400 font-mono text-xs shrink-0">
                      λ
                    </div>
                    <div className="min-w-0">
                      <span className="font-mono text-xs font-semibold text-white block truncate">
                        {file.name}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono block">
                        {file.language} · {new Date(file.updatedAt).toLocaleDateString('ru-RU')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {onNavigateToCode && (
                      <button
                        onClick={onNavigateToCode}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition"
                        title="Открыть в Code Studio"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => setFileToDelete(file)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition"
                      title="Удалить файл проекта"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Project Task Metrics Filter Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <button
            onClick={() => setProjectTaskFilterStatus('all')}
            className={`p-3 rounded-2xl border text-left transition ${
              projectTaskFilterStatus === 'all'
                ? 'bg-indigo-600/10 border-indigo-500 text-white shadow'
                : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <span className="text-[11px] text-slate-500 block">Всего задач</span>
            <span className="text-xl font-bold font-mono text-white">{activeProjectTasks.length}</span>
          </button>

          <button
            onClick={() => setProjectTaskFilterStatus('todo')}
            className={`p-3 rounded-2xl border text-left transition ${
              projectTaskFilterStatus === 'todo'
                ? 'bg-slate-800 border-slate-600 text-white shadow'
                : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <span className="text-[11px] text-slate-500 block">К выполнению</span>
            <span className="text-xl font-bold font-mono text-slate-300">{todoTasks.length}</span>
          </button>

          <button
            onClick={() => setProjectTaskFilterStatus('in_progress')}
            className={`p-3 rounded-2xl border text-left transition ${
              projectTaskFilterStatus === 'in_progress'
                ? 'bg-indigo-600/20 border-indigo-500 text-white shadow'
                : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <span className="text-[11px] text-slate-500 block">В работе</span>
            <span className="text-xl font-bold font-mono text-indigo-400">{inProgressTasks.length}</span>
          </button>

          <button
            onClick={() => setProjectTaskFilterStatus('review')}
            className={`p-3 rounded-2xl border text-left transition ${
              projectTaskFilterStatus === 'review'
                ? 'bg-amber-600/20 border-amber-500 text-white shadow'
                : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <span className="text-[11px] text-slate-500 block">На проверке</span>
            <span className="text-xl font-bold font-mono text-amber-400">{reviewTasks.length}</span>
          </button>

          <button
            onClick={() => setProjectTaskFilterStatus('done')}
            className={`p-3 rounded-2xl border text-left transition ${
              projectTaskFilterStatus === 'done'
                ? 'bg-emerald-600/20 border-emerald-500 text-white shadow'
                : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <span className="text-[11px] text-slate-500 block">Выполнено</span>
            <span className="text-xl font-bold font-mono text-emerald-400">{completedTasks.length}</span>
          </button>
        </div>

        {/* Task List Inside This Project */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Kanban className="w-4 h-4 text-indigo-400" />
              Задачи проекта «{activeProject.title}» ({visibleTasks.length})
            </h3>

            {canManageTasks && (
              <button
                onClick={() => handleOpenCreateTaskForProject(activeProject.id)}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Добавить задачу</span>
              </button>
            )}
          </div>

          {visibleTasks.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <Layers className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              <p className="text-sm font-medium text-slate-400">В этом разделе нет задач</p>
              {canManageTasks && (
                <button
                  onClick={() => handleOpenCreateTaskForProject(activeProject.id)}
                  className="mt-3 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition"
                >
                  Создать первую задачу для проекта
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {visibleTasks.map((task) => {
                const prio = PRIORITIES[task.priority];
                const statusMeta = STATUS_LABELS[task.status];

                return (
                  <div
                    key={task.id}
                    className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1.5 text-xs">
                        <span className="flex items-center gap-1.5 font-medium">
                          <span className={`w-2 h-2 rounded-full ${statusMeta.dot}`} />
                          <span className="text-slate-300">{statusMeta.label}</span>
                        </span>
                        <span className="text-slate-600">·</span>
                        <span className={`flex items-center gap-1 text-[11px] ${prio.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${prio.dot}`} />
                          {prio.label}
                        </span>
                        <span className="text-slate-600">·</span>
                        <span className="text-slate-500 font-mono text-[11px]">
                          {new Date(task.createdAt).toLocaleDateString('ru-RU')}
                        </span>
                      </div>

                      <h4 className="text-base font-semibold text-white mb-1">
                        {task.title}
                      </h4>

                      {task.description && (
                        <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                          {task.description}
                        </p>
                      )}
                    </div>

                    {/* Actions and Status Select */}
                    <div className="flex items-center gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-900">
                      {task.assigneeName && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-300 mr-2">
                          <img
                            src={
                              task.assigneeAvatar ||
                              `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(task.assigneeName)}`
                            }
                            alt={task.assigneeName}
                            className="w-6 h-6 rounded-full border border-slate-700 object-cover"
                          />
                          <span className="hidden sm:inline">{task.assigneeName}</span>
                        </div>
                      )}

                      {canManageTasks && (
                        <>
                          <select
                            value={task.status}
                            onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value as Task['status'])}
                            className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 outline-none cursor-pointer"
                          >
                            <option value="todo">К выполнению</option>
                            <option value="in_progress">В работе</option>
                            <option value="review">На проверке</option>
                            <option value="done">Выполнено</option>
                          </select>

                          <button
                            onClick={() => setTaskToDelete(task)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-900 transition"
                            title="Удалить задачу"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal: Create Task for this Project */}
        {showNewTaskModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative">
              <button
                onClick={() => setShowNewTaskModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-xl font-bold text-white mb-1">
                Создать задачу для проекта
              </h3>
              <p className="text-xs text-slate-400 mb-6 font-mono">
                Проект:{' '}
                <span className="text-indigo-400">
                  {projects.find((p) => p.id === targetProjectIdForTask)?.title || 'Veylor'}
                </span>
              </p>

              <form onSubmit={handleCreateTaskInProject} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Название задачи
                  </label>
                  <input
                    type="text"
                    required
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Например: Аудит безопасности и прав"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Описание задачи
                  </label>
                  <textarea
                    rows={3}
                    value={newTaskDesc}
                    onChange={(e) => setNewTaskDesc(e.target.value)}
                    placeholder="Детали реализации, критерии готовности..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Приоритет
                    </label>
                    <select
                      value={newTaskPriority}
                      onChange={(e) => setNewTaskPriority(e.target.value as Task['priority'])}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="urgent">Срочный</option>
                      <option value="high">Высокий</option>
                      <option value="medium">Средний</option>
                      <option value="low">Низкий</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Исполнитель
                    </label>
                    <select
                      value={newTaskAssigneeId}
                      onChange={(e) => setNewTaskAssigneeId(e.target.value)}
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
                    Добавить задачу
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // VIEW: ALL PROJECTS OVERVIEW
  // ==========================================
  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 border border-indigo-500/50 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 font-mono text-xs animate-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <FolderGit2 className="w-6 h-6 text-indigo-400" />
            Проекты Veylor Hub
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Кликните на любой проект для просмотра задач и привязанных модулей кода
          </p>
        </div>

        {canCreateProject && (
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" />
            Новый проект
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3 bg-slate-900/60 border border-slate-800/80 p-3 rounded-2xl">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по коду или названию проекта..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <span className="text-xs text-slate-500 font-mono">
          Проектов в контуре: {filteredProjects.length}
        </span>
      </div>

      {/* Projects Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => {
          const projectTasks = tasks.filter((t) => t.projectId === project.id);
          const projectFiles = codeFiles.filter((f) => f.projectId === project.id);
          const completedTasks = projectTasks.filter((t) => t.status === 'done');
          const inProgressTasks = projectTasks.filter((t) => t.status === 'in_progress');
          const progress = projectTasks.length > 0
            ? Math.round((completedTasks.length / projectTasks.length) * 100)
            : 0;

          const isManager = user?.role === 'owner' || project.createdBy === user?.id;

          return (
            <div
              key={project.id}
              className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-3xl p-6 transition flex flex-col justify-between group shadow-xl relative overflow-hidden"
            >
              {/* Subtle Project Color Ambient */}
              <div
                className="absolute top-0 right-0 w-36 h-36 rounded-full blur-2xl opacity-10 pointer-events-none group-hover:opacity-20 transition"
                style={{ backgroundColor: project.color }}
              />

              <div>
                {/* Project Badge Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: project.color }}
                    />
                    <span className="text-xs font-mono font-bold text-indigo-400">
                      {project.code}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {projectFiles.length > 0 && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center gap-1">
                        <Code2 className="w-3 h-3" />
                        {projectFiles.length} мод.
                      </span>
                    )}

                    {isManager && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setProjectToDelete(project);
                        }}
                        className="p-1 rounded text-slate-600 hover:text-rose-400 transition"
                        title="Удалить проект"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Title */}
                <h3
                  onClick={() => setActiveProjectId(project.id)}
                  className="text-lg font-bold text-white mb-2 group-hover:text-indigo-400 transition cursor-pointer"
                >
                  {project.title}
                </h3>

                {/* Description */}
                <p className="text-xs text-slate-400 line-clamp-3 mb-6 leading-relaxed">
                  {project.description || 'Описание проекта не заполнено.'}
                </p>
              </div>

              {/* Footer Stats & Actions */}
              <div className="space-y-4 pt-4 border-t border-slate-800/80">
                {/* Progress bar */}
                <div>
                  <div className="flex justify-between text-xs mb-1.5 font-mono">
                    <span className="text-slate-500 text-[11px]">Готовность</span>
                    <span className="text-slate-300 font-semibold">{progress}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    onClick={() => setActiveProjectId(project.id)}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 text-xs font-semibold transition flex items-center justify-center gap-1.5 border border-slate-700/80"
                  >
                    <span>Задачи ({projectTasks.length})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  {canManageTasks && (
                    <button
                      onClick={() => handleOpenCreateTaskForProject(project.id)}
                      className="p-2 rounded-xl bg-indigo-600/15 hover:bg-indigo-600 text-indigo-300 hover:text-white transition border border-indigo-500/25"
                      title="Быстро создать задачу"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredProjects.length === 0 && (
          <div className="col-span-full py-16 text-center text-slate-500 bg-slate-900/30 border border-slate-800 rounded-3xl">
            <FolderGit2 className="w-10 h-10 mx-auto mb-3 text-slate-600" />
            <h3 className="text-base font-semibold text-slate-300">Проекты не найдены</h3>
            <p className="text-xs text-slate-500 mt-1">Попробуйте изменить поисковый запрос или создайте новый проект.</p>
          </div>
        )}
      </div>

      {/* MODAL: CREATE NEW PROJECT */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-1">
              Создать проект в закрытом контуре
            </h3>
            <p className="text-xs text-slate-400 mb-6 font-mono">
              Проект будет доступен верифицированным участникам
            </p>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Название проекта
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Например: Veylor Gateway Infrastructure"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Код (тикер)
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="INF"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white placeholder-slate-500 uppercase focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Цветовой акцент
                  </label>
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full h-9 bg-slate-950 border border-slate-700 rounded-xl cursor-pointer p-1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Описание инициативы
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Цели, границы и стек проекта..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white transition"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition shadow-md shadow-indigo-600/20"
                >
                  Создать проект
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NEW TASK FROM PROJECT CARD */}
      {showNewTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative">
            <button
              onClick={() => setShowNewTaskModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-1">
              Создать задачу для проекта
            </h3>
            <p className="text-xs text-slate-400 mb-6 font-mono">
              Проект:{' '}
              <span className="text-indigo-400">
                {projects.find((p) => p.id === targetProjectIdForTask)?.title || 'Veylor'}
              </span>
            </p>

            <form onSubmit={handleCreateTaskInProject} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Название задачи
                </label>
                <input
                  type="text"
                  required
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Например: Аудит безопасности и прав"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Описание задачи
                </label>
                <textarea
                  rows={3}
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  placeholder="Детали реализации, критерии готовности..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Приоритет
                  </label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as Task['priority'])}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="urgent">Срочный</option>
                    <option value="high">Высокий</option>
                    <option value="medium">Средний</option>
                    <option value="low">Низкий</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Исполнитель
                  </label>
                  <select
                    value={newTaskAssigneeId}
                    onChange={(e) => setNewTaskAssigneeId(e.target.value)}
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
                  Добавить задачу
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DELETE PROJECT CONFIRMATION */}
      {projectToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Удаление проекта</h3>
                <p className="text-xs text-slate-400">Действие необратимо</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Вы уверены, что хотите удалить проект <span className="font-bold text-white">«{projectToDelete.title}»</span> ({projectToDelete.code})? Все задачи проекта будут удалены, а привязанные модули кода отвязаны.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setProjectToDelete(null)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
              >
                Отмена
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={executeDeleteProject}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold transition shadow-md shadow-rose-600/20"
              >
                Удалить проект
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DELETE TASK CONFIRMATION */}
      {taskToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Удаление задачи</h3>
                <p className="text-xs text-slate-400">Действие необратимо</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Удалить задачу <span className="font-bold text-white">«{taskToDelete.title}»</span> из этого проекта?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTaskToDelete(null)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
              >
                Отмена
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={executeDeleteTask}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold transition shadow-md shadow-rose-600/20"
              >
                Удалить задачу
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DELETE PROJECT CODE FILE CONFIRMATION */}
      {fileToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Удаление файла проекта</h3>
                <p className="text-xs text-slate-400">Действие необратимо</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Вы уверены, что хотите удалить файл <span className="font-mono font-bold text-white">«{fileToDelete.name}»</span>?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setFileToDelete(null)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
              >
                Отмена
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={executeDeleteFile}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold transition shadow-md shadow-rose-600/20"
              >
                Удалить файл
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
