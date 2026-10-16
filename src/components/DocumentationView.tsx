import React, { useState } from 'react';
import {
  BookOpen,
  FileText,
  Search,
  Code2,
  Shield,
  Server,
  Zap,
  CheckCircle2,
  Copy,
  Check,
  Terminal,
  ExternalLink,
} from 'lucide-react';

interface DocArticle {
  id: string;
  category: 'Введение' | 'Архитектура' | 'Редактор & ИИ' | 'Безопасность' | 'API';
  title: string;
  summary: string;
  content: string;
}

const ARTICLES: DocArticle[] = [
  {
    id: 'intro',
    category: 'Введение',
    title: 'Начало работы с Veylor Labs',
    summary: 'Обзор возможностей закрытой среды разработки и командной координации',
    content: `## Добро пожаловать в Veylor Labs

**Veylor Labs** — специализированная закрытая инженерная платформа для совместной разработки программного обеспечения, координации задач и работы с кодом.

### Ключевые возможности:
- **Проекты и задачи**: организация работы по спринтам и статусам (Veylor Flow).
- **Встроенный редактор (Code Studio)**: подсветка синтаксиса, безопасное исполнение модулей, экспорт кодовой базы в ZIP.
- **Интегрированный ИИ-ассистент**: контекстный анализ, поиск уязвимостей, оптимизация алгоритмов на базе Google Gemini.
- **Внутренний мессенджер**: личные и групповые каналы, прикрепление сниппетов кода, официальный набор из 32 киберпанк-стикеров.
- **Закрытый контур**: доступ только по защищенным ссылкам-приглашениям владельца.`,
  },
  {
    id: 'architecture',
    category: 'Архитектура',
    title: 'Архитектура и модель данных',
    summary: 'Устройство серверного ядра, схема хранилища и синхронизация',
    content: `## Архитектура платформы

Veylor Labs построена по гибридной отказоустойчивой модели:
1. **Server-Side Core**: Express + Node.js / Bun runtime на порту 3000.
2. **Persistence Layer**: JSON Schema Database с синхронным журналированием и транзакционной целостностью.
3. **Client-Side Fallback Engine**: локальное кэширование и автономная репликация через localStorage, гарантирующая работоспособность даже при сбоях сети или статическом деплое.

\`\`\`
[ Клиент (React 19 + Vite) ]
        │
   (REST API / JWT)
        ▼
[ Express Router ] ───► [ RBAC Middleware ]
        │
        ▼
[ Database Controller ] ──► [ Файловое хранилище / JSON DB ]
\`\`\``,
  },
  {
    id: 'code-ai',
    category: 'Редактор & ИИ',
    title: 'Code Studio и работа с ИИ',
    summary: 'Неавтономный Co-Pilot (Human-in-the-Loop), диффы, запуск и ZIP-экспорт',
    content: `## Veylor Code Studio & Неавтономный ИИ-помощник

Редактор кода интегрирован с интеллектуальным парным инженером на базе Google Gemini.
Ассистент работает строго в **неавтономном режиме (Human-in-the-Loop)**: он никогда не изменяет код и не запускает сценарии без вашего личного подтверждения.

### Режимы и гарантии безопасности:
- **Human-in-the-Loop (Под контролем человека)**: любые предложения кода открываются в окне предпросмотра различий (Diff), где инженер видит сравнение до/после и принимает решение о вставке.
- **Объяснить код**: построчный разбор логики и архитектурных связей.
- **Аудит безопасности**: поиск потенциальных уязвимостей, инъекций и отсутствия валидации типов.
- **Оптимизация**: предложения по ускорению и сокращению расхода памяти (Big-O).
- **Unit-тесты**: генерация шаблонов тестов для ручной проверки краевых случаев.
- **Исправление ошибок**: обоснованные рекомендации по устранению найденных багов.
- **Код-ревью**: комплексный анализ с оценками безопасности, читаемости и архитектуры по запросу разработчика.

### Экспорт и сохранение:
- Кнопка **«Скачать ZIP»** упаковывает все файлы рабочего пространства с формированием README-манифеста.
- Кнопка **«Экспорт в проект»** привязывает выбранные файлы к проектам платформы.`,
  },
  {
    id: 'security',
    category: 'Безопасность',
    title: 'Политика безопасности и RBAC',
    summary: 'Управление доступом, аудит действий и защита контура',
    content: `## Защита периметра и права доступа

Veylor Labs использует строгую модель ролевого доступа (RBAC).

### Роли пользователей:
1. **Owner (Владелец)**:
   - Полный доступ к настройкам контура.
   - Создание и отзыв инвайт-токенов.
   - Управление участниками и назначение прав.
2. **Member (Участник)**:
   - Доступ к разрешенным проектам и задачам.
   - Разработка в Code Studio и общение в мессенджере.
   - Гранулярные флаги: \`canManageTasks\`, \`canCreateProjects\`, \`canPostUpdates\`.`,
  },
  {
    id: 'api-specs',
    category: 'API',
    title: 'Спецификация API endpoints',
    summary: 'Перечень серверных маршрутов для интеграции и автоматизации',
    content: `## REST API Эндпоинты

Все закрытые маршруты требуют заголовок \`Authorization: Bearer <TOKEN>\`.

### Аутентификация
- \`POST /api/auth/login\` — вход по email и паролю.
- \`POST /api/auth/register\` — регистрация с токеном приглашения.
- \`GET /api/auth/me\` — данные профиля текущего пользователя.

### Проекты и Задачи
- \`GET /api/projects\` — список доступных проектов.
- \`POST /api/projects\` — создание нового проекта.
- \`GET /api/tasks\` — список задач (фильтр по projectId).
- \`POST /api/tasks\` — создание задачи.
- \`PUT /api/tasks/:id\` — обновление статуса/приоритета.

### Мессенджер & Чат
- \`GET /api/chat/messages\` — получение сообщений канала или ДМ.
- \`POST /api/chat/messages\` — отправка текста, стикера или сниппета.
- \`PUT /api/chat/messages/:id\` — редактирование сообщения.
- \`DELETE /api/chat/messages/:id\` — удаление сообщения.`,
  },
];

export const DocumentationView: React.FC = () => {
  const [activeArticleId, setActiveArticleId] = useState<string>('intro');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  const activeArticle = ARTICLES.find((a) => a.id === activeArticleId) || ARTICLES[0];

  const filteredArticles = ARTICLES.filter((a) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      a.title.toLowerCase().includes(q) ||
      a.summary.toLowerCase().includes(q) ||
      a.content.toLowerCase().includes(q)
    );
  });

  const categories = Array.from(new Set(ARTICLES.map((a) => a.category)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-400" />
            Документация Veylor Labs
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Техническое руководство, архитектурные решения, регламенты безопасности и справочник API
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по документации..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Main Layout: Sidebar Articles + Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-4 bg-slate-900/60 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
          {categories.map((category) => {
            const catArticles = filteredArticles.filter((a) => a.category === category);
            if (catArticles.length === 0) return null;

            return (
              <div key={category} className="space-y-1.5">
                <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400 px-2 block">
                  {category}
                </span>
                <div className="space-y-1">
                  {catArticles.map((art) => {
                    const isActive = activeArticle.id === art.id;
                    return (
                      <button
                        key={art.id}
                        onClick={() => setActiveArticleId(art.id)}
                        className={`w-full text-left p-2.5 rounded-xl text-xs transition flex flex-col gap-0.5 ${
                          isActive
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-semibold'
                            : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                        }`}
                      >
                        <span>{art.title}</span>
                        <span
                          className={`text-[10px] line-clamp-1 ${
                            isActive ? 'text-indigo-200' : 'text-slate-500'
                          }`}
                        >
                          {art.summary}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Article Reader Pane */}
        <div className="lg:col-span-8 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <div>
              <span className="text-[11px] font-mono uppercase text-indigo-400 font-semibold">
                {activeArticle.category}
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
                {activeArticle.title}
              </h2>
            </div>

            <button
              onClick={() => {
                navigator.clipboard.writeText(activeArticle.content);
                setCopiedCode(true);
                setTimeout(() => setCopiedCode(false), 2000);
              }}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-mono transition flex items-center gap-1.5 border border-slate-700"
            >
              {copiedCode ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Скопировано</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Копировать</span>
                </>
              )}
            </button>
          </div>

          {/* Render Article Content */}
          <div className="prose prose-invert max-w-none text-xs sm:text-sm text-slate-300 leading-relaxed space-y-4">
            {activeArticle.content.split('\n\n').map((paragraph, index) => {
              if (paragraph.startsWith('## ')) {
                return (
                  <h3 key={index} className="text-lg font-bold text-white pt-2 border-b border-slate-800/60 pb-1">
                    {paragraph.replace('## ', '')}
                  </h3>
                );
              }
              if (paragraph.startsWith('### ')) {
                return (
                  <h4 key={index} className="text-base font-semibold text-cyan-300 pt-1">
                    {paragraph.replace('### ', '')}
                  </h4>
                );
              }
              if (paragraph.startsWith('```')) {
                const codeText = paragraph.replace(/```[a-z]*\n?/g, '').replace(/```$/, '');
                return (
                  <div key={index} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 font-mono text-xs text-slate-200 overflow-x-auto my-3">
                    <pre>
                      <code>{codeText}</code>
                    </pre>
                  </div>
                );
              }
              if (paragraph.startsWith('- ')) {
                const items = paragraph.split('\n- ');
                return (
                  <ul key={index} className="list-disc pl-5 space-y-1.5 text-slate-300">
                    {items.map((item, i) => (
                      <li key={i}>{item.replace(/^- /, '')}</li>
                    ))}
                  </ul>
                );
              }
              if (/^[0-9]\. /.test(paragraph)) {
                const items = paragraph.split(/\n[0-9]\. /);
                return (
                  <ol key={index} className="list-decimal pl-5 space-y-1.5 text-slate-300">
                    {items.map((item, i) => (
                      <li key={i}>{item.replace(/^[0-9]\. /, '')}</li>
                    ))}
                  </ol>
                );
              }
              return (
                <p key={index} className="leading-relaxed text-slate-300">
                  {paragraph}
                </p>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
