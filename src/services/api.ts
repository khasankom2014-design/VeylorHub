import { User, Invite, Project, Task, TeamUpdate, AuditLog, UserRole, UserPermissions, ChatMessage, CodeFile } from '../types.ts';
import { localStore } from './localStore.ts';

const TOKEN_KEY = 'veylor_auth_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

async function apiFetch<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (!options.skipAuth) {
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('text/html')) {
    // When hosted on static/Apache hosting (InfinityFree) without Node.js backend, API calls redirect to index.html
    throw new ApiError('STATIC_HOST_REDIRECT', 404, 'STATIC_HOST_REDIRECT');
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(
      data.message || data.error || 'Произошла непредвиденная ошибка запроса',
      response.status,
      data.error
    );
  }

  return data as T;
}

function isStaticHostFallback(err: any): boolean {
  return (
    err?.code === 'STATIC_HOST_REDIRECT' ||
    err?.message === 'STATIC_HOST_REDIRECT' ||
    err?.name === 'TypeError' ||
    err?.status === 404 ||
    (err instanceof TypeError && err.message.includes('fetch'))
  );
}

export const api = {
  // Auth
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    try {
      const res = await apiFetch<{ token: string; user: User }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        skipAuth: true,
      });
      setToken(res.token);
      return res;
    } catch (err: any) {
      if (isStaticHostFallback(err)) {
        const res = localStore.login(email, password);
        setToken(res.token);
        return res;
      }
      throw err;
    }
  },

  async register(data: { name: string; email: string; password: string; inviteToken?: string }): Promise<{ token: string; user: User; message: string }> {
    try {
      const res = await apiFetch<{ token: string; user: User; message: string }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
        skipAuth: true,
      });
      setToken(res.token);
      return res;
    } catch (err: any) {
      if (isStaticHostFallback(err)) {
        const res = localStore.register(data);
        setToken(res.token);
        return res;
      }
      throw err;
    }
  },

  async getMe(): Promise<{ user: User }> {
    try {
      return await apiFetch<{ user: User }>('/api/auth/me');
    } catch (err: any) {
      if (isStaticHostFallback(err)) {
        const user = localStore.getCurrentUser();
        if (!user) {
          throw new ApiError('Не авторизован', 401, 'UNAUTHORIZED');
        }
        return { user };
      }
      throw err;
    }
  },

  async logout(): Promise<void> {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    } finally {
      clearToken();
      localStore.logout();
    }
  },

  async getInviteInfo(token: string): Promise<{ email: string; role: UserRole; status: string; createdByName: string; notes?: string }> {
    try {
      return await apiFetch(`/api/auth/invite-info?token=${encodeURIComponent(token)}`, { skipAuth: true });
    } catch (err: any) {
      if (isStaticHostFallback(err)) {
        const inv = localStore.getInvites().invites.find((i) => i.token === token.trim());
        if (inv) {
          return {
            email: inv.email,
            role: inv.role,
            status: inv.status,
            createdByName: inv.createdByName,
            notes: inv.notes,
          };
        }
      }
      throw err;
    }
  },

  async acceptInvite(token: string): Promise<{ success: boolean; user: User; message: string }> {
    try {
      return await apiFetch<{ success: boolean; user: User; message: string }>('/api/auth/accept-invite', {
        method: 'POST',
        body: JSON.stringify({ token }),
      });
    } catch (err: any) {
      if (isStaticHostFallback(err)) {
        const res = localStore.acceptInvite(token);
        return { success: true, user: res.user, message: res.message };
      }
      throw err;
    }
  },

  async updateProfile(data: { name?: string; title?: string; avatar?: string; bio?: string; contacts?: { telegram?: string; github?: string; discord?: string } }): Promise<{ success: boolean; user: User; message: string }> {
    try {
      return await apiFetch<{ success: boolean; user: User; message: string }>('/api/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    } catch (err: any) {
      if (isStaticHostFallback(err)) {
        const res = localStore.updateProfile(data);
        return { success: true, user: res.user, message: res.message };
      }
      throw err;
    }
  },

  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<{ success: boolean; message: string }> {
    try {
      return await apiFetch<{ success: boolean; message: string }>('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (err: any) {
      if (isStaticHostFallback(err)) {
        return { success: true, message: localStore.changePassword(data).message };
      }
      throw err;
    }
  },

  async resetDemo(): Promise<{ success: boolean; message: string }> {
    try {
      return await apiFetch<{ success: boolean; message: string }>('/api/auth/reset-demo', {
        method: 'POST',
        skipAuth: true,
      });
    } catch {
      localStorage.clear();
      return { success: true, message: 'Данные сброшены' };
    }
  },

  // Team Management
  async getTeamMembers(): Promise<{ members: User[]; pendingRegistrations?: User[] }> {
    try {
      return await apiFetch<{ members: User[]; pendingRegistrations?: User[] }>('/api/team/members');
    } catch (err: any) {
      if (isStaticHostFallback(err)) {
        return localStore.getTeamMembers();
      }
      throw err;
    }
  },

  async getInvites(): Promise<{ invites: Invite[] }> {
    try {
      return await apiFetch<{ invites: Invite[] }>('/api/team/invites');
    } catch (err: any) {
      if (isStaticHostFallback(err)) {
        return localStore.getInvites();
      }
      throw err;
    }
  },

  async createInvite(payload: { email: string; role: UserRole; permissions?: UserPermissions; notes?: string }): Promise<{ success: boolean; invite: Invite; inviteLink: string; message: string }> {
    try {
      return await apiFetch('/api/team/invites', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch (err: any) {
      if (isStaticHostFallback(err)) {
        const res = localStore.createInvite(payload);
        return { success: true, ...res };
      }
      throw err;
    }
  },

  async revokeInvite(inviteId: string): Promise<{ success: boolean; invite: Invite; message: string }> {
    try {
      return await apiFetch(`/api/team/invites/${inviteId}/revoke`, {
        method: 'POST',
      });
    } catch (err: any) {
      if (isStaticHostFallback(err)) {
        const res = localStore.revokeInvite(inviteId);
        return { success: true, ...res };
      }
      throw err;
    }
  },

  async removeMember(userId: string): Promise<{ success: boolean; message: string }> {
    try {
      return await apiFetch(`/api/team/members/${userId}`, {
        method: 'DELETE',
      });
    } catch (err: any) {
      if (isStaticHostFallback(err)) {
        const res = localStore.removeMember(userId);
        return { success: true, message: res.message };
      }
      throw err;
    }
  },

  async updateMemberRole(userId: string, data: { role?: UserRole; permissions?: Partial<UserPermissions> }): Promise<{ success: boolean; user: User }> {
    try {
      return await apiFetch(`/api/team/members/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    } catch (err: any) {
      if (isStaticHostFallback(err)) {
        const members = localStore.getTeamMembers().members;
        const u = members.find((m) => m.id === userId);
        if (u) return { success: true, user: u };
      }
      throw err;
    }
  },

  async approvePendingUser(userId: string, role: UserRole = 'member'): Promise<{ success: boolean; user: User; message: string }> {
    try {
      return await apiFetch(`/api/team/approve-pending/${userId}`, {
        method: 'POST',
        body: JSON.stringify({ role }),
      });
    } catch (err: any) {
      if (isStaticHostFallback(err)) {
        const res = localStore.approvePendingUser(userId, role);
        return { success: true, ...res };
      }
      throw err;
    }
  },

  async getAuditLogs(): Promise<{ logs: AuditLog[] }> {
    try {
      return await apiFetch<{ logs: AuditLog[] }>('/api/team/audit');
    } catch (err: any) {
      if (isStaticHostFallback(err)) {
        return localStore.getAuditLogs();
      }
      throw err;
    }
  },

  // Projects
  async getProjects(): Promise<{ projects: Project[] }> {
    try {
      return await apiFetch<{ projects: Project[] }>('/api/projects');
    } catch (err: any) {
      if (isStaticHostFallback(err)) {
        return localStore.getProjects();
      }
      throw err;
    }
  },

  async createProject(data: { title: string; description: string; code?: string; color?: string }): Promise<{ success: boolean; project: Project }> {
    try {
      return await apiFetch('/api/projects', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (err: any) {
      if (isStaticHostFallback(err)) {
        const res = localStore.createProject(data);
        return { success: true, ...res };
      }
      throw err;
    }
  },

  async deleteProject(id: string): Promise<{ success: boolean; message: string }> {
    try {
      return await apiFetch(`/api/projects/${id}`, {
        method: 'DELETE',
      });
    } catch (err: any) {
      if (isStaticHostFallback(err)) {
        localStore.deleteProject(id);
        return { success: true, message: 'Проект удален' };
      }
      throw err;
    }
  },

  // Tasks
  async getTasks(projectId?: string): Promise<{ tasks: Task[] }> {
    try {
      const q = projectId ? `?projectId=${encodeURIComponent(projectId)}` : '';
      return await apiFetch<{ tasks: Task[] }>(`/api/tasks${q}`);
    } catch (err: any) {
      if (isStaticHostFallback(err)) {
        return localStore.getTasks(projectId);
      }
      throw err;
    }
  },

  async createTask(data: { title: string; description?: string; projectId: string; priority?: Task['priority']; assigneeId?: string; status?: Task['status'] }): Promise<{ success: boolean; task: Task }> {
    try {
      return await apiFetch('/api/tasks', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (err: any) {
      if (isStaticHostFallback(err)) {
        const res = localStore.createTask(data);
        return { success: true, ...res };
      }
      throw err;
    }
  },

  async updateTask(id: string, updates: Partial<Task>): Promise<{ success: boolean; task: Task }> {
    try {
      return await apiFetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
    } catch (err: any) {
      if (isStaticHostFallback(err)) {
        const res = localStore.updateTask(id, updates);
        return { success: true, ...res };
      }
      throw err;
    }
  },

  async deleteTask(id: string): Promise<{ success: boolean }> {
    try {
      return await apiFetch(`/api/tasks/${id}`, {
        method: 'DELETE',
      });
    } catch (err: any) {
      if (isStaticHostFallback(err)) {
        const res = localStore.deleteTask(id);
        return res;
      }
      throw err;
    }
  },

  // Updates
  async getUpdates(): Promise<{ updates: TeamUpdate[] }> {
    try {
      return await apiFetch<{ updates: TeamUpdate[] }>('/api/updates');
    } catch (err: any) {
      if (isStaticHostFallback(err)) {
        return localStore.getUpdates();
      }
      throw err;
    }
  },

  async createUpdate(data: { title: string; content: string; category?: TeamUpdate['category'] }): Promise<{ success: boolean; update: TeamUpdate }> {
    try {
      return await apiFetch('/api/updates', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (err: any) {
      if (isStaticHostFallback(err)) {
        const res = localStore.createUpdate(data);
        return { success: true, ...res };
      }
      throw err;
    }
  },

  // Messenger / Chat
  async getMessages(channelId?: string, recipientId?: string): Promise<{ messages: ChatMessage[] }> {
    try {
      const params = new URLSearchParams();
      if (channelId) params.append('channelId', channelId);
      if (recipientId) params.append('recipientId', recipientId);
      const query = params.toString() ? `?${params.toString()}` : '';
      return await apiFetch<{ messages: ChatMessage[] }>(`/api/chat/messages${query}`);
    } catch (err: any) {
      if (isStaticHostFallback(err)) {
        return localStore.getMessages(channelId, recipientId);
      }
      throw err;
    }
  },

  async sendMessage(data: {
    channelId?: string;
    recipientId?: string;
    content: string;
    stickerId?: string;
    codeSnippet?: { code: string; language: string };
  }): Promise<{ success: boolean; message: ChatMessage }> {
    try {
      return await apiFetch<{ success: boolean; message: ChatMessage }>('/api/chat/messages', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (err: any) {
      if (isStaticHostFallback(err)) {
        const res = localStore.addMessage(data);
        return { success: true, message: res.message };
      }
      throw err;
    }
  },

  async editMessage(messageId: string, content: string): Promise<{ success: boolean; message: ChatMessage }> {
    try {
      return await apiFetch<{ success: boolean; message: ChatMessage }>(`/api/chat/messages/${messageId}`, {
        method: 'PUT',
        body: JSON.stringify({ content }),
      });
    } catch (err: any) {
      if (isStaticHostFallback(err)) {
        const res = localStore.editMessage(messageId, content);
        return { success: true, message: res.message };
      }
      throw err;
    }
  },

  async deleteMessage(messageId: string, forEveryone: boolean = true): Promise<{ success: boolean; id: string; message: string }> {
    try {
      return await apiFetch<{ success: boolean; id: string; message: string }>(`/api/chat/messages/${messageId}`, {
        method: 'DELETE',
        body: JSON.stringify({ forEveryone }),
      });
    } catch (err: any) {
      if (isStaticHostFallback(err)) {
        localStore.deleteMessage(messageId, forEveryone);
        return { success: true, id: messageId, message: 'Сообщение удалено' };
      }
      throw err;
    }
  },

  async toggleReaction(messageId: string, emoji: string): Promise<{ success: boolean; message: ChatMessage }> {
    try {
      return await apiFetch<{ success: boolean; message: ChatMessage }>(`/api/chat/messages/${messageId}/react`, {
        method: 'POST',
        body: JSON.stringify({ emoji }),
      });
    } catch (err: any) {
      if (isStaticHostFallback(err)) {
        const res = localStore.toggleReaction(messageId, emoji);
        return { success: true, message: res.message };
      }
      throw err;
    }
  },

  // Code Studio / Code Files
  async getCodeFiles(projectId?: string): Promise<{ files: CodeFile[] }> {
    try {
      const q = projectId ? `?projectId=${encodeURIComponent(projectId)}` : '';
      return await apiFetch<{ files: CodeFile[] }>(`/api/code/files${q}`);
    } catch (err: any) {
      if (isStaticHostFallback(err)) {
        return localStore.getCodeFiles(projectId);
      }
      throw err;
    }
  },

  async saveCodeFile(file: Partial<CodeFile> & { name: string; language: string; content: string; projectId?: string; projectName?: string; description?: string }): Promise<{ success: boolean; file: CodeFile }> {
    try {
      return await apiFetch<{ success: boolean; file: CodeFile }>('/api/code/files', {
        method: 'POST',
        body: JSON.stringify(file),
      });
    } catch (err: any) {
      if (isStaticHostFallback(err)) {
        const res = localStore.saveCodeFile(file);
        return { success: true, file: res.file };
      }
      throw err;
    }
  },

  async exportFilesToProject(fileIds: string[], projectId: string, projectName?: string): Promise<{ success: boolean; files: CodeFile[]; message: string }> {
    try {
      return await apiFetch<{ success: boolean; files: CodeFile[]; message: string }>('/api/code/files/export-to-project', {
        method: 'POST',
        body: JSON.stringify({ fileIds, projectId, projectName }),
      });
    } catch (err: any) {
      if (isStaticHostFallback(err)) {
        const res = localStore.exportFilesToProject(fileIds, projectId, projectName || 'Проект');
        return { success: true, files: res.files, message: `Экспортировано ${res.files.length} файлов` };
      }
      throw err;
    }
  },

  async deleteCodeFile(id: string): Promise<{ success: boolean; id?: string; message: string }> {
    try {
      return await apiFetch<{ success: boolean; id?: string; message: string }>(`/api/code/files/${id}`, {
        method: 'DELETE',
      });
    } catch (err: any) {
      if (isStaticHostFallback(err)) {
        const res = localStore.deleteCodeFile(id);
        return { success: res.success, id, message: 'Файл успешно удален' };
      }
      throw err;
    }
  },

  // AI Code Assistant
  async codeAssist(params: {
    prompt?: string;
    code?: string;
    language?: string;
    action?: 'assist' | 'explain' | 'audit' | 'optimize' | 'tests' | 'generate' | 'fix' | 'refactor' | 'doc' | 'review' | 'task_breakdown' | 'chat';
    chatHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
    selectedText?: string;
  }): Promise<{ success: boolean; result: string; action: string; fallback?: boolean }> {
    try {
      return await apiFetch<{ success: boolean; result: string; action: string; fallback?: boolean }>('/api/ai/code-assist', {
        method: 'POST',
        body: JSON.stringify(params),
      });
    } catch (err: any) {
      if (isStaticHostFallback(err)) {
        const result = localStore.generateAiResponse(
          params.action || 'assist',
          params.language || 'typescript',
          params.code,
          params.prompt,
          params.selectedText
        );
        return {
          success: true,
          result,
          action: params.action || 'assist',
          fallback: true,
        };
      }
      throw err;
    }
  },
};
