import fs from 'fs';
import path from 'path';
import { DatabaseSchema, User, Invite, Project, Task, TeamUpdate, AuditLog, ChatMessage, CodeFile } from './types.js';

const DB_PATH = path.resolve(process.cwd(), 'data', 'db.json');

// Initial clean state with ONLY the real administrator: Veylor
const initialData: DatabaseSchema = {
  users: [
    {
      id: 'usr_veylor_owner',
      name: 'Veylor',
      email: 'khasankom2014@yandex.ru',
      passwordHash: 'veylor2026',
      avatar: '',
      title: 'Владелец платформы',
      role: 'owner',
      status: 'active_member',
      permissions: {
        canManageTasks: true,
        canCreateProjects: true,
        canPostUpdates: true,
      },
      joinedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      bio: 'Разработка и управление экосистемой Veylor Labs',
      contacts: {},
    },
  ],
  invites: [],
  projects: [],
  tasks: [],
  updates: [],
  auditLogs: [
    {
      id: 'log_init',
      actorId: 'usr_veylor_owner',
      actorName: 'Veylor',
      action: 'SYSTEM_INITIALIZED',
      details: 'Платформа Veylor Labs запущена. Чистый контур готов к работе.',
      timestamp: new Date().toISOString(),
    },
  ],
  messages: [],
  codeFiles: [],
};

// Also support exact case or lowercase
initialData.users[0].email = 'khasankom2014@yandex.ru';

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
    this.ensureVeylorOwner();
  }

  // Ensure Veylor (khasankom2014@yandex.ru) is always present as owner
  private ensureVeylorOwner() {
    const targetEmail = 'khasankom2014@yandex.ru';
    let owner = this.data.users.find(u => u.email.toLowerCase() === targetEmail);
    if (!owner) {
      owner = {
        id: 'usr_veylor_owner',
        name: 'Veylor',
        email: targetEmail,
        passwordHash: 'veylor2026',
        avatar: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=250&auto=format&fit=crop&q=80',
        title: 'Владелец платформы',
        role: 'owner',
        status: 'active_member',
        permissions: {
          canManageTasks: true,
          canCreateProjects: true,
          canPostUpdates: true,
        },
        joinedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      this.data.users = [owner];
    } else {
      owner.name = 'Veylor';
      owner.role = 'owner';
      owner.status = 'active_member';
      owner.permissions = {
        canManageTasks: true,
        canCreateProjects: true,
        canPostUpdates: true,
      };
    }

    // Remove any mock demo accounts (owner@veylor.io, daria.design@veylor.io, mikhail.dev@veylor.io, etc.)
    const fakeEmails = ['owner@veylor.io', 'daria.design@veylor.io', 'mikhail.dev@veylor.io'];
    this.data.users = this.data.users.filter(u => !fakeEmails.includes(u.email.toLowerCase()));
    this.data.invites = this.data.invites.filter(i => !fakeEmails.includes(i.email.toLowerCase()) && i.createdBy !== 'usr_owner_01');

    if (!Array.isArray(this.data.codeFiles)) {
      this.data.codeFiles = JSON.parse(JSON.stringify(initialData.codeFiles || []));
    }
    if (!Array.isArray(this.data.messages)) {
      this.data.messages = JSON.parse(JSON.stringify(initialData.messages || []));
    }

    this.save();
  }

  private load(): DatabaseSchema {
    try {
      const dir = path.dirname(DB_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      if (fs.existsSync(DB_PATH)) {
        const raw = fs.readFileSync(DB_PATH, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('Error reading db.json, using seed data:', e);
    }

    this.save(initialData);
    return JSON.parse(JSON.stringify(initialData));
  }

  public save(dataToSave?: DatabaseSchema) {
    try {
      const toWrite = dataToSave || this.data;
      const dir = path.dirname(DB_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DB_PATH, JSON.stringify(toWrite, null, 2), 'utf-8');
      if (dataToSave) {
        this.data = dataToSave;
      }
    } catch (e) {
      console.error('Error saving db.json:', e);
    }
  }

  // Users
  getUsers(): User[] {
    return this.data.users;
  }

  getUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  getUserByEmail(email: string): User | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  addUser(user: User): User {
    this.data.users.push(user);
    this.save();
    return user;
  }

  updateUser(id: string, updates: Partial<User>): User | undefined {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx === -1) return undefined;
    this.data.users[idx] = { ...this.data.users[idx], ...updates };
    this.save();
    return this.data.users[idx];
  }

  removeUserFromTeam(id: string, actor: User): boolean {
    const user = this.getUserById(id);
    if (!user) return false;
    
    if (user.role === 'owner') {
      const ownersCount = this.data.users.filter(u => u.role === 'owner' && u.status === 'active_member').length;
      if (ownersCount <= 1) {
        throw new Error('Нельзя удалить единственного владельца платформы');
      }
    }

    user.role = null;
    user.status = 'pending_invite';
    this.save();

    this.addAuditLog({
      id: 'log_' + Date.now(),
      actorId: actor.id,
      actorName: actor.name,
      action: 'MEMBER_REMOVED',
      details: `Участник ${user.name} (${user.email}) исключен из команды`,
      timestamp: new Date().toISOString(),
    });

    return true;
  }

  // Invites
  getInvites(): Invite[] {
    return this.data.invites;
  }

  getInviteByToken(token: string): Invite | undefined {
    return this.data.invites.find(i => i.token === token);
  }

  getInviteById(id: string): Invite | undefined {
    return this.data.invites.find(i => i.id === id);
  }

  addInvite(invite: Invite): Invite {
    this.data.invites.unshift(invite);
    this.save();
    return invite;
  }

  revokeInvite(id: string, actor: User): Invite | undefined {
    const invite = this.getInviteById(id);
    if (!invite) return undefined;
    if (invite.status === 'revoked') return invite;

    invite.status = 'revoked';
    invite.revokedAt = new Date().toISOString();
    this.save();

    this.addAuditLog({
      id: 'log_' + Date.now(),
      actorId: actor.id,
      actorName: actor.name,
      action: 'TEAM_INVITE_REVOKED',
      details: `Приглашение для ${invite.email} отозвано`,
      timestamp: new Date().toISOString(),
    });

    return invite;
  }

  acceptInvite(token: string, user: User): { success: boolean; error?: string } {
    const invite = this.getInviteByToken(token);
    if (!invite) {
      return { success: false, error: 'Приглашение не найдено' };
    }
    if (invite.status === 'revoked') {
      return { success: false, error: 'Это приглашение было отозвано владельцем' };
    }
    if (invite.status === 'accepted') {
      return { success: false, error: 'Это приглашение уже было активировано ранее' };
    }

    if (invite.email.toLowerCase() !== user.email.toLowerCase()) {
      return { 
        success: false, 
        error: `Это приглашение выписано для почты ${invite.email}. Ваш текущий email: ${user.email}` 
      };
    }

    invite.status = 'accepted';
    invite.acceptedAt = new Date().toISOString();
    invite.acceptedByUserId = user.id;

    user.role = invite.role;
    user.status = 'active_member';
    user.permissions = invite.permissions;
    user.invitedBy = invite.createdBy;
    user.joinedAt = new Date().toISOString();

    this.save();

    this.addAuditLog({
      id: 'log_' + Date.now(),
      actorId: user.id,
      actorName: user.name,
      action: 'TEAM_INVITE_ACCEPTED',
      details: `Пользователь ${user.name} (${user.email}) принял приглашение и вступил в команду с ролью «${invite.role === 'owner' ? 'Владелец' : 'Участник'}»`,
      timestamp: new Date().toISOString(),
    });

    return { success: true };
  }

  // Projects
  getProjects(): Project[] {
    return this.data.projects;
  }

  addProject(project: Project): Project {
    this.data.projects.unshift(project);
    this.save();
    return project;
  }

  deleteProject(id: string): boolean {
    const idx = this.data.projects.findIndex(p => p.id === id);
    if (idx === -1) return false;
    this.data.projects.splice(idx, 1);
    this.data.tasks = this.data.tasks.filter(t => t.projectId !== id);
    if (this.data.codeFiles) {
      this.data.codeFiles.forEach(f => {
        if (f.projectId === id) {
          f.projectId = undefined;
          f.projectName = undefined;
        }
      });
    }
    this.save();
    return true;
  }

  // Tasks
  getTasks(): Task[] {
    return this.data.tasks;
  }

  addTask(task: Task): Task {
    this.data.tasks.unshift(task);
    this.save();
    return task;
  }

  updateTask(id: string, updates: Partial<Task>): Task | undefined {
    const idx = this.data.tasks.findIndex(t => t.id === id);
    if (idx === -1) return undefined;
    this.data.tasks[idx] = { 
      ...this.data.tasks[idx], 
      ...updates, 
      updatedAt: new Date().toISOString() 
    };
    this.save();
    return this.data.tasks[idx];
  }

  deleteTask(id: string): boolean {
    const idx = this.data.tasks.findIndex(t => t.id === id);
    if (idx === -1) return false;
    this.data.tasks.splice(idx, 1);
    this.save();
    return true;
  }

  // Updates
  getUpdates(): TeamUpdate[] {
    return this.data.updates;
  }

  addUpdate(update: TeamUpdate): TeamUpdate {
    this.data.updates.unshift(update);
    this.save();
    return update;
  }

  // Audit Logs
  getAuditLogs(): AuditLog[] {
    return this.data.auditLogs;
  }

  addAuditLog(log: AuditLog) {
    this.data.auditLogs.unshift(log);
    if (this.data.auditLogs.length > 100) {
      this.data.auditLogs = this.data.auditLogs.slice(0, 100);
    }
    this.save();
  }

  // Messages
  getMessages(channelId?: string, recipientId?: string, currentUserId?: string): ChatMessage[] {
    if (!this.data.messages) this.data.messages = [];
    let msgs = this.data.messages;

    if (currentUserId) {
      msgs = msgs.filter((m) => !m.deletedForUsers?.includes(currentUserId));
    }

    if (channelId) {
      return msgs.filter((m) => m.channelId === channelId);
    }
    if (recipientId && currentUserId) {
      return msgs.filter(
        (m) =>
          (m.senderId === currentUserId && m.recipientId === recipientId) ||
          (m.senderId === recipientId && m.recipientId === currentUserId)
      );
    }
    return msgs;
  }

  addMessage(msg: ChatMessage): ChatMessage {
    if (!this.data.messages) this.data.messages = [];
    this.data.messages.push(msg);
    this.save();
    return msg;
  }

  editMessage(messageId: string, newContent: string, userId: string, isOwner: boolean = false): ChatMessage | null {
    if (!this.data.messages) this.data.messages = [];
    const msg = this.data.messages.find((m) => m.id === messageId);
    if (!msg) return null;
    if (msg.senderId !== userId && !isOwner) {
      return null;
    }
    msg.content = newContent.trim();
    msg.isEdited = true;
    msg.editedAt = new Date().toISOString();
    this.save();
    return msg;
  }

  deleteMessage(messageId: string, userId: string, isOwner: boolean = false, forEveryone: boolean = true): boolean {
    if (!this.data.messages) this.data.messages = [];
    const idx = this.data.messages.findIndex((m) => m.id === messageId);
    if (idx === -1) return false;
    const msg = this.data.messages[idx];
    if (msg.senderId !== userId && !isOwner) {
      return false;
    }

    if (forEveryone) {
      this.data.messages.splice(idx, 1);
    } else {
      if (!msg.deletedForUsers) msg.deletedForUsers = [];
      if (!msg.deletedForUsers.includes(userId)) {
        msg.deletedForUsers.push(userId);
      }
    }
    this.save();
    return true;
  }

  toggleReaction(messageId: string, emoji: string, userId: string): ChatMessage | undefined {
    if (!this.data.messages) this.data.messages = [];
    const msg = this.data.messages.find((m) => m.id === messageId);
    if (!msg) return undefined;

    if (!msg.reactions) msg.reactions = {};
    if (!msg.reactions[emoji]) msg.reactions[emoji] = [];

    const existingIndex = msg.reactions[emoji].indexOf(userId);
    if (existingIndex > -1) {
      msg.reactions[emoji].splice(existingIndex, 1);
      if (msg.reactions[emoji].length === 0) {
        delete msg.reactions[emoji];
      }
    } else {
      msg.reactions[emoji].push(userId);
    }

    this.save();
    return msg;
  }

  // Code Files
  getCodeFiles(projectId?: string): CodeFile[] {
    if (!this.data.codeFiles) this.data.codeFiles = [];
    if (projectId) {
      return this.data.codeFiles.filter((f) => f.projectId === projectId);
    }
    return this.data.codeFiles;
  }

  saveCodeFile(file: Partial<CodeFile> & { name: string; language: string; content: string; projectId?: string; projectName?: string; description?: string }): CodeFile {
    if (!this.data.codeFiles) this.data.codeFiles = [];
    if (file.id) {
      const idx = this.data.codeFiles.findIndex((f) => f.id === file.id);
      if (idx !== -1) {
        this.data.codeFiles[idx] = {
          ...this.data.codeFiles[idx],
          name: file.name,
          language: file.language,
          content: file.content,
          projectId: file.projectId !== undefined ? file.projectId : this.data.codeFiles[idx].projectId,
          projectName: file.projectName !== undefined ? file.projectName : this.data.codeFiles[idx].projectName,
          description: file.description !== undefined ? file.description : this.data.codeFiles[idx].description,
          updatedAt: new Date().toISOString(),
        };
        this.save();
        return this.data.codeFiles[idx];
      }
    }

    const newFile: CodeFile = {
      id: file.id || 'code_' + Date.now().toString(36),
      name: file.name,
      language: file.language,
      content: file.content,
      projectId: file.projectId,
      projectName: file.projectName,
      description: file.description,
      updatedAt: new Date().toISOString(),
    };
    this.data.codeFiles.unshift(newFile);
    this.save();
    return newFile;
  }

  exportFilesToProject(fileIds: string[], projectId: string, projectName: string): CodeFile[] {
    if (!this.data.codeFiles) this.data.codeFiles = [];
    const updated: CodeFile[] = [];
    this.data.codeFiles.forEach((f) => {
      if (fileIds.includes(f.id)) {
        f.projectId = projectId;
        f.projectName = projectName;
        f.updatedAt = new Date().toISOString();
        updated.push(f);
      }
    });
    this.save();
    return updated;
  }

  deleteCodeFile(id: string): boolean {
    if (!this.data.codeFiles) this.data.codeFiles = [];
    const idx = this.data.codeFiles.findIndex((f) => f.id === id);
    if (idx === -1) return false;
    this.data.codeFiles.splice(idx, 1);
    this.save();
    return true;
  }

  resetDemoData() {
    this.data = JSON.parse(JSON.stringify(initialData));
    this.save();
  }
}

export const db = new Database();
