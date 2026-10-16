import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api.ts';
import { User, Invite, AuditLog, UserRole, UserPermissions } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  UserPlus,
  Users,
  Shield,
  Clock,
  CheckCircle2,
  XCircle,
  Copy,
  Trash2,
  Edit2,
  AlertTriangle,
  History,
  Mail,
  ShieldAlert,
  X,
  ExternalLink,
  UserCheck,
} from 'lucide-react';

export const TeamManagement: React.FC = () => {
  const { user: currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'members' | 'pending_regs' | 'invites' | 'audit'>('members');
  const [members, setMembers] = useState<User[]>([]);
  const [pendingRegs, setPendingRegs] = useState<User[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Invite modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('member');
  const [invitePermissions, setInvitePermissions] = useState<UserPermissions>({
    canManageTasks: true,
    canCreateProjects: false,
    canPostUpdates: true,
  });
  const [inviteNotes, setInviteNotes] = useState('');
  const [createdInviteResult, setCreatedInviteResult] = useState<{ invite: Invite; inviteLink: string } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Edit member modal
  const [editingMember, setEditingMember] = useState<User | null>(null);
  const [editRole, setEditRole] = useState<UserRole>('member');
  const [editPermissions, setEditPermissions] = useState<UserPermissions>({
    canManageTasks: true,
    canCreateProjects: false,
    canPostUpdates: true,
  });

  // Remove confirmation modal
  const [memberToRemove, setMemberToRemove] = useState<User | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [membersRes, invitesRes, auditRes] = await Promise.all([
        api.getTeamMembers(),
        api.getInvites(),
        api.getAuditLogs(),
      ]);
      setMembers(membersRes.members);
      setPendingRegs(membersRes.pendingRegistrations || []);
      setInvites(invitesRes.invites);
      setAuditLogs(auditRes.logs);
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки данных управления командой');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await api.createInvite({
        email: inviteEmail.trim(),
        role: inviteRole,
        permissions: invitePermissions,
        notes: inviteNotes.trim(),
      });
      setCreatedInviteResult({
        invite: res.invite,
        inviteLink: res.inviteLink,
      });
      setSuccess(`Приглашение создано для ${inviteEmail}`);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Не удалось создать приглашение');
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    if (!window.confirm('Вы уверены, что хотите отозвать это приглашение? Пользователь не сможет получить доступ по этой ссылке.')) {
      return;
    }
    try {
      await api.revokeInvite(inviteId);
      setSuccess('Приглашение успешно отозвано');
      loadData();
    } catch (err: any) {
      setError(err.message || 'Ошибка отзыва приглашения');
    }
  };

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;
    try {
      await api.removeMember(memberToRemove.id);
      setSuccess(`Участник ${memberToRemove.name} исключен из команды. Доступ немедленно отозван.`);
      setMemberToRemove(null);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Ошибка исключения участника');
    }
  };

  const handleSaveMemberRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    try {
      await api.updateMemberRole(editingMember.id, {
        role: editRole,
        permissions: editPermissions,
      });
      setSuccess(`Права участника ${editingMember.name} обновлены`);
      setEditingMember(null);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Ошибка обновления прав');
    }
  };

  const handleApprovePending = async (pendingUser: User, role: UserRole = 'member') => {
    try {
      await api.approvePendingUser(pendingUser.id, role);
      setSuccess(`Пользователь ${pendingUser.name} добавлен в команду!`);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Не удалось одобрить пользователя');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const pendingInvitesCount = invites.filter((i) => i.status === 'pending').length;
  const acceptedInvitesCount = invites.filter((i) => i.status === 'accepted').length;
  const revokedInvitesCount = invites.filter((i) => i.status === 'revoked').length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Управление командой</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Владелец платформы
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Закрытый раздел: приглашение участников, управление ролями, отзыв доступов и журнал аудита.
          </p>
        </div>

        <button
          onClick={() => {
            setShowInviteModal(true);
            setCreatedInviteResult(null);
            setInviteEmail('');
            setInviteNotes('');
            setError(null);
          }}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition flex items-center gap-2 shadow-lg shadow-indigo-600/20 shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          Пригласить участника
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess(null)} className="text-emerald-400 hover:text-emerald-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
            <span>Действующие участники</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">{members.length}</div>
          <div className="text-[11px] text-emerald-400 mt-1">Доступ к контуру активен</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
            <span>Ожидают в очереди</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white">{pendingRegs.length}</div>
          <div className="text-[11px] text-amber-400 mt-1">Зарегистрированы без инвайта</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
            <span>Инвайты в ожидании</span>
            <Mail className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white">{pendingInvitesCount}</div>
          <div className="text-[11px] text-indigo-400 mt-1">Отправлены ссылки</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
            <span>Отозвано / Закрыто</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-white">{revokedInvitesCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Доступ запрещен</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 space-x-1">
        <button
          onClick={() => setActiveTab('members')}
          className={`py-3 px-4 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'members'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          Участники команды ({members.length})
        </button>

        <button
          onClick={() => setActiveTab('pending_regs')}
          className={`py-3 px-4 text-sm font-semibold border-b-2 transition flex items-center gap-2 relative ${
            activeTab === 'pending_regs'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          Ожидают подтверждения ({pendingRegs.length})
          {pendingRegs.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping ml-1" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('invites')}
          className={`py-3 px-4 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'invites'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Mail className="w-4 h-4" />
          Приглашения ({invites.length})
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`py-3 px-4 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'audit'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <History className="w-4 h-4" />
          Журнал аудита ({auditLogs.length})
        </button>
      </div>

      {/* TAB 1: ACTIVE MEMBERS */}
      {activeTab === 'members' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/70 text-slate-400 text-xs font-mono uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Участник</th>
                  <th className="py-3 px-4">Роль</th>
                  <th className="py-3 px-4">Разрешения</th>
                  <th className="py-3 px-4">Дата вступления</th>
                  <th className="py-3 px-4 text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {members.map((member) => {
                  const isSelf = member.id === currentUser?.id;
                  return (
                    <tr key={member.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={member.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(member.name)}`}
                            alt={member.name}
                            className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 object-cover"
                          />
                          <div>
                            <div className="font-semibold text-white flex items-center gap-1.5">
                              {member.name}
                              {isSelf && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-mono">
                                  Вы
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400 font-mono">{member.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {member.role === 'owner' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                            <Shield className="w-3.5 h-3.5 text-indigo-400" />
                            Владелец
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            Участник
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 text-[11px]">
                          {member.permissions?.canManageTasks && (
                            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                              Задачи
                            </span>
                          )}
                          {member.permissions?.canCreateProjects && (
                            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                              Проекты
                            </span>
                          )}
                          {member.permissions?.canPostUpdates && (
                            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                              Новости
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-400 font-mono">
                        {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString('ru-RU') : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditingMember(member);
                              setEditRole(member.role || 'member');
                              setEditPermissions(member.permissions || {
                                canManageTasks: true,
                                canCreateProjects: false,
                                canPostUpdates: true,
                              });
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                            title="Изменить роль и разрешения"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {!isSelf && (
                            <button
                              onClick={() => setMemberToRemove(member)}
                              className="p-1.5 rounded-lg text-rose-400 hover:text-rose-200 hover:bg-rose-500/10 transition"
                              title="Исключить из команды"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: PENDING REGISTRATIONS (Users in the Waiting Room) */}
      {activeTab === 'pending_regs' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
            <Clock className="w-4 h-4 shrink-0" />
            <span>
              Пользователи в этом списке зарегистрировались через публичный сайт, но находятся на экране «Ожидание приглашения». Они не имеют доступа к проектам и задачам, пока вы не одобрите их заявку.
            </span>
          </div>

          {pendingRegs.length === 0 ? (
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
              <Users className="w-10 h-10 mx-auto mb-3 text-slate-600" />
              <p className="font-medium text-slate-300">Нет пользователей в очереди ожидания</p>
              <p className="text-xs text-slate-500 mt-1">
                Все зарегистрированные аккаунты уже верифицированы.
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {pendingRegs.map((pending) => (
                <div
                  key={pending.id}
                  className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-sm">
                      {pending.name.substring(0, 1)}
                    </div>
                    <div>
                      <div className="font-semibold text-white">{pending.name}</div>
                      <div className="text-xs text-slate-400 font-mono">{pending.email}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Зарегистрирован: {new Date(pending.createdAt).toLocaleString('ru-RU')}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApprovePending(pending, 'member')}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      Одобрить как Участника
                    </button>
                    <button
                      onClick={() => handleApprovePending(pending, 'owner')}
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      Одобрить как Владельца
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: INVITES LIST */}
      {activeTab === 'invites' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/70 text-slate-400 text-xs font-mono uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Кому (Email)</th>
                  <th className="py-3 px-4">Роль</th>
                  <th className="py-3 px-4">Статус приглашения</th>
                  <th className="py-3 px-4">Код / Ссылка</th>
                  <th className="py-3 px-4">Дата создания</th>
                  <th className="py-3 px-4 text-right">Действие</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {invites.map((invite) => {
                  const inviteUrl = `${window.location.origin}/?invite=${invite.token}`;
                  return (
                    <tr key={invite.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{invite.email}</div>
                        {invite.notes && (
                          <div className="text-xs text-slate-400 mt-0.5">{invite.notes}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {invite.role === 'owner' ? 'Владелец' : 'Участник'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {invite.status === 'pending' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
                            <Clock className="w-3.5 h-3.5 text-amber-400" />
                            Ожидает принятия
                          </span>
                        )}
                        {invite.status === 'accepted' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            Принято
                          </span>
                        )}
                        {invite.status === 'revoked' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-300 border border-rose-500/20">
                            <XCircle className="w-3.5 h-3.5 text-rose-400" />
                            Отозвано
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <code className="text-xs font-mono bg-slate-950 px-2 py-1 rounded text-indigo-300 border border-slate-800 max-w-[140px] truncate">
                            {invite.token}
                          </code>
                          {invite.status === 'pending' && (
                            <button
                              onClick={() => copyToClipboard(inviteUrl)}
                              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
                              title="Скопировать ссылку"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-400 font-mono">
                        {new Date(invite.createdAt).toLocaleDateString('ru-RU')}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {invite.status === 'pending' && (
                          <button
                            onClick={() => handleRevokeInvite(invite.id)}
                            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 transition"
                          >
                            Отозвать
                          </button>
                        )}
                        {invite.status === 'revoked' && (
                          <span className="text-xs text-slate-500 italic">Недействительно</span>
                        )}
                        {invite.status === 'accepted' && (
                          <span className="text-xs text-emerald-400 font-mono">
                            {invite.acceptedAt ? new Date(invite.acceptedAt).toLocaleDateString('ru-RU') : 'Активировано'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT LOG */}
      {activeTab === 'audit' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-400" />
              Журнал аудита действий с доступом и безопасностью
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              Фиксация всех выданных и отозванных прав
            </span>
          </div>

          <div className="space-y-2">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start justify-between gap-4 text-xs font-mono"
              >
                <div>
                  <div className="text-slate-300 font-medium">{log.details}</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">
                    Инициатор: <span className="text-slate-400">{log.actorName}</span> • Действие: {log.action}
                  </div>
                </div>
                <div className="text-slate-500 text-[11px] shrink-0">
                  {new Date(log.timestamp).toLocaleString('ru-RU')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: INVITE MEMBER */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
            <button
              onClick={() => setShowInviteModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                <UserPlus className="w-4 h-4" />
              </div>
              <h3 className="text-xl font-bold text-white">Пригласить нового участника</h3>
            </div>

            <p className="text-xs text-slate-400 mb-6">
              Создайте приглашение с уникальным защищенным токеном. Пользователь сможет получить доступ к Veylor Hub только после принятия.
            </p>

            {createdInviteResult ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm">
                  <div className="font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Приглашение успешно сгенерировано!
                  </div>
                  <p className="text-xs text-emerald-200/80 mt-1">
                    Передайте эту персональную ссылку сотруднику:
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                    Персональная ссылка-инвайт
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={createdInviteResult.inviteLink}
                      className="w-full bg-transparent text-xs text-indigo-300 font-mono outline-none select-all"
                    />
                    <button
                      onClick={() => copyToClipboard(createdInviteResult.inviteLink)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition shrink-0 flex items-center gap-1.5"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      {copiedLink ? 'Скопировано!' : 'Копировать'}
                    </button>
                  </div>
                </div>

                <div className="text-xs text-slate-400 bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
                  <span className="font-semibold text-slate-300">Код приглашения:</span>{' '}
                  <span className="font-mono text-indigo-400">{createdInviteResult.invite.token}</span>
                  <br />
                  <span className="font-semibold text-slate-300">Email:</span> {createdInviteResult.invite.email}
                  <br />
                  <span className="font-semibold text-slate-300">Роль:</span>{' '}
                  {createdInviteResult.invite.role === 'owner' ? 'Владелец' : 'Участник'}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowInviteModal(false);
                    setCreatedInviteResult(null);
                  }}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-semibold transition"
                >
                  Готово
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateInvite} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Email адрес приглашаемого
                  </label>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@domain.com"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Роль в команде
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setInviteRole('member');
                        setInvitePermissions((prev) => ({ ...prev, canCreateProjects: false }));
                      }}
                      className={`p-3 rounded-xl border text-left transition ${
                        inviteRole === 'member'
                          ? 'bg-indigo-600/10 border-indigo-500 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-sm font-semibold text-white">Участник</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Доступ к пространству, проектам и задачам
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setInviteRole('owner');
                        setInvitePermissions({
                          canManageTasks: true,
                          canCreateProjects: true,
                          canPostUpdates: true,
                        });
                      }}
                      className={`p-3 rounded-xl border text-left transition ${
                        inviteRole === 'owner'
                          ? 'bg-indigo-600/10 border-indigo-500 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-sm font-semibold text-white">Владелец</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Полный доступ к управлению командой и настройкам
                      </div>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-2">
                    Разрешения в Veylor Hub
                  </label>
                  <div className="space-y-2 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                    <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={invitePermissions.canManageTasks}
                        onChange={(e) =>
                          setInvitePermissions((prev) => ({ ...prev, canManageTasks: e.target.checked }))
                        }
                        className="rounded border-slate-700 text-indigo-600 focus:ring-0"
                      />
                      <span>Работа с задачами в Veylor Flow</span>
                    </label>

                    <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={invitePermissions.canCreateProjects}
                        onChange={(e) =>
                          setInvitePermissions((prev) => ({ ...prev, canCreateProjects: e.target.checked }))
                        }
                        className="rounded border-slate-700 text-indigo-600 focus:ring-0"
                      />
                      <span>Создание и редактирование проектов</span>
                    </label>

                    <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={invitePermissions.canPostUpdates}
                        onChange={(e) =>
                          setInvitePermissions((prev) => ({ ...prev, canPostUpdates: e.target.checked }))
                        }
                        className="rounded border-slate-700 text-indigo-600 focus:ring-0"
                      />
                      <span>Публикация новостей и объявлений</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Комментарий / Заметка (опционально)
                  </label>
                  <input
                    type="text"
                    value={inviteNotes}
                    onChange={(e) => setInviteNotes(e.target.value)}
                    placeholder="Например: Старший инженер по инфраструктуре"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="px-4 py-2 text-sm text-slate-400 hover:text-white transition"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition shadow-lg shadow-indigo-600/20"
                  >
                    Сгенерировать приглашение
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL: EDIT MEMBER */}
      {editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setEditingMember(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-1">
              Редактирование прав доступа
            </h3>
            <p className="text-xs text-slate-400 mb-6 font-mono">
              {editingMember.name} ({editingMember.email})
            </p>

            <form onSubmit={handleSaveMemberRole} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Роль участника
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="member">Участник (Member)</option>
                  <option value="owner">Владелец (Owner)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">
                  Гранулярные разрешения
                </label>
                <div className="space-y-2 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editPermissions.canManageTasks}
                      onChange={(e) =>
                        setEditPermissions((prev) => ({ ...prev, canManageTasks: e.target.checked }))
                      }
                      className="rounded border-slate-700 text-indigo-600 focus:ring-0"
                    />
                    <span>Управление задачами в Veylor Flow</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editPermissions.canCreateProjects}
                      onChange={(e) =>
                        setEditPermissions((prev) => ({ ...prev, canCreateProjects: e.target.checked }))
                      }
                      className="rounded border-slate-700 text-indigo-600 focus:ring-0"
                    />
                    <span>Создание проектов</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editPermissions.canPostUpdates}
                      onChange={(e) =>
                        setEditPermissions((prev) => ({ ...prev, canPostUpdates: e.target.checked }))
                      }
                      className="rounded border-slate-700 text-indigo-600 focus:ring-0"
                    />
                    <span>Публикация новостей команды</span>
                  </label>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white transition"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition"
                >
                  Сохранить изменения
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REMOVE CONFIRMATION */}
      {memberToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-rose-500/30 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-bold text-white mb-2">
              Исключить из команды?
            </h3>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Вы собираетесь исключить{' '}
              <span className="font-semibold text-white">{memberToRemove.name}</span> ({memberToRemove.email}).
            </p>

            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/20 text-rose-300 text-xs mb-6">
              ⚠️ Доступ пользователя к закрытому пространству Veylor Hub будет{' '}
              <strong>немедленно заблокирован</strong> на сервере. При открытых вкладках его сессия сразу вернется на экран «Ожидание приглашения».
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setMemberToRemove(null)}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white transition"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleRemoveMember}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-semibold transition shadow-lg shadow-rose-600/20"
              >
                Исключить и отозвать доступ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
