import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  User as UserIcon,
  Shield,
  KeyRound,
  Mail,
  CheckCircle2,
  AlertCircle,
  X,
  Camera,
  Upload,
  Send,
  Github,
  MessageSquare,
  Lock,
  Eye,
  EyeOff,
  Moon,
  Trash2,
} from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Curated dark nocturnal aesthetic avatars
const NOCTURNAL_PRESET_AVATARS = [
  {
    name: 'Кибер-Ночь',
    url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=250&auto=format&fit=crop&q=80',
  },
  {
    name: 'Темный Обсидиан',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=250&auto=format&fit=crop&q=80',
  },
  {
    name: 'Неоновый Нуар',
    url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=250&auto=format&fit=crop&q=80',
  },
  {
    name: 'Темный Силуэт',
    url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=250&auto=format&fit=crop&q=80',
  },
  {
    name: 'Глубокая Ночь',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=250&auto=format&fit=crop&q=80',
  },
  {
    name: 'Космос & Тень',
    url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=250&auto=format&fit=crop&q=80',
  },
  {
    name: 'Фиолетовый Неон',
    url: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=250&auto=format&fit=crop&q=80',
  },
  {
    name: 'Ночной Страж',
    url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=250&auto=format&fit=crop&q=80',
  },
];

// Helper: processes image directly from user computer, crops square, and optimizes size
function processLocalImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Пожалуйста, выберите файл изображения (PNG, JPG, WEBP, GIF)'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const targetSize = 256;
        canvas.width = targetSize;
        canvas.height = targetSize;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        // Center-crop to square
        const minDim = Math.min(img.width, img.height);
        const sx = (img.width - minDim) / 2;
        const sy = (img.height - minDim) / 2;

        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, targetSize, targetSize);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
        resolve(compressedDataUrl);
      };
      img.onerror = () => reject(new Error('Не удалось обработать изображение'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Ошибка чтения файла с компьютера'));
    reader.readAsDataURL(file);
  });
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, updateProfile, changePassword } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'info' | 'contacts' | 'security'>('info');

  // Profile fields
  const [name, setName] = useState(user?.name || '');
  const [title, setTitle] = useState(user?.title || '');
  const [avatar, setAvatar] = useState(
    user?.avatar || NOCTURNAL_PRESET_AVATARS[0].url
  );
  const [bio, setBio] = useState(user?.bio || '');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  // Contacts
  const [telegram, setTelegram] = useState(user?.contacts?.telegram || '');
  const [github, setGithub] = useState(user?.contacts?.github || '');
  const [discord, setDiscord] = useState(user?.contacts?.discord || '');

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  // File upload handler
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    setErrorMessage(null);
    try {
      const dataUrl = await processLocalImageFile(file);
      setAvatar(dataUrl);
      setUploadedFileName(file.name);
    } catch (err: any) {
      setErrorMessage(err.message || 'Ошибка загрузки файла');
    } finally {
      setIsProcessingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    setErrorMessage(null);
    try {
      const dataUrl = await processLocalImageFile(file);
      setAvatar(dataUrl);
      setUploadedFileName(file.name);
    } catch (err: any) {
      setErrorMessage(err.message || 'Ошибка загрузки файла');
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSaving(true);

    try {
      const res = await updateProfile({
        name: name.trim(),
        title: title.trim(),
        avatar: avatar.trim(),
        bio: bio.trim(),
        contacts: {
          telegram: telegram.trim(),
          github: github.trim(),
          discord: discord.trim(),
        },
      });

      if (res.success) {
        setSuccessMessage('Профиль успешно сохранен');
      } else {
        setErrorMessage(res.error || 'Ошибка сохранения профиля');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (newPassword !== confirmPassword) {
      setErrorMessage('Новые пароли не совпадают');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('Новый пароль должен содержать минимум 6 символов');
      return;
    }

    setIsSaving(true);
    try {
      const res = await changePassword({
        currentPassword,
        newPassword,
      });

      if (res.success) {
        setSuccessMessage('Пароль успешно изменен');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setErrorMessage(res.error || 'Ошибка смены пароля');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-950/60 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Настройки профиля
                <span className="text-[11px] font-mono text-indigo-400 font-normal">
                  · Темный стиль
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Загрузка фото с компьютера, выбор ночного аватара и управление данными
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs Bar */}
        <div className="flex border-b border-slate-800 bg-slate-950/30 px-6">
          <button
            onClick={() => {
              setActiveTab('info');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'info'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserIcon className="w-3.5 h-3.5" />
            Личные данные & Аватар
          </button>

          <button
            onClick={() => {
              setActiveTab('contacts');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'contacts'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            Контакты
          </button>

          <button
            onClick={() => {
              setActiveTab('security');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'security'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            Безопасность & Пароль
          </button>
        </div>

        {/* Notifications */}
        <div className="px-6 pt-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'info' && (
            <form id="profile-form" onSubmit={handleSaveProfile} className="space-y-6">
              {/* Avatar Section: Upload from Computer + Dark Night Presets */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <Moon className="w-3.5 h-3.5 text-indigo-400" />
                    Аватар в темном ночном стиле
                  </label>
                  <span className="text-[11px] text-slate-500 font-mono">256 × 256 px</span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-5">
                  {/* Current Avatar Preview with Dark Glow */}
                  <div className="relative shrink-0 group">
                    <img
                      src={avatar}
                      alt={name || 'Avatar'}
                      className="w-20 h-20 rounded-2xl bg-slate-950 border-2 border-indigo-500/50 object-cover shadow-xl shadow-indigo-950/60 ring-2 ring-slate-900"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 bg-slate-950/70 rounded-2xl flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition cursor-pointer backdrop-blur-xs"
                      title="Загрузить новое фото"
                    >
                      <Camera className="w-5 h-5 mb-0.5 text-indigo-400" />
                      <span className="text-[9px] font-medium">Сменить</span>
                    </button>
                  </div>

                  {/* Upload Box: Direct from Computer (No links!) */}
                  <div className="flex-1 w-full">
                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDraggingFile(true);
                      }}
                      onDragLeave={() => setIsDraggingFile(false)}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl p-3.5 text-center cursor-pointer transition flex flex-col items-center justify-center gap-1 ${
                        isDraggingFile
                          ? 'border-indigo-400 bg-indigo-950/30'
                          : 'border-slate-800 hover:border-indigo-500/50 bg-slate-900/50 hover:bg-slate-900'
                      }`}
                    >
                      <Upload className="w-4 h-4 text-indigo-400 mb-0.5" />
                      <div className="text-xs font-semibold text-slate-200">
                        {isProcessingFile
                          ? 'Обработка изображения...'
                          : uploadedFileName
                          ? `Загружено: ${uploadedFileName}`
                          : 'Загрузить фото с компьютера'}
                      </div>
                      <p className="text-[10px] text-slate-500">
                        Нажмите для выбора файла или перетащите сюда (PNG, JPG, WEBP)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Dark Nocturnal Presets Palette */}
                <div className="pt-2 border-t border-slate-900">
                  <div className="text-[11px] text-slate-400 mb-2 flex items-center justify-between">
                    <span>Или выберите готовый ночной арт-аватар:</span>
                    <span className="text-indigo-400 font-mono text-[10px]">Nocturnal Edition</span>
                  </div>

                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                    {NOCTURNAL_PRESET_AVATARS.map((preset, idx) => {
                      const isSelected = avatar === preset.url;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setAvatar(preset.url);
                            setUploadedFileName(null);
                          }}
                          className={`relative aspect-square rounded-xl overflow-hidden border-2 transition group ${
                            isSelected
                              ? 'border-indigo-400 ring-2 ring-indigo-500/50 scale-105 shadow-lg shadow-indigo-950'
                              : 'border-slate-800 hover:border-slate-600 opacity-70 hover:opacity-100'
                          }`}
                          title={preset.name}
                        >
                          <img
                            src={preset.url}
                            alt={preset.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                          {isSelected && (
                            <div className="absolute inset-0 bg-indigo-600/20 flex items-center justify-center">
                              <span className="w-2 h-2 rounded-full bg-indigo-400 shadow" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Name & Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Имя и фамилия
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Должность / Специализация
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Например: Владелец платформы & Lead Architect"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  О себе / Фокус в проекте
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Опишите ваши ключевые зоны ответственности и цели..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              {/* Readonly info */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1.5 font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Email:</span>
                  <span className="text-slate-200">{user.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Роль в платформе:</span>
                  <span className="font-semibold text-indigo-400">
                    {user.role === 'owner' ? 'Владелец (Owner)' : 'Участник (Member)'}
                  </span>
                </div>
              </div>
            </form>
          )}

          {activeTab === 'contacts' && (
            <form id="contacts-form" onSubmit={handleSaveProfile} className="space-y-4">
              <p className="text-xs text-slate-400 mb-4">
                Укажите ваши каналы связи для быстрого контакта с участниками команды Veylor:
              </p>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 text-sky-400" />
                  Telegram
                </label>
                <input
                  type="text"
                  value={telegram}
                  onChange={(e) => setTelegram(e.target.value)}
                  placeholder="@username"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                  <Github className="w-3.5 h-3.5 text-slate-300" />
                  GitHub профиль
                </label>
                <input
                  type="text"
                  value={github}
                  onChange={(e) => setGithub(e.target.value)}
                  placeholder="username"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                  Discord
                </label>
                <input
                  type="text"
                  value={discord}
                  onChange={(e) => setDiscord(e.target.value)}
                  placeholder="username#0000"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </form>
          )}

          {activeTab === 'security' && (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <p className="text-xs text-slate-400 mb-2">
                Смена пароля доступа к платформе Veylor Hub.
              </p>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Текущий пароль
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Новый пароль
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Минимум 6 символов"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Подтвердите новый пароль
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Повторите новый пароль"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition shadow-lg shadow-indigo-600/20"
                >
                  {isSaving ? 'Обновление пароля...' : 'Обновить пароль'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 font-mono">
            Veylor Security · Профиль верифицирован
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition"
            >
              Закрыть
            </button>

            {activeTab !== 'security' && (
              <button
                type="submit"
                form={activeTab === 'info' ? 'profile-form' : 'contacts-form'}
                disabled={isSaving}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition shadow-md shadow-indigo-600/20"
              >
                {isSaving ? 'Сохранение...' : 'Сохранить профиль'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
