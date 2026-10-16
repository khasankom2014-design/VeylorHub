import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api.ts';
import { TeamUpdate } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { Newspaper, Plus, Shield, Sparkles, MessageSquare, X } from 'lucide-react';

export const UpdatesView: React.FC = () => {
  const { user } = useAuth();
  const [updates, setUpdates] = useState<TeamUpdate[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<TeamUpdate['category']>('announcement');

  const loadUpdates = useCallback(async () => {
    try {
      const res = await api.getUpdates();
      setUpdates(res.updates);
    } catch {
      // access handled
    }
  }, []);

  useEffect(() => {
    loadUpdates();
  }, [loadUpdates]);

  const canPost = user?.role === 'owner' || user?.permissions?.canPostUpdates;

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;

    try {
      await api.createUpdate({ title, content, category });
      setShowModal(false);
      setTitle('');
      setContent('');
      loadUpdates();
    } catch (err: any) {
      alert(err.message || 'Ошибка публикации');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Newspaper className="w-6 h-6 text-indigo-400" />
            Новости и обновления команды
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Внутренняя лента релизов, анонсов и стратегических решений.
          </p>
        </div>

        {canPost && (
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" />
            Опубликовать обновление
          </button>
        )}
      </div>

      {/* Feed list */}
      <div className="space-y-4 max-w-4xl">
        {updates.map((upd) => (
          <article
            key={upd.id}
            className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl"
          >
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-3">
                <img
                  src={upd.authorAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(upd.authorName)}`}
                  alt={upd.authorName}
                  className="w-8 h-8 rounded-full border border-slate-700 object-cover"
                />
                <div>
                  <div className="font-semibold text-white text-sm flex items-center gap-1.5">
                    {upd.authorName}
                    {upd.authorRole === 'owner' && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300">
                        Владелец
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    {new Date(upd.createdAt).toLocaleString('ru-RU')}
                  </div>
                </div>
              </div>

              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-indigo-400 border border-slate-700 font-mono">
                {upd.category === 'announcement' ? 'Анонс' : upd.category === 'release' ? 'Релиз' : 'Общее'}
              </span>
            </div>

            <h3 className="text-lg font-bold text-white mb-2">{upd.title}</h3>
            <p className="text-sm text-slate-300 whitespace-pre-line leading-relaxed">
              {upd.content}
            </p>
          </article>
        ))}
      </div>

      {/* MODAL: NEW UPDATE */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-1">Новая публикация</h3>
            <p className="text-xs text-slate-400 mb-6">
              Обновление будет видно всем активным участникам закрытого пространства.
            </p>

            <form onSubmit={handlePost} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Заголовок
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Например: Завершение перехода на изолированные контуры"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Категория
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as TeamUpdate['category'])}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="announcement">Анонс платформы</option>
                  <option value="release">Релиз / Обновление</option>
                  <option value="design">Дизайн & Интерфейс</option>
                  <option value="general">Общие новости</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Текст сообщения
                </label>
                <textarea
                  rows={4}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Опишите важное обновление для команды..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
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
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition"
                >
                  Опубликовать
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
