import React, { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../services/api.ts';
import { ChatMessage, User } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { STICKERS, Sticker } from '../data/stickers.ts';
import {
  MessageSquare,
  Hash,
  User as UserIcon,
  Send,
  Code,
  Smile,
  Copy,
  Check,
  Search,
  Shield,
  Loader2,
  Trash2,
  Edit2,
  X,
  ExternalLink,
  Users,
  AlertTriangle,
  Flame,
  CheckCheck,
} from 'lucide-react';

interface MessengerProps {
  initialCodeSnippet?: { code: string; language: string; name: string } | null;
  onOpenCodeInStudio?: (snippet: { code: string; language: string }) => void;
  onNavigateToTeam?: () => void;
}

export const Messenger: React.FC<MessengerProps> = ({
  initialCodeSnippet,
  onOpenCodeInStudio,
  onNavigateToTeam,
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [activeChannel, setActiveChannel] = useState<string>('general');
  const [activeRecipient, setActiveRecipient] = useState<User | null>(null);
  const [messageText, setMessageText] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [memberSearchQuery, setMemberSearchQuery] = useState<string>('');

  // Code snippet attachment
  const [showCodeModal, setShowCodeModal] = useState<boolean>(false);
  const [snippetCode, setSnippetCode] = useState<string>('');
  const [snippetLanguage, setSnippetLanguage] = useState<string>('typescript');
  const [attachedSnippet, setAttachedSnippet] = useState<{ code: string; language: string } | null>(null);

  // Sticker Picker modal / drawer
  const [showStickerDrawer, setShowStickerDrawer] = useState<boolean>(false);
  const [stickerCategory, setStickerCategory] = useState<string>('Все');
  const [stickerSearch, setStickerSearch] = useState<string>('');

  // Message Editing state
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>('');
  const [isSavingEdit, setIsSavingEdit] = useState<boolean>(false);

  // Message Deletion modal
  const [messageToDelete, setMessageToDelete] = useState<ChatMessage | null>(null);
  const [isDeletingMsg, setIsDeletingMsg] = useState<boolean>(false);

  // Enlarged sticker modal
  const [enlargedSticker, setEnlargedSticker] = useState<Sticker | null>(null);

  // Copied feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastNotice(msg);
    setTimeout(() => setToastNotice(null), 3000);
  };

  const channels = [
    { id: 'general', name: 'Общий', desc: 'Координация команды и обсуждения' },
    { id: 'dev', name: 'Разработка', desc: 'Код, сниппеты, архитектура и релизы' },
    { id: 'releases', name: 'Релизы', desc: 'Сборки, деплой и история версий' },
    { id: 'design', name: 'Дизайн & UI', desc: 'Интерфейсы, макеты и эстетика платформы' },
  ];

  // Auto-fill snippet if passed from CodeStudio
  useEffect(() => {
    if (initialCodeSnippet) {
      setActiveChannel('dev');
      setActiveRecipient(null);
      setAttachedSnippet({
        code: initialCodeSnippet.code,
        language: initialCodeSnippet.language,
      });
      setMessageText(`Сниппет: ${initialCodeSnippet.name}`);
    }
  }, [initialCodeSnippet]);

  // Load team members
  const loadMembers = useCallback(async () => {
    try {
      const res = await api.getTeamMembers();
      setTeamMembers(res.members);
    } catch (err) {
      console.error('Failed to load team members for chat:', err);
    }
  }, []);

  // Load messages for current conversation
  const loadMessages = useCallback(async () => {
    try {
      const res = await api.getMessages(
        activeRecipient ? undefined : activeChannel,
        activeRecipient ? activeRecipient.id : undefined
      );
      setMessages(res.messages || []);
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  }, [activeChannel, activeRecipient]);

  // Polling every 2.5 seconds
  useEffect(() => {
    loadMembers();
    loadMessages();
    const interval = setInterval(loadMessages, 2500);
    return () => clearInterval(interval);
  }, [loadMembers, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Focus input when editing starts
  useEffect(() => {
    if (editingMessageId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingMessageId]);

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!messageText.trim() && !attachedSnippet) || isSending) return;

    try {
      setIsSending(true);
      const res = await api.sendMessage({
        channelId: activeRecipient ? undefined : activeChannel,
        recipientId: activeRecipient ? activeRecipient.id : undefined,
        content: messageText.trim(),
        codeSnippet: attachedSnippet || undefined,
      });

      setMessages((prev) => [...prev, res.message]);
      setMessageText('');
      setAttachedSnippet(null);
    } catch (err: any) {
      showToast(err.message || 'Ошибка отправки сообщения');
    } finally {
      setIsSending(false);
    }
  };

  // Send sticker directly
  const handleSendSticker = async (sticker: Sticker) => {
    try {
      setShowStickerDrawer(false);
      const res = await api.sendMessage({
        channelId: activeRecipient ? undefined : activeChannel,
        recipientId: activeRecipient ? activeRecipient.id : undefined,
        content: '',
        stickerId: sticker.id,
      });

      setMessages((prev) => [...prev, res.message]);
      showToast(`Стикер «${sticker.name}» отправлен`);
    } catch (err: any) {
      showToast(err.message || 'Ошибка отправки стикера');
    }
  };

  // Start editing a message
  const handleStartEdit = (msg: ChatMessage) => {
    setEditingMessageId(msg.id);
    setEditingText(msg.content);
  };

  // Save edited message
  const handleSaveEdit = async () => {
    if (!editingMessageId || !editingText.trim()) return;

    try {
      setIsSavingEdit(true);
      const res = await api.editMessage(editingMessageId, editingText.trim());
      setMessages((prev) =>
        prev.map((m) => (m.id === editingMessageId ? res.message : m))
      );
      setEditingMessageId(null);
      setEditingText('');
      showToast('Сообщение изменено');
    } catch (err: any) {
      showToast(err.message || 'Ошибка сохранения изменений');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingText('');
  };

  // Confirm delete message
  const confirmDeleteMessage = async (forEveryone: boolean) => {
    if (!messageToDelete) return;

    try {
      setIsDeletingMsg(true);
      await api.deleteMessage(messageToDelete.id, forEveryone);
      setMessages((prev) => prev.filter((m) => m.id !== messageToDelete.id));
      setMessageToDelete(null);
      showToast('Сообщение удалено');
    } catch (err: any) {
      showToast(err.message || 'Ошибка удаления сообщения');
    } finally {
      setIsDeletingMsg(false);
    }
  };

  // Toggle emoji reaction
  const handleToggleReaction = async (messageId: string, emoji: string) => {
    try {
      const res = await api.toggleReaction(messageId, emoji);
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? res.message : m))
      );
    } catch (err) {
      console.error('Failed to toggle reaction:', err);
    }
  };

  // Attach code snippet from modal
  const handleAttachSnippet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!snippetCode.trim()) return;
    setAttachedSnippet({
      code: snippetCode.trim(),
      language: snippetLanguage,
    });
    setShowCodeModal(false);
    setSnippetCode('');
  };

  // Copy code snippet to clipboard
  const copySnippet = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter messages by search query
  const filteredMessages = messages.filter((m) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.content.toLowerCase().includes(q) ||
      m.senderName.toLowerCase().includes(q) ||
      (m.codeSnippet && m.codeSnippet.code.toLowerCase().includes(q))
    );
  });

  // Filter team members in direct messages list
  const filteredMembers = teamMembers.filter((m) => {
    if (!memberSearchQuery.trim()) return true;
    const q = memberSearchQuery.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      (m.title && m.title.toLowerCase().includes(q))
    );
  });

  // Filtered stickers for sticker drawer
  const filteredStickers = STICKERS.filter((s) => {
    const matchesCategory = stickerCategory === 'Все' || s.category === stickerCategory;
    const matchesSearch =
      !stickerSearch.trim() ||
      s.name.toLowerCase().includes(stickerSearch.toLowerCase()) ||
      s.text.toLowerCase().includes(stickerSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const stickerCategories = ['Все', 'Разработка', 'Эмоции', 'Релиз & Прод', 'Мемы'];

  return (
    <div className="space-y-4">
      {/* Toast Notice */}
      {toastNotice && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 border border-indigo-500/50 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 font-mono text-xs animate-in slide-in-from-top-4 duration-200">
          <CheckCheck className="w-4 h-4 text-emerald-400" />
          <span>{toastNotice}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-400" />
            Мессенджер Veylor Labs
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Каналы команды, личные чаты между участниками, обмен сниппетами кода и официальные стикеры
          </p>
        </div>

        {/* Global Search across active conversation */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по сообщениям..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Main Chat Layout: Sidebar + Message Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start min-h-[640px]">
        {/* Left: Channels & Members List (Col 4) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Channels Section */}
          <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-3 shadow-lg space-y-2">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400 px-2 block">
              Каналы команды
            </span>
            <div className="space-y-1">
              {channels.map((ch) => {
                const isActive = !activeRecipient && activeChannel === ch.id;
                return (
                  <button
                    key={ch.id}
                    onClick={() => {
                      setActiveRecipient(null);
                      setActiveChannel(ch.id);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition flex items-center justify-between ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Hash className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-indigo-400'}`} />
                      <span className="truncate">{ch.name}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Direct Messages Section */}
          <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-3 shadow-lg space-y-2">
            <div className="flex items-center justify-between px-2">
              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-400" />
                Личные сообщения
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                {teamMembers.length} уч.
              </span>
            </div>

            {/* Member Filter Search */}
            <div className="px-1">
              <input
                type="text"
                value={memberSearchQuery}
                onChange={(e) => setMemberSearchQuery(e.target.value)}
                placeholder="Найти участника..."
                className="w-full px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-[11px] text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
              {filteredMembers.map((member) => {
                const isMe = member.id === user?.id;
                const isActive = activeRecipient?.id === member.id;

                return (
                  <button
                    key={member.id}
                    onClick={() => {
                      setActiveRecipient(member);
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-xl text-xs font-medium transition flex items-center justify-between ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative shrink-0">
                        <img
                          src={
                            member.avatar ||
                            `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(member.name)}`
                          }
                          alt={member.name}
                          className="w-7 h-7 rounded-full bg-slate-800 object-cover border border-slate-700"
                        />
                        <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="block truncate font-semibold text-slate-200">
                            {member.name}
                          </span>
                          {isMe && (
                            <span className="text-[9px] px-1 py-0.2 bg-slate-800 text-slate-400 rounded">
                              вы
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500 block truncate font-mono">
                          {member.title || (member.role === 'owner' ? 'Владелец' : 'Участник')}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}

              {filteredMembers.length === 0 && (
                <div className="py-4 text-center text-slate-500 text-xs">
                  Участники не найдены
                </div>
              )}
            </div>

            {onNavigateToTeam && (
              <div className="pt-2 border-t border-slate-800/80 px-2">
                <button
                  onClick={onNavigateToTeam}
                  className="w-full py-1.5 px-2 bg-slate-800/60 hover:bg-slate-800 text-indigo-300 rounded-lg text-[11px] font-medium transition flex items-center justify-center gap-1.5"
                >
                  <Users className="w-3 h-3" />
                  Управление командой и инвайты
                </button>
              </div>
            )}
          </div>

          {/* Sticker Pack Quick Showcase Card */}
          <div className="bg-slate-900/60 rounded-2xl border border-slate-800/80 p-3.5 shadow-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <Smile className="w-3.5 h-3.5 text-cyan-400" />
                Стикеры Veylor (32 шт.)
              </span>
              <button
                onClick={() => setShowStickerDrawer(true)}
                className="text-[10px] text-indigo-400 hover:text-indigo-300 font-mono"
              >
                Все
              </button>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Киберпанк-набор официальных стикеров для разработчиков.
            </p>
            <div className="grid grid-cols-4 gap-2 pt-1">
              {STICKERS.slice(0, 4).map((stk) => (
                <button
                  key={stk.id}
                  onClick={() => handleSendSticker(stk)}
                  className="p-1 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 transition group flex flex-col items-center"
                  title={`Отправить: ${stk.name}`}
                >
                  <img src={stk.svg} alt={stk.name} className="w-12 h-12 object-contain group-hover:scale-105 transition" />
                  <span className="text-[9px] font-mono text-slate-400 truncate w-full text-center mt-0.5">
                    {stk.text}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Messages Stream & Input (Col 8) */}
        <div className="lg:col-span-8 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-2xl flex flex-col h-[660px] overflow-hidden">
          {/* Conversation Header */}
          <div className="px-5 py-3.5 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {activeRecipient ? (
                <>
                  <div className="relative">
                    <img
                      src={
                        activeRecipient.avatar ||
                        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(activeRecipient.name)}`
                      }
                      alt={activeRecipient.name}
                      className="w-8 h-8 rounded-full bg-slate-800 object-cover border border-slate-700"
                    />
                    <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white flex items-center gap-2">
                      {activeRecipient.name}
                      {activeRecipient.role === 'owner' && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                          <Shield className="w-2.5 h-2.5" />
                          Владелец
                        </span>
                      )}
                    </h2>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Личный чат · {activeRecipient.email}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                    <Hash className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white">
                      #{channels.find((c) => c.id === activeChannel)?.name || activeChannel}
                    </h2>
                    <span className="text-[11px] text-slate-400">
                      {channels.find((c) => c.id === activeChannel)?.desc}
                    </span>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowStickerDrawer(true)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white transition flex items-center gap-1.5 border border-slate-700"
                title="Выбрать стикер"
              >
                <Smile className="w-3.5 h-3.5 text-cyan-400" />
                Стикеры
              </button>

              <button
                onClick={() => setShowCodeModal(true)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1.5 border border-slate-700"
                title="Прикрепить сниппет кода"
              >
                <Code className="w-3.5 h-3.5 text-cyan-400" />
                Сниппет
              </button>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4">
            {filteredMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs text-center py-12">
                <MessageSquare className="w-10 h-10 text-slate-700 mb-2" />
                <span className="text-slate-400 font-medium">В этой переписке пока нет сообщений</span>
                <p className="text-[11px] text-slate-600 mt-1">
                  Напишите сообщение, прикрепите сниппет кода или отправьте стикер
                </p>
                <button
                  onClick={() => setShowStickerDrawer(true)}
                  className="mt-3 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-xl text-xs font-medium transition flex items-center gap-1.5 border border-slate-700"
                >
                  <Smile className="w-3.5 h-3.5" />
                  Открыть стикеры
                </button>
              </div>
            ) : (
              filteredMessages.map((msg) => {
                const isMe = msg.senderId === user?.id;
                const canModify = isMe || user?.role === 'owner';
                const isEditing = editingMessageId === msg.id;
                const stickerData = msg.stickerId ? STICKERS.find((s) => s.id === msg.stickerId) : null;

                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-3 group relative ${
                      isMe ? 'flex-row-reverse' : ''
                    }`}
                  >
                    {/* User Avatar */}
                    <img
                      src={
                        msg.senderAvatar ||
                        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(msg.senderName)}`
                      }
                      alt={msg.senderName}
                      className="w-8 h-8 rounded-full bg-slate-800 object-cover border border-slate-700 shrink-0 mt-0.5"
                    />

                    {/* Message Bubble Container */}
                    <div className={`max-w-[85%] space-y-1.5 ${isMe ? 'items-end' : ''}`}>
                      {/* Sender Info & Time & Edited tag */}
                      <div className={`flex items-center gap-2 text-[11px] ${isMe ? 'justify-end' : ''}`}>
                        <span className="font-semibold text-slate-300">{msg.senderName}</span>
                        {msg.senderRole === 'owner' && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                            Владелец
                          </span>
                        )}
                        <span className="text-slate-600 text-[10px]">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {msg.isEdited && (
                          <span className="text-[10px] text-amber-400 font-mono">
                            (изменено)
                          </span>
                        )}
                      </div>

                      {/* Content Bubble or Inline Edit */}
                      {isEditing ? (
                        <div className="bg-slate-950 border border-indigo-500 rounded-2xl p-3 space-y-2 w-full min-w-[280px]">
                          <input
                            ref={editInputRef}
                            type="text"
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit();
                              if (e.key === 'Escape') handleCancelEdit();
                            }}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-400"
                          />
                          <div className="flex items-center justify-end gap-2 text-[11px]">
                            <button
                              onClick={handleCancelEdit}
                              className="px-2.5 py-1 text-slate-400 hover:text-white transition"
                            >
                              Отмена
                            </button>
                            <button
                              onClick={handleSaveEdit}
                              disabled={isSavingEdit || !editingText.trim()}
                              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition disabled:opacity-50"
                            >
                              {isSavingEdit ? 'Сохранение...' : 'Сохранить'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          className={`rounded-2xl p-3.5 text-xs leading-relaxed space-y-2 shadow-sm ${
                            isMe
                              ? 'bg-indigo-600 text-white rounded-tr-sm'
                              : 'bg-slate-800 text-slate-200 border border-slate-700/60 rounded-tl-sm'
                          }`}
                        >
                          {/* Sticker Rendering */}
                          {stickerData && (
                            <div
                              onClick={() => setEnlargedSticker(stickerData)}
                              className="cursor-pointer group/stk py-1"
                              title="Нажмите для увеличения"
                            >
                              <img
                                src={stickerData.svg}
                                alt={stickerData.name}
                                className="w-32 h-32 object-contain filter drop-shadow-md group-hover/stk:scale-105 transition"
                              />
                            </div>
                          )}

                          {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}

                          {/* Attached Code Snippet */}
                          {msg.codeSnippet && (
                            <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden font-mono text-xs mt-2">
                              <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-[10px] text-slate-400">
                                <span className="text-cyan-400 uppercase font-semibold">
                                  {msg.codeSnippet.language}
                                </span>
                                <div className="flex items-center gap-2">
                                  {onOpenCodeInStudio && (
                                    <button
                                      onClick={() => onOpenCodeInStudio(msg.codeSnippet!)}
                                      className="hover:text-white transition flex items-center gap-1"
                                      title="Открыть в Code Studio"
                                    >
                                      <ExternalLink className="w-3 h-3 text-indigo-400" />
                                      Studio
                                    </button>
                                  )}
                                  <button
                                    onClick={() => copySnippet(msg.codeSnippet!.code, msg.id)}
                                    className="hover:text-white transition flex items-center gap-1"
                                  >
                                    {copiedId === msg.id ? (
                                      <Check className="w-3 h-3 text-emerald-400" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                </div>
                              </div>
                              <pre className="p-3 text-slate-200 overflow-x-auto text-[11px] leading-relaxed max-h-56">
                                <code>{msg.codeSnippet.code}</code>
                              </pre>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Actions Bar: Reactions + Edit / Delete */}
                      <div className={`flex flex-wrap items-center gap-1.5 pt-0.5 ${isMe ? 'justify-end' : ''}`}>
                        {/* Emoji Reactions */}
                        {msg.reactions &&
                          Object.entries(msg.reactions).map(([emoji, userIds]) => {
                            const hasReacted = userIds.includes(user?.id || '');
                            return (
                              <button
                                key={emoji}
                                onClick={() => handleToggleReaction(msg.id, emoji)}
                                className={`px-2 py-0.5 rounded-full text-xs font-mono transition flex items-center gap-1 border ${
                                  hasReacted
                                    ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40 shadow-sm'
                                    : 'bg-slate-800/80 text-slate-400 border-slate-700/60 hover:bg-slate-800 hover:text-slate-200'
                                }`}
                              >
                                <span>{emoji}</span>
                                <span className="text-[10px] font-semibold">{userIds.length}</span>
                              </button>
                            );
                          })}

                        {/* Hover Quick Actions */}
                        <div className="opacity-0 group-hover:opacity-100 transition flex items-center gap-1 bg-slate-900/90 border border-slate-800 rounded-full px-2 py-0.5 shadow">
                          {/* Quick Reactions */}
                          {['🔥', '👍', '❤️', '🚀'].map((em) => (
                            <button
                              key={em}
                              onClick={() => handleToggleReaction(msg.id, em)}
                              className="hover:scale-125 transition px-0.5 text-xs"
                            >
                              {em}
                            </button>
                          ))}

                          {/* Edit Button */}
                          {canModify && msg.content && !msg.stickerId && (
                            <button
                              onClick={() => handleStartEdit(msg)}
                              className="text-slate-400 hover:text-cyan-300 p-1 transition"
                              title="Редактировать сообщение"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          )}

                          {/* Delete Button */}
                          {canModify && (
                            <button
                              onClick={() => setMessageToDelete(msg)}
                              className="text-slate-400 hover:text-rose-400 p-1 transition"
                              title="Удалить сообщение"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Attached Snippet Preview in Input */}
          {attachedSnippet && (
            <div className="px-5 py-2 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
              <span className="flex items-center gap-2 text-cyan-400">
                <Code className="w-3.5 h-3.5" />
                Сниппет ({attachedSnippet.language}): {attachedSnippet.code.split('\n')[0].substring(0, 40)}...
              </span>
              <button
                onClick={() => setAttachedSnippet(null)}
                className="text-slate-500 hover:text-rose-400 transition"
              >
                ✕ Удалить
              </button>
            </div>
          )}

          {/* Chat Input Bar */}
          <form
            onSubmit={handleSendMessage}
            className="p-3.5 bg-slate-950/90 border-t border-slate-800 flex items-center gap-2"
          >
            {/* Sticker Drawer Button */}
            <button
              type="button"
              onClick={() => setShowStickerDrawer(true)}
              className="p-2 rounded-xl text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition"
              title="Открыть стикеры Veylor"
            >
              <Smile className="w-5 h-5" />
            </button>

            {/* Code Snippet Button */}
            <button
              type="button"
              onClick={() => setShowCodeModal(true)}
              className="p-2 rounded-xl text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition"
              title="Прикрепить сниппет кода"
            >
              <Code className="w-5 h-5" />
            </button>

            {/* Input field */}
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder={
                activeRecipient
                  ? `Сообщение для ${activeRecipient.name}...`
                  : `Сообщение в #${channels.find((c) => c.id === activeChannel)?.name || activeChannel}...`
              }
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />

            {/* Submit Send Button */}
            <button
              type="submit"
              disabled={(!messageText.trim() && !attachedSnippet) || isSending}
              className="p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white rounded-xl transition shadow-md shadow-indigo-600/20"
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </form>
        </div>
      </div>

      {/* MODAL: STICKER PACK DRAWER (ALL 32 STICKERS) */}
      {showStickerDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl p-6 shadow-2xl relative flex flex-col max-h-[85vh]">
            <button
              onClick={() => setShowStickerDrawer(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <Smile className="w-5 h-5 text-cyan-400" />
              <h3 className="text-lg font-bold text-white">Официальные стикеры Veylor Labs</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Выберите стикер для мгновенной отправки в{' '}
              <span className="text-cyan-400 font-mono">
                {activeRecipient ? activeRecipient.name : `#${channels.find((c) => c.id === activeChannel)?.name || activeChannel}`}
              </span>
            </p>

            {/* Category Filter and Search */}
            <div className="flex flex-col sm:flex-row gap-2.5 mb-4">
              <div className="flex flex-wrap gap-1.5 flex-1">
                {stickerCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setStickerCategory(cat)}
                    className={`px-3 py-1 rounded-xl text-xs font-mono transition ${
                      stickerCategory === cat
                        ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-48">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
                <input
                  type="text"
                  value={stickerSearch}
                  onChange={(e) => setStickerSearch(e.target.value)}
                  placeholder="Поиск стикера..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            {/* Stickers Grid */}
            <div className="flex-1 overflow-y-auto grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 p-1">
              {filteredStickers.map((stk) => (
                <button
                  key={stk.id}
                  onClick={() => handleSendSticker(stk)}
                  className="p-2 rounded-2xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-cyan-400/60 transition group flex flex-col items-center justify-between text-center"
                >
                  <img
                    src={stk.svg}
                    alt={stk.name}
                    className="w-20 h-20 object-contain group-hover:scale-110 transition filter drop-shadow"
                  />
                  <span className="text-[11px] font-bold text-slate-200 mt-2 block truncate w-full">
                    {stk.text}
                  </span>
                  <span className="text-[9px] font-mono text-slate-500 block truncate w-full">
                    {stk.category}
                  </span>
                </button>
              ))}

              {filteredStickers.length === 0 && (
                <div className="col-span-full py-12 text-center text-slate-500 text-xs">
                  Стикеры не найдены по запросу «{stickerSearch}»
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ENLARGED STICKER PREVIEW */}
      {enlargedSticker && (
        <div
          onClick={() => setEnlargedSticker(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-cyan-500/40 rounded-3xl p-6 shadow-2xl flex flex-col items-center max-w-sm"
          >
            <img src={enlargedSticker.svg} alt={enlargedSticker.name} className="w-56 h-56 object-contain" />
            <h4 className="text-lg font-bold text-white mt-4 font-mono">{enlargedSticker.text}</h4>
            <p className="text-xs text-slate-400 mt-1">{enlargedSticker.name} · {enlargedSticker.category}</p>
            <button
              onClick={() => setEnlargedSticker(null)}
              className="mt-5 px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-medium transition"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}

      {/* MODAL: DELETE MESSAGE CONFIRMATION */}
      {messageToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Удалить сообщение?</h3>
                <p className="text-xs text-slate-400">Выберите область удаления</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800">
              {messageToDelete.content ? `«${messageToDelete.content}»` : 'Стикер или код'}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setMessageToDelete(null)}
                className="w-full sm:w-auto px-4 py-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
              >
                Отмена
              </button>
              <button
                type="button"
                disabled={isDeletingMsg}
                onClick={() => confirmDeleteMessage(false)}
                className="w-full sm:w-auto px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium transition"
              >
                Только для меня
              </button>
              <button
                type="button"
                disabled={isDeletingMsg}
                onClick={() => confirmDeleteMessage(true)}
                className="w-full sm:w-auto px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold transition shadow-md shadow-rose-600/20"
              >
                Удалить для всех
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CODE ATTACHMENT */}
      {showCodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative">
            <button
              onClick={() => setShowCodeModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-1">
              Прикрепить сниппет кода
            </h3>
            <p className="text-xs text-slate-400 mb-4 font-mono">
              Фрагмент будет отображен с подсветкой и возможностью копирования
            </p>

            <form onSubmit={handleAttachSnippet} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Язык программирования
                </label>
                <select
                  value={snippetLanguage}
                  onChange={(e) => setSnippetLanguage(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="typescript">TypeScript</option>
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="html">HTML</option>
                  <option value="css">CSS</option>
                  <option value="sql">SQL</option>
                  <option value="json">JSON</option>
                  <option value="markdown">Markdown</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Код
                </label>
                <textarea
                  rows={8}
                  required
                  value={snippetCode}
                  onChange={(e) => setSnippetCode(e.target.value)}
                  placeholder="Вставьте исходный код сюда..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCodeModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition shadow-md shadow-indigo-600/20"
                >
                  Прикрепить к сообщению
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
