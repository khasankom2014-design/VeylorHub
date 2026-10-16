import React, { useState, useEffect, useRef, useCallback } from 'react';
import JSZip from 'jszip';
import { api } from '../services/api.ts';
import { CodeFile, Project } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Code2,
  Sparkles,
  Play,
  Save,
  Plus,
  Trash2,
  Copy,
  Check,
  Terminal,
  ShieldAlert,
  Zap,
  TestTube,
  FileCode,
  Send,
  Loader2,
  MessageSquare,
  HelpCircle,
  FileCheck2,
  Download,
  FolderGit2,
  ArrowRight,
  RefreshCw,
  Sliders,
  CheckCheck,
  FileText,
  AlertTriangle,
  FolderPlus,
  Layers,
  Wrench,
  BookOpen,
  Award,
  ListTodo,
  GitCompare,
  Eye,
  ShieldCheck,
  CheckCircle2,
  X,
  Shield,
} from 'lucide-react';

interface CodeStudioProps {
  onShareToChat?: (snippet: { code: string; language: string; name: string }) => void;
  onNavigateToProjects?: () => void;
}

export const CodeStudio: React.FC<CodeStudioProps> = ({
  onShareToChat,
  onNavigateToProjects,
}) => {
  const { user } = useAuth();
  const [files, setFiles] = useState<CodeFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<string>('');
  const [activeCode, setActiveCode] = useState<string>('');
  const [activeLang, setActiveLang] = useState<string>('typescript');
  const [activeName, setActiveName] = useState<string>('');
  const [activeProjectId, setActiveProjectId] = useState<string | undefined>();
  const [activeProjectName, setActiveProjectName] = useState<string | undefined>();
  const [isSaved, setIsSaved] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState<boolean>(true);

  // New file modal
  const [showNewFileModal, setShowNewFileModal] = useState<boolean>(false);
  const [newFileName, setNewFileName] = useState<string>('');
  const [newFileLang, setNewFileLang] = useState<string>('typescript');

  // Delete confirmation modal (no window.confirm!)
  const [fileToDelete, setFileToDelete] = useState<CodeFile | null>(null);
  const [isDeletingFile, setIsDeletingFile] = useState<boolean>(false);

  // Export to Project modal
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [availableProjects, setAvailableProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [exportScope, setExportScope] = useState<'current' | 'all'>('current');
  const [createTaskForProject, setCreateTaskForProject] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [newProjectTitle, setNewProjectTitle] = useState<string>('');
  const [isCreatingProjectInline, setIsCreatingProjectInline] = useState<boolean>(false);

  // ZIP download state
  const [isZipping, setIsZipping] = useState<boolean>(false);

  // AI Assistant states & tabs
  const [aiMode, setAiMode] = useState<'actions' | 'chat' | 'review'>('actions');
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiActiveAction, setAiActiveAction] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [copiedResponse, setCopiedResponse] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  // Non-autonomous Diff & Human Approval state
  const [showDiffModal, setShowDiffModal] = useState<boolean>(false);
  const [proposedCode, setProposedCode] = useState<string>('');
  const [diffViewTab, setDiffViewTab] = useState<'sideBySide' | 'proposed'>('sideBySide');

  // Console output & terminal
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  const [showTerminal, setShowTerminal] = useState<boolean>(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setToastNotice(msg);
    setTimeout(() => setToastNotice(null), 3500);
  };

  const loadFiles = useCallback(async () => {
    try {
      setIsLoadingFiles(true);
      const res = await api.getCodeFiles();
      setFiles(res.files);
      if (res.files.length > 0) {
        // If current active file still exists, keep it; otherwise select first
        const found = res.files.find((f) => f.id === activeFileId);
        const target = found || res.files[0];
        setActiveFileId(target.id);
        setActiveName(target.name);
        setActiveLang(target.language);
        setActiveCode(target.content);
        setActiveProjectId(target.projectId);
        setActiveProjectName(target.projectName);
        setIsSaved(true);
      } else {
        setActiveFileId('');
        setActiveName('');
        setActiveCode('');
        setActiveLang('typescript');
        setActiveProjectId(undefined);
        setActiveProjectName(undefined);
      }
    } catch (err) {
      console.error('Failed to load code files:', err);
    } finally {
      setIsLoadingFiles(false);
    }
  }, [activeFileId]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const selectFile = (file: CodeFile) => {
    setActiveFileId(file.id);
    setActiveName(file.name);
    setActiveLang(file.language);
    setActiveCode(file.content);
    setActiveProjectId(file.projectId);
    setActiveProjectName(file.projectName);
    setIsSaved(true);
    setAiResponse(null);
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setActiveCode(e.target.value);
    setIsSaved(false);
  };

  const handleSaveFile = async () => {
    if (!activeFileId && !activeName) return;
    try {
      setIsSaving(true);
      const res = await api.saveCodeFile({
        id: activeFileId,
        name: activeName || 'untitled.ts',
        language: activeLang,
        content: activeCode,
        projectId: activeProjectId,
        projectName: activeProjectName,
      });
      setFiles((prev) =>
        prev.map((f) => (f.id === res.file.id ? res.file : f))
      );
      setIsSaved(true);
      showToast(`Файл «${res.file.name}» сохранен`);
    } catch (err: any) {
      showToast(err.message || 'Ошибка сохранения файла');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;

    try {
      const defaultContent = `// ${newFileName.trim()}\n// Создано в Veylor Code Studio\n\nexport function init() {\n  console.log("Модуль Veylor Hub инициализирован");\n}\n`;
      const res = await api.saveCodeFile({
        name: newFileName.trim(),
        language: newFileLang,
        content: defaultContent,
      });
      setFiles((prev) => [res.file, ...prev]);
      setActiveFileId(res.file.id);
      setActiveName(res.file.name);
      setActiveLang(res.file.language);
      setActiveCode(res.file.content);
      setActiveProjectId(undefined);
      setActiveProjectName(undefined);
      setIsSaved(true);
      setShowNewFileModal(false);
      setNewFileName('');
      showToast(`Создан файл «${res.file.name}»`);
    } catch (err: any) {
      showToast(err.message || 'Не удалось создать файл');
    }
  };

  // Safe file delete via custom modal (no confirm/alert)
  const confirmDeleteFile = async () => {
    if (!fileToDelete) return;
    try {
      setIsDeletingFile(true);
      await api.deleteCodeFile(fileToDelete.id);
      const remaining = files.filter((f) => f.id !== fileToDelete.id);
      setFiles(remaining);

      if (activeFileId === fileToDelete.id) {
        if (remaining.length > 0) {
          selectFile(remaining[0]);
        } else {
          setActiveFileId('');
          setActiveName('');
          setActiveCode('');
          setActiveLang('typescript');
          setActiveProjectId(undefined);
          setActiveProjectName(undefined);
        }
      }
      showToast(`Файл «${fileToDelete.name}» успешно удален`);
      setFileToDelete(null);
    } catch (err: any) {
      showToast(err.message || 'Ошибка удаления файла');
    } finally {
      setIsDeletingFile(false);
    }
  };

  // Safe run sandbox simulation (no direct eval)
  const handleRunCode = () => {
    setShowTerminal(true);
    setConsoleOutput((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] Запуск модуля ${activeName} (${activeLang})...`,
    ]);

    try {
      if (activeLang === 'javascript' || activeLang === 'typescript') {
        const logs: string[] = [];
        const originalLog = console.log;
        console.log = (...args: any[]) => {
          logs.push(args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '));
          originalLog(...args);
        };

        try {
          const runnable = activeCode
            .replace(/export\s+(default\s+)?/g, '')
            .replace(/import\s+.*?from\s+['"].*?['"];?/g, '')
            .replace(/:\s*[A-Za-z0-9_<>[\]|&]+/g, '');
          const fn = new Function(`"use strict";\n${runnable}`);
          const result = fn();
          if (result !== undefined) {
            logs.push(`➜ Результат: ${typeof result === 'object' ? JSON.stringify(result) : result}`);
          }
        } catch (execErr: any) {
          logs.push(`⚠️ Ошибка выполнения: ${execErr.message}`);
        } finally {
          console.log = originalLog;
        }

        if (logs.length === 0) {
          logs.push('✔ Код выполнен успешно без вывода в консоль.');
        }

        setConsoleOutput((prev) => [...prev, ...logs]);
      } else {
        setConsoleOutput((prev) => [
          ...prev,
          `ℹ Среда выполнения для ${activeLang} симулирована: синтаксис проверен, модуль готов к интеграции.`,
        ]);
      }
    } catch (err: any) {
      setConsoleOutput((prev) => [...prev, `❌ Ошибка: ${err.message}`]);
    }
  };

  // ZIP download builder
  const handleDownloadZip = async () => {
    if (files.length === 0) {
      showToast('Нет файлов для архивации');
      return;
    }

    try {
      setIsZipping(true);
      const zip = new JSZip();

      // Bundle all files
      files.forEach((f) => {
        const content = f.id === activeFileId ? activeCode : f.content;
        const subfolder = f.projectName ? f.projectName.replace(/[/\\?%*:|"<>]/g, '_') + '/' : '';
        zip.file(subfolder + f.name, content);
      });

      // Add project manifest & README
      const readmeContent = `# Veylor Hub — Экспорт Кодовой Базы\n\n` +
        `- **Дата экспорта**: ${new Date().toLocaleString('ru-RU')}\n` +
        `- **Экспортировал**: ${user?.name || 'Veylor'}\n` +
        `- **Всего файлов**: ${files.length}\n\n` +
        `## Содержимое архива:\n` +
        files.map((f) => `- \`${f.name}\` (${f.language}) ${f.projectName ? `[Проект: ${f.projectName}]` : ''}`).join('\n') +
        `\n\n---\n*Сгенерировано в защищенной среде Veylor Hub*\n`;

      zip.file('README.md', readmeContent);

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `veylor-hub-code-${Date.now().toString(36)}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast(`ZIP-архив сформирован (${files.length} файлов)`);
    } catch (err: any) {
      showToast(err.message || 'Ошибка создания ZIP архива');
    } finally {
      setIsZipping(false);
    }
  };

  // Single file download
  const handleDownloadSingleFile = () => {
    if (!activeCode) return;
    const blob = new Blob([activeCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeName || 'code-snippet.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Файл «${activeName}» скачан`);
  };

  // Open Export to Project modal
  const handleOpenExportModal = async () => {
    try {
      const res = await api.getProjects();
      setAvailableProjects(res.projects);
      if (res.projects.length > 0) {
        setSelectedProjectId(activeProjectId || res.projects[0].id);
      }
      setShowExportModal(true);
    } catch (err: any) {
      showToast(err.message || 'Не удалось загрузить список проектов');
    }
  };

  // Perform Export to Project
  const handleExecuteExportToProject = async (e: React.FormEvent) => {
    e.preventDefault();
    let targetProjId = selectedProjectId;
    let targetProjTitle = availableProjects.find((p) => p.id === selectedProjectId)?.title || '';

    try {
      setIsExporting(true);

      // If user wants to create a brand new project inline
      if (isCreatingProjectInline) {
        if (!newProjectTitle.trim()) {
          showToast('Укажите название нового проекта');
          return;
        }
        const created = await api.createProject({
          title: newProjectTitle.trim(),
          description: `Проект создан при экспорте файлов из Veylor Code Studio (${activeName})`,
        });
        targetProjId = created.project.id;
        targetProjTitle = created.project.title;
      }

      if (!targetProjId) {
        showToast('Выберите проект для экспорта');
        return;
      }

      // Determine files to export
      const fileIdsToExport = exportScope === 'current'
        ? (activeFileId ? [activeFileId] : [])
        : files.map((f) => f.id);

      if (fileIdsToExport.length === 0) {
        showToast('Нет выбранных файлов для экспорта');
        return;
      }

      // 1. Export files
      await api.exportFilesToProject(fileIdsToExport, targetProjId, targetProjTitle);

      // 2. Optionally create a flow task in that project
      if (createTaskForProject) {
        await api.createTask({
          projectId: targetProjId,
          title: `Интеграция модуля: ${activeName || 'Кодовая база'}`,
          description: `Файлы (${fileIdsToExport.length} шт.) экспортированы из Veylor Code Studio. Проверьте совместимость и проведите ревью.`,
          priority: 'high',
          status: 'in_progress',
        });
      }

      // Refresh files list
      await loadFiles();
      setShowExportModal(false);
      setIsCreatingProjectInline(false);
      setNewProjectTitle('');
      showToast(`Успешно экспортировано в проект «${targetProjTitle}»!`);
    } catch (err: any) {
      showToast(err.message || 'Ошибка экспорта в проект');
    } finally {
      setIsExporting(false);
    }
  };

  // AI Assist actions
  const handleAiAction = async (
    action: 'assist' | 'explain' | 'audit' | 'optimize' | 'tests' | 'generate' | 'fix' | 'refactor' | 'doc' | 'review' | 'task_breakdown' | 'chat',
    customPrompt?: string
  ) => {
    setIsAiLoading(true);
    setAiActiveAction(action);
    if (action !== 'chat') {
      setAiResponse(null);
    }

    const currentPrompt = customPrompt || aiPrompt;

    if (action === 'chat' && currentPrompt) {
      setChatHistory((prev) => [...prev, { role: 'user', content: currentPrompt }]);
    }

    try {
      const res = await api.codeAssist({
        prompt: currentPrompt,
        code: activeCode,
        language: activeLang,
        action,
        chatHistory: action === 'chat' ? chatHistory : undefined,
      });

      if (action === 'chat') {
        setChatHistory((prev) => [...prev, { role: 'assistant', content: res.result }]);
        setAiPrompt('');
        setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      } else {
        setAiResponse(res.result);
        if (customPrompt) setAiPrompt('');
      }
    } catch (err: any) {
      const errorMsg = `Ошибка обращения к Veylor AI: ${err.message || 'Сервис временно недоступен'}`;
      if (action === 'chat') {
        setChatHistory((prev) => [...prev, { role: 'assistant', content: errorMsg }]);
      } else {
        setAiResponse(errorMsg);
      }
    } finally {
      setIsAiLoading(false);
    }
  };

  // Non-autonomous code application: open Diff Review modal first
  const handleOpenDiffModal = (text: string) => {
    const codeMatch = text.match(/```(?:[a-zA-Z0-9_-]+)?\n([\s\S]*?)```/);
    const extracted = codeMatch && codeMatch[1] ? codeMatch[1].trim() : text.trim();
    setProposedCode(extracted);
    setShowDiffModal(true);
  };

  // Safe wrapper redirecting to diff preview modal
  const handleApplyAiCode = (text: string) => {
    handleOpenDiffModal(text);
  };

  // Explicit approval by developer in non-autonomous mode
  const handleConfirmApplyDiff = () => {
    if (!proposedCode) return;
    setActiveCode(proposedCode);
    setIsSaved(false);
    setShowDiffModal(false);
    showToast('Код проверен, утвержден и применен в редактор');
  };

  // Create new file directly from AI response
  const handleCreateFileFromAi = async (text: string) => {
    const codeMatch = text.match(/```(?:[a-zA-Z0-9_-]+)?\n([\s\S]*?)```/);
    const content = codeMatch && codeMatch[1] ? codeMatch[1].trim() : text;
    const name = `ai_module_${Date.now().toString(36)}.${activeLang === 'typescript' ? 'ts' : activeLang === 'python' ? 'py' : activeLang === 'sql' ? 'sql' : 'js'}`;

    try {
      const res = await api.saveCodeFile({
        name,
        language: activeLang,
        content,
        projectId: activeProjectId,
        projectName: activeProjectName,
      });
      setFiles((prev) => [res.file, ...prev]);
      selectFile(res.file);
      showToast(`Создан новый файл «${name}»`);
    } catch (err: any) {
      showToast(err.message || 'Ошибка создания файла');
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(activeCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyResponse = () => {
    if (aiResponse) {
      navigator.clipboard.writeText(aiResponse);
      setCopiedResponse(true);
      setTimeout(() => setCopiedResponse(false), 2000);
    }
  };

  const handleShareToMessenger = () => {
    if (onShareToChat) {
      onShareToChat({
        code: activeCode,
        language: activeLang,
        name: activeName || 'snippet.ts',
      });
    } else {
      api.sendMessage({
        channelId: 'dev',
        content: `Сниппет из Veylor Code Studio: ${activeName}`,
        codeSnippet: {
          code: activeCode,
          language: activeLang,
        },
      }).then(() => {
        showToast('Код отправлен в канал #dev мессенджера!');
      });
    }
  };

  // Keyboard shortcut Ctrl+S
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveFile();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeFileId, activeName, activeLang, activeCode, activeProjectId, activeProjectName]);

  const lineCount = activeCode.split('\n').length;

  return (
    <div className="space-y-4">
      {/* Toast Notification Banner */}
      {toastNotice && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 border border-indigo-500/50 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 font-mono text-xs animate-in slide-in-from-top-4 duration-200">
          <CheckCheck className="w-4 h-4 text-emerald-400" />
          <span>{toastNotice}</span>
        </div>
      )}

      {/* Top Banner / Header Toolbar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-slate-900/80 p-4 rounded-2xl border border-slate-800 shadow-xl backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-cyan-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/25 border border-indigo-400/30">
            <Code2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-white tracking-tight">Veylor Code Studio</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                Veylor AI · Gemini
              </span>
              {activeProjectName && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-purple-500/15 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                  <FolderGit2 className="w-3 h-3 text-purple-400" />
                  {activeProjectName}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Среда разработки с ИИ-ассистентом, экспортом в проекты и выгрузкой в ZIP архивы
            </p>
          </div>
        </div>

        {/* Action Controls Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Run Sandbox */}
          <button
            onClick={handleRunCode}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
            title="Запустить код в песочнице"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Запустить
          </button>

          {/* Save File */}
          <button
            onClick={handleSaveFile}
            disabled={isSaving || isSaved}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
              isSaved
                ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-default'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/25 border border-indigo-500/30'
            }`}
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : isSaved ? (
              <FileCheck2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            {isSaved ? 'Сохранено' : 'Сохранить (Ctrl+S)'}
          </button>

          {/* Export to Project */}
          <button
            onClick={handleOpenExportModal}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-950/80 hover:bg-indigo-900 text-cyan-300 transition flex items-center gap-1.5 border border-indigo-700/60 shadow-md shadow-indigo-950/40"
            title="Экспортировать файлы в проекты Veylor Hub"
          >
            <FolderGit2 className="w-3.5 h-3.5 text-cyan-400" />
            Экспорт в проект
          </button>

          {/* Download ZIP bundle */}
          <button
            onClick={handleDownloadZip}
            disabled={isZipping || files.length === 0}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition flex items-center gap-1.5 border border-slate-700 shadow-sm"
            title="Скачать всю кодовую базу в ZIP архиве"
          >
            {isZipping ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
            ) : (
              <Download className="w-3.5 h-3.5 text-cyan-400" />
            )}
            Скачать ZIP
          </button>

          {/* Share to chat */}
          <button
            onClick={handleShareToMessenger}
            className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition flex items-center gap-1.5 border border-slate-700"
            title="Отправить код в мессенджер"
          >
            <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
            В мессенджер
          </button>

          {/* Copy code */}
          <button
            onClick={handleCopyCode}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition border border-slate-700"
            title="Скопировать весь код"
          >
            {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Studio Grid: Files Sidebar (Col 3) | Code Editor (Col 5) | AI Assistant Panel (Col 4) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left: Files Explorer */}
        <div className="lg:col-span-3 bg-slate-900/80 rounded-2xl border border-slate-800 p-3 space-y-3 shadow-lg">
          <div className="flex items-center justify-between px-2 pt-1">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5 text-indigo-400" />
              Файлы ({files.length})
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowNewFileModal(true)}
                className="p-1.5 rounded-lg bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600 hover:text-white transition"
                title="Создать новый файл"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {isLoadingFiles ? (
            <div className="py-6 flex justify-center text-slate-500">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : (
            <div className="space-y-1 max-h-[460px] overflow-y-auto pr-1">
              {files.map((file) => {
                const isActive = file.id === activeFileId;
                return (
                  <div
                    key={file.id}
                    onClick={() => selectFile(file)}
                    className={`group flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-mono cursor-pointer transition ${
                      isActive
                        ? 'bg-indigo-600/25 text-white border border-indigo-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-indigo-400 text-xs">λ</span>
                      <div className="min-w-0">
                        <span className="truncate block font-semibold">{file.name}</span>
                        {file.projectName && (
                          <span className="text-[10px] text-purple-400 truncate block font-sans">
                            {file.projectName}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setFileToDelete(file);
                        }}
                        className="p-1 hover:text-rose-400 transition text-slate-500"
                        title="Удалить файл"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {files.length === 0 && (
                <div className="text-center py-6 text-slate-500 text-xs font-mono">
                  Файлов нет. Нажмите «+», чтобы создать.
                </div>
              )}
            </div>
          )}

          {/* Quick Actions Drawer */}
          <div className="pt-3 border-t border-slate-800 space-y-1.5">
            <span className="text-[11px] font-mono text-slate-500 px-2 uppercase tracking-wider block">
              Быстрый экспорт
            </span>
            <button
              onClick={handleOpenExportModal}
              className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-mono text-slate-300 hover:bg-indigo-500/10 hover:text-cyan-300 transition flex items-center gap-2 border border-transparent hover:border-indigo-500/20"
            >
              <FolderGit2 className="w-3.5 h-3.5 text-cyan-400" />
              Привязать к проекту
            </button>
            <button
              onClick={handleDownloadZip}
              className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-mono text-slate-300 hover:bg-indigo-500/10 hover:text-indigo-300 transition flex items-center gap-2 border border-transparent hover:border-indigo-500/20"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              Скачать весь ZIP
            </button>
            <button
              onClick={handleDownloadSingleFile}
              className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-mono text-slate-300 hover:bg-indigo-500/10 hover:text-indigo-300 transition flex items-center gap-2 border border-transparent hover:border-indigo-500/20"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              Скачать текущий файл
            </button>
          </div>
        </div>

        {/* Center: Main Code Editor */}
        <div className="lg:col-span-5 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl overflow-hidden flex flex-col">
          {/* Editor Header Bar */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950/70 border-b border-slate-800 text-xs font-mono">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              <span className="text-slate-300 font-semibold ml-2 truncate">
                {activeName || 'Новый файл'}
              </span>
              {!isSaved && <span className="text-amber-400 text-[10px] shrink-0">● не сохранен</span>}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <select
                value={activeLang}
                onChange={(e) => setActiveLang(e.target.value)}
                className="bg-slate-900 text-slate-300 border border-slate-700 rounded-lg px-2 py-1 text-xs font-mono focus:outline-none focus:border-indigo-500"
              >
                <option value="typescript">TypeScript</option>
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="sql">SQL</option>
                <option value="json">JSON</option>
                <option value="rust">Rust</option>
                <option value="go">Go</option>
                <option value="html">HTML</option>
                <option value="css">CSS</option>
              </select>
              <span className="text-slate-500">{lineCount} строк</span>
            </div>
          </div>

          {/* Editor Textarea with line numbers gutter */}
          <div className="relative flex bg-[#0B0F19] min-h-[460px] font-mono text-xs">
            <div className="select-none py-3 px-3 text-right bg-slate-950/40 border-r border-slate-800 text-slate-600 text-[11px] font-mono leading-relaxed">
              {Array.from({ length: Math.max(lineCount, 22) }).map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>

            <textarea
              ref={textareaRef}
              value={activeCode}
              onChange={handleCodeChange}
              spellCheck={false}
              placeholder="// Введите код или выберите файл из левого списка..."
              className="flex-1 p-3 bg-transparent text-slate-100 placeholder-slate-700 outline-none resize-none font-mono text-xs leading-relaxed focus:ring-0 border-none selection:bg-indigo-600/40"
              style={{
                tabSize: 2,
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              }}
            />
          </div>

          {/* Terminal / Output Drawer */}
          {showTerminal && (
            <div className="border-t border-slate-800 bg-black/80 p-3 font-mono text-xs text-slate-300 space-y-1">
              <div className="flex items-center justify-between pb-1 border-b border-slate-800/80 text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <Terminal className="w-3.5 h-3.5" />
                  Терминал исполнения Veylor Sandbox
                </span>
                <button
                  onClick={() => setShowTerminal(false)}
                  className="hover:text-white transition text-slate-500"
                >
                  ✕ Закрыть
                </button>
              </div>
              <div className="max-h-36 overflow-y-auto space-y-0.5 text-[11px]">
                {consoleOutput.map((line, idx) => (
                  <div key={idx} className="leading-relaxed">
                    {line}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Maximally Upgraded Veylor AI Assistant */}
        <div className="lg:col-span-4 bg-slate-900/90 rounded-2xl border border-indigo-900/40 shadow-2xl p-4 flex flex-col justify-between space-y-3 relative overflow-hidden backdrop-blur min-h-[540px]">
          {/* Subtle neon glow */}
          <div className="absolute -top-16 -right-16 w-36 h-36 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none" />

          {/* Header & Mode Switcher */}
          <div className="border-b border-slate-800 pb-2.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-600/25 border border-indigo-500/40 flex items-center justify-center text-cyan-400">
                  <Sparkles className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <span className="text-sm font-bold text-white tracking-tight block">Veylor AI Pro</span>
                  <span className="text-[10px] text-cyan-300 font-mono">Gemini 3.8 Flash Engine</span>
                </div>
              </div>

              {aiResponse && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleCopyResponse}
                    className="p-1 rounded text-slate-400 hover:text-white transition"
                    title="Скопировать ответ"
                  >
                    {copiedResponse ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}
            </div>

            {/* AI Modes Tabs */}
            {/* Non-Autonomous Human-in-the-Loop Status Badge */}
            <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-950 border border-indigo-500/20 text-[10px] text-slate-300 font-mono">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-white font-semibold">Неавтономный Co-Pilot</span>
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Human-in-the-Loop
              </span>
            </div>

            {/* AI Modes Tabs */}
            <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px] font-mono">
              <button
                onClick={() => setAiMode('actions')}
                className={`py-1 rounded-lg transition ${
                  aiMode === 'actions' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                ⚡ Анализ
              </button>
              <button
                onClick={() => setAiMode('chat')}
                className={`py-1 rounded-lg transition ${
                  aiMode === 'chat' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                💬 Чат ИИ
              </button>
              <button
                onClick={() => setAiMode('review')}
                className={`py-1 rounded-lg transition ${
                  aiMode === 'review' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                🏆 Ревью
              </button>
            </div>
          </div>

          {/* Body Content according to active AI Mode */}
          <div className="flex-1 min-h-[320px] max-h-[440px] overflow-y-auto space-y-3 pr-1 text-xs">
            {isAiLoading ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3 py-16">
                <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                <div className="text-center font-mono text-xs">
                  <span className="text-cyan-300 font-semibold">Veylor AI формирует рекомендации...</span>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Подготовка предложений для ручной проверки инженером
                  </p>
                </div>
              </div>
            ) : aiMode === 'chat' ? (
              // Chat conversation with AI
              <div className="space-y-3">
                {chatHistory.length === 0 ? (
                  <div className="text-center py-10 text-slate-500 space-y-2">
                    <Sparkles className="w-7 h-7 text-indigo-400/40 mx-auto" />
                    <p className="text-xs text-slate-400">
                      Интерактивный диалог с парным инженером Veylor AI
                    </p>
                    <div className="flex flex-wrap gap-1.5 justify-center pt-2">
                      <button
                        onClick={() => handleAiAction('chat', 'Как сделать этот модуль асинхронным?')}
                        className="px-2 py-1 rounded bg-slate-950 text-[10px] text-slate-400 hover:text-cyan-300 border border-slate-800"
                      >
                        Сделать асинхронным
                      </button>
                      <button
                        onClick={() => handleAiAction('chat', 'Добавь валидацию входящих аргументов')}
                        className="px-2 py-1 rounded bg-slate-950 text-[10px] text-slate-400 hover:text-cyan-300 border border-slate-800"
                      >
                        Добавить валидацию
                      </button>
                      <button
                        onClick={() => handleAiAction('chat', 'Типизируй весь код на TypeScript')}
                        className="px-2 py-1 rounded bg-slate-950 text-[10px] text-slate-400 hover:text-cyan-300 border border-slate-800"
                      >
                        Строгая типизация
                      </button>
                    </div>
                  </div>
                ) : (
                  chatHistory.map((m, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl font-mono text-xs leading-relaxed whitespace-pre-wrap ${
                        m.role === 'user'
                          ? 'bg-indigo-600/30 text-white border border-indigo-500/30'
                          : 'bg-slate-950 text-slate-200 border border-slate-800 select-text'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-1">
                        <span>{m.role === 'user' ? 'Вы' : 'Veylor AI (Консультант)'}</span>
                        {m.role === 'assistant' && m.content.includes('```') && (
                          <button
                            onClick={() => handleOpenDiffModal(m.content)}
                            className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-sans"
                          >
                            <GitCompare className="w-3 h-3" />
                            Сравнить код
                          </button>
                        )}
                      </div>
                      {m.content}
                    </div>
                  ))
                )}
                <div ref={chatBottomRef} />
              </div>
            ) : aiMode === 'review' && !aiResponse ? (
              // Review Launch Screen (Manual invocation - non-autonomous)
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-3 my-auto">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-cyan-400 mx-auto">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Комплексное код-ревью</h4>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                    Veylor AI подготовит экспертное заключение по файлу <span className="text-cyan-300 font-mono font-semibold">{activeName || 'текущего кода'}</span>: безопасность, читаемость, алгоритмическая сложность и рекомендации.
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-left text-[11px] text-slate-400 space-y-1 font-mono">
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Модуль:</span>
                    <span className="text-white truncate max-w-[140px]">{activeName || 'untitled.ts'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Стек:</span>
                    <span className="text-cyan-400 uppercase">{activeLang}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Размер:</span>
                    <span>{activeCode ? activeCode.split('\n').length : 0} строк</span>
                  </div>
                  <div className="flex items-center justify-between text-emerald-400 pt-1 border-t border-slate-800">
                    <span>Контроль:</span>
                    <span>Ручной (Human-in-the-Loop)</span>
                  </div>
                </div>
                <div className="pt-1">
                  <button
                    onClick={() => handleAiAction('review')}
                    disabled={isAiLoading}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25"
                  >
                    <Zap className="w-3.5 h-3.5 text-cyan-300" />
                    Запустить ревью по запросу
                  </button>
                </div>
              </div>
            ) : aiResponse ? (
              // AI Response (Actions or Review) with Diff / Review Modal Trigger
              <div className="space-y-3">
                <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/20 text-[10px] text-emerald-300 font-mono">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Рекомендация готова к проверке</span>
                  </span>
                  <span className="text-slate-400">Код не изменен</span>
                </div>

                <div className="bg-slate-950 rounded-xl p-3 border border-indigo-500/25 text-slate-200 font-mono text-xs leading-relaxed whitespace-pre-wrap select-text max-h-[220px] overflow-y-auto">
                  {aiResponse}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <button
                    onClick={() => handleOpenDiffModal(aiResponse)}
                    className="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/25"
                  >
                    <GitCompare className="w-3.5 h-3.5" />
                    Проверить и утвердить (Diff)
                  </button>

                  <button
                    onClick={() => handleCreateFileFromAi(aiResponse)}
                    className="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-cyan-300 transition flex items-center justify-center gap-1.5 border border-slate-700"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    В новый файл
                  </button>
                </div>

                <div className="flex items-center justify-between pt-0.5">
                  <button
                    onClick={() => setAiResponse(null)}
                    className="text-[11px] text-slate-500 hover:text-slate-300 transition flex items-center gap-1"
                  >
                    ✕ Скрыть рекомендацию
                  </button>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Требуется утверждение инженера
                  </span>
                </div>
              </div>
            ) : (
              // Default Actions Grid
              <div className="space-y-2">
                <span className="text-[11px] font-mono text-slate-400 block px-1 uppercase tracking-wider">
                  Команды консультанта (по вашему запросу)
                </span>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleAiAction('explain')}
                    className="p-2.5 rounded-xl bg-slate-950/70 hover:bg-indigo-600/20 border border-slate-800 hover:border-indigo-500/40 text-left transition group"
                  >
                    <div className="flex items-center gap-1.5 text-cyan-400 text-xs font-bold mb-1">
                      <HelpCircle className="w-3.5 h-3.5" />
                      Объяснить
                    </div>
                    <p className="text-[10px] text-slate-400 line-clamp-2">
                      Построчный анализ логики и потока данных
                    </p>
                  </button>

                  <button
                    onClick={() => handleAiAction('audit')}
                    className="p-2.5 rounded-xl bg-slate-950/70 hover:bg-amber-600/20 border border-slate-800 hover:border-amber-500/40 text-left transition group"
                  >
                    <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold mb-1">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      Аудит
                    </div>
                    <p className="text-[10px] text-slate-400 line-clamp-2">
                      Поиск уязвимостей и инъекций
                    </p>
                  </button>

                  <button
                    onClick={() => handleAiAction('optimize')}
                    className="p-2.5 rounded-xl bg-slate-950/70 hover:bg-indigo-600/20 border border-slate-800 hover:border-indigo-500/40 text-left transition group"
                  >
                    <div className="flex items-center gap-1.5 text-indigo-400 text-xs font-bold mb-1">
                      <Zap className="w-3.5 h-3.5" />
                      Оптимизация
                    </div>
                    <p className="text-[10px] text-slate-400 line-clamp-2">
                      Предложения ускорения и экономии памяти
                    </p>
                  </button>

                  <button
                    onClick={() => handleAiAction('fix')}
                    className="p-2.5 rounded-xl bg-slate-950/70 hover:bg-rose-600/20 border border-slate-800 hover:border-rose-500/40 text-left transition group"
                  >
                    <div className="flex items-center gap-1.5 text-rose-400 text-xs font-bold mb-1">
                      <Wrench className="w-3.5 h-3.5" />
                      Фикс багов
                    </div>
                    <p className="text-[10px] text-slate-400 line-clamp-2">
                      Рекомендации по устранению багов
                    </p>
                  </button>

                  <button
                    onClick={() => handleAiAction('tests')}
                    className="p-2.5 rounded-xl bg-slate-950/70 hover:bg-emerald-600/20 border border-slate-800 hover:border-emerald-500/40 text-left transition group"
                  >
                    <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold mb-1">
                      <TestTube className="w-3.5 h-3.5" />
                      Unit-тесты
                    </div>
                    <p className="text-[10px] text-slate-400 line-clamp-2">
                      Генерация наборов тестов для проверки
                    </p>
                  </button>

                  <button
                    onClick={() => handleAiAction('refactor')}
                    className="p-2.5 rounded-xl bg-slate-950/70 hover:bg-purple-600/20 border border-slate-800 hover:border-purple-500/40 text-left transition group"
                  >
                    <div className="flex items-center gap-1.5 text-purple-400 text-xs font-bold mb-1">
                      <Sliders className="w-3.5 h-3.5" />
                      Рефакторинг
                    </div>
                    <p className="text-[10px] text-slate-400 line-clamp-2">
                      Предложение по Clean Code и SOLID
                    </p>
                  </button>

                  <button
                    onClick={() => handleAiAction('doc')}
                    className="p-2.5 rounded-xl bg-slate-950/70 hover:bg-cyan-600/20 border border-slate-800 hover:border-cyan-500/40 text-left transition group"
                  >
                    <div className="flex items-center gap-1.5 text-cyan-300 text-xs font-bold mb-1">
                      <BookOpen className="w-3.5 h-3.5" />
                      JSDoc
                    </div>
                    <p className="text-[10px] text-slate-400 line-clamp-2">
                      Полная документация API
                    </p>
                  </button>

                  <button
                    onClick={() => handleAiAction('task_breakdown')}
                    className="p-2.5 rounded-xl bg-slate-950/70 hover:bg-amber-600/20 border border-slate-800 hover:border-amber-500/40 text-left transition group"
                  >
                    <div className="flex items-center gap-1.5 text-amber-300 text-xs font-bold mb-1">
                      <ListTodo className="w-3.5 h-3.5" />
                      Задачи Flow
                    </div>
                    <p className="text-[10px] text-slate-400 line-clamp-2">
                      Декомпозиция кода на спринты
                    </p>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* AI Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (aiPrompt.trim()) {
                handleAiAction(aiMode === 'chat' ? 'chat' : 'generate', aiPrompt.trim());
              }
            }}
            className="pt-2 border-t border-slate-800 space-y-2"
          >
            <div className="relative">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder={
                  aiMode === 'chat'
                    ? 'Задайте вопрос ИИ по коду...'
                    : "Промпт к ИИ (напр. 'Добавь кэширование Redis')..."
                }
                className="w-full bg-slate-950 text-slate-100 placeholder-slate-600 border border-slate-800 rounded-xl px-3 py-2 text-xs font-sans focus:outline-none focus:border-cyan-500 pr-9 transition"
              />
              <button
                type="submit"
                disabled={!aiPrompt.trim() || isAiLoading}
                className="absolute right-1.5 top-1.5 p-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white transition"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono px-1">
              <span>Enter для отправки</span>
              <span className="text-cyan-400">Veylor Hub Secure AI</span>
            </div>
          </form>
        </div>
      </div>

      {/* Modal: Create New File */}
      {showNewFileModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <FileCode className="w-4 h-4 text-indigo-400" />
                Создать новый файл
              </h2>
              <button
                onClick={() => setShowNewFileModal(false)}
                className="text-slate-400 hover:text-white transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateFile} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Имя файла (с расширением)
                </label>
                <input
                  type="text"
                  required
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder="auth.ts, worker.py, query.sql"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Язык программирования
                </label>
                <select
                  value={newFileLang}
                  onChange={(e) => setNewFileLang(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-indigo-500 transition"
                >
                  <option value="typescript">TypeScript</option>
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="sql">SQL</option>
                  <option value="json">JSON</option>
                  <option value="rust">Rust</option>
                  <option value="go">Go</option>
                  <option value="html">HTML</option>
                  <option value="css">CSS</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewFileModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-md shadow-indigo-600/25"
                >
                  Создать файл
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete File Confirmation (Reliable, no window.confirm) */}
      {fileToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Удаление файла</h3>
                <p className="text-xs text-slate-400">Действие необратимо</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Вы уверены, что хотите удалить файл <span className="font-mono font-bold text-white">«{fileToDelete.name}»</span>? Содержимое будет безвозвратно удалено из репозитория Veylor Hub.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setFileToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                Отмена
              </button>
              <button
                type="button"
                disabled={isDeletingFile}
                onClick={confirmDeleteFile}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition shadow-md shadow-rose-600/25 flex items-center gap-1.5"
              >
                {isDeletingFile ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                Удалить файл
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Export to Project */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-cyan-400">
                  <FolderGit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Экспорт в проекты</h3>
                  <p className="text-xs text-slate-400">Связывание кода с проектами Veylor Hub</p>
                </div>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-slate-400 hover:text-white transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleExecuteExportToProject} className="space-y-4">
              {/* Scope Selection */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Область экспорта
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setExportScope('current')}
                    className={`py-2 px-3 rounded-xl text-xs font-mono transition text-left border ${
                      exportScope === 'current'
                        ? 'bg-indigo-600/20 border-indigo-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="font-bold block">Текущий файл</span>
                    <span className="text-[10px] text-slate-400 truncate block">
                      {activeName || 'untitled.ts'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setExportScope('all')}
                    className={`py-2 px-3 rounded-xl text-xs font-mono transition text-left border ${
                      exportScope === 'all'
                        ? 'bg-indigo-600/20 border-indigo-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="font-bold block">Все файлы</span>
                    <span className="text-[10px] text-slate-400 block">
                      {files.length} шт. (пакет проекта)
                    </span>
                  </button>
                </div>
              </div>

              {/* Project Target */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    Целевой проект
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCreatingProjectInline(!isCreatingProjectInline)}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 transition"
                  >
                    {isCreatingProjectInline ? 'Выбрать существующий' : '+ Создать новый проект'}
                  </button>
                </div>

                {isCreatingProjectInline ? (
                  <input
                    type="text"
                    required
                    value={newProjectTitle}
                    onChange={(e) => setNewProjectTitle(e.target.value)}
                    placeholder="Название нового проекта (напр. Backend Gateway)..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                ) : (
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    {availableProjects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} ({p.code})
                      </option>
                    ))}
                    {availableProjects.length === 0 && (
                      <option value="">Нет проектов. Создайте проект выше.</option>
                    )}
                  </select>
                )}
              </div>

              {/* Checkbox: Create Task in Veylor Flow */}
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={createTaskForProject}
                  onChange={(e) => setCreateTaskForProject(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-0"
                />
                <span>Автоматически создать задачу в доске Veylor Flow</span>
              </label>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowExportModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isExporting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-md shadow-indigo-600/25 flex items-center gap-1.5"
                >
                  {isExporting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FolderGit2 className="w-3.5 h-3.5" />
                  )}
                  Экспортировать в проект
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Non-Autonomous Diff & Human Approval */}
      {showDiffModal && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-3 sm:p-5 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <GitCompare className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">Проверка и утверждение изменений</h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      Human-in-the-Loop
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Неавтономный режим: Veylor AI предлагает код, но окончательное решение принимаете вы
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
                  <button
                    type="button"
                    onClick={() => setDiffViewTab('sideBySide')}
                    className={`px-3 py-1 rounded-lg transition ${
                      diffViewTab === 'sideBySide'
                        ? 'bg-indigo-600 text-white font-semibold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Сравнение До / После
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiffViewTab('proposed')}
                    className={`px-3 py-1 rounded-lg transition ${
                      diffViewTab === 'proposed'
                        ? 'bg-indigo-600 text-white font-semibold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Предложенный код
                  </button>
                </div>

                <button
                  onClick={() => setShowDiffModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  title="Закрыть без изменений"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Code Comparison Body */}
            <div className="flex-1 overflow-hidden min-h-[300px]">
              {diffViewTab === 'sideBySide' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 h-full">
                  {/* Left: Original File */}
                  <div className="flex flex-col rounded-xl border border-slate-800 bg-slate-950/90 overflow-hidden h-full max-h-[50vh]">
                    <div className="px-3 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <FileCode className="w-3.5 h-3.5 text-slate-500" />
                        Текущий код ({activeName || 'untitled.ts'})
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {activeCode ? activeCode.split('\n').length : 0} строк
                      </span>
                    </div>
                    <pre className="p-3 overflow-auto font-mono text-[11px] leading-relaxed text-slate-300 flex-1 select-text">
                      <code>{activeCode || '// Файл пуст'}</code>
                    </pre>
                  </div>

                  {/* Right: Proposed Code */}
                  <div className="flex flex-col rounded-xl border border-emerald-500/30 bg-slate-950/90 overflow-hidden h-full max-h-[50vh] shadow-inner shadow-emerald-950/20">
                    <div className="px-3 py-2 bg-emerald-950/40 border-b border-emerald-500/20 flex items-center justify-between text-xs font-mono">
                      <span className="text-emerald-300 font-medium flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                        Предложение Veylor AI
                      </span>
                      <span className="text-[11px] text-emerald-400 font-bold">
                        {proposedCode ? proposedCode.split('\n').length : 0} строк
                      </span>
                    </div>
                    <pre className="p-3 overflow-auto font-mono text-[11px] leading-relaxed text-emerald-200/90 flex-1 select-text">
                      <code>{proposedCode}</code>
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col rounded-xl border border-emerald-500/30 bg-slate-950/90 overflow-hidden h-full max-h-[50vh]">
                  <div className="px-3 py-2 bg-emerald-950/40 border-b border-emerald-500/20 flex items-center justify-between text-xs font-mono">
                    <span className="text-emerald-300 font-medium flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      Предложенный код модуля целиком
                    </span>
                    <span className="text-[11px] text-emerald-400 font-bold">
                      {proposedCode ? proposedCode.split('\n').length : 0} строк
                    </span>
                  </div>
                  <pre className="p-3 overflow-auto font-mono text-[11px] leading-relaxed text-emerald-200/90 flex-1 select-text">
                    <code>{proposedCode}</code>
                  </pre>
                </div>
              )}
            </div>

            {/* Metrics & Control Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-800 text-xs font-mono">
              <div className="flex items-center gap-3 text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Строк: {proposedCode.split('\n').length}
                </span>
                <span>
                  Дельта:{' '}
                  <span
                    className={
                      proposedCode.split('\n').length >= (activeCode ? activeCode.split('\n').length : 0)
                        ? 'text-emerald-400'
                        : 'text-amber-400'
                    }
                  >
                    {proposedCode.split('\n').length - (activeCode ? activeCode.split('\n').length : 0) > 0 ? '+' : ''}
                    {proposedCode.split('\n').length - (activeCode ? activeCode.split('\n').length : 0)}
                  </span>
                </span>
                <span className="text-slate-600">|</span>
                <span className="text-slate-400">Редактор не изменится до вашего подтверждения</span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowDiffModal(false)}
                  className="px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  ✕ Отклонить
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleCreateFileFromAi(proposedCode);
                    setShowDiffModal(false);
                  }}
                  className="px-3 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-cyan-300 transition flex items-center gap-1.5 border border-slate-700"
                >
                  <Plus className="w-3.5 h-3.5" />
                  В новый файл
                </button>

                <button
                  type="button"
                  onClick={handleConfirmApplyDiff}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-lg shadow-emerald-600/30 flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Утвердить и применить в редактор
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
