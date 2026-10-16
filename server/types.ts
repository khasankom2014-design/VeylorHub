export type UserRole = 'owner' | 'member';

export type UserStatus = 'active_member' | 'pending_invite' | 'suspended';

export type InviteStatus = 'pending' | 'accepted' | 'revoked';

export interface UserPermissions {
  canManageTasks: boolean;
  canCreateProjects: boolean;
  canPostUpdates: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string; // Plain/hashed comparison for demo simplicity & security
  avatar?: string;
  title?: string;
  bio?: string;
  contacts?: {
    telegram?: string;
    github?: string;
    discord?: string;
  };
  role: UserRole | null; // null if pending_invite (not in team)
  status: UserStatus;
  permissions: UserPermissions;
  invitedBy?: string;
  joinedAt?: string;
  createdAt: string;
}

export interface Invite {
  id: string;
  token: string;
  email: string;
  role: UserRole;
  permissions: UserPermissions;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  status: InviteStatus;
  acceptedAt?: string;
  acceptedByUserId?: string;
  revokedAt?: string;
  notes?: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  code: string;
  color: string;
  status: 'active' | 'planning' | 'completed';
  createdBy: string;
  createdAt: string;
  membersCount: number;
  documentation?: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigneeId?: string;
  assigneeName?: string;
  assigneeAvatar?: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
}

export interface TeamUpdate {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  authorAvatar?: string;
  title: string;
  content: string;
  category: 'announcement' | 'release' | 'design' | 'general';
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  senderRole: UserRole;
  channelId?: string; // 'general' | 'dev' | 'releases' | 'design'
  recipientId?: string; // for direct messages
  content: string;
  stickerId?: string;
  codeSnippet?: {
    code: string;
    language: string;
  };
  reactions?: Record<string, string[]>; // emoji -> array of userIds
  isEdited?: boolean;
  editedAt?: string;
  deletedForUsers?: string[];
  createdAt: string;
}

export interface FileVersion {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  timestamp: string;
  comment?: string;
}

export interface CodeFile {
  id: string;
  name: string;
  language: string;
  content: string;
  projectId?: string;
  projectName?: string;
  description?: string;
  updatedAt: string;
  versions?: FileVersion[];
}

export interface DatabaseSchema {
  users: User[];
  invites: Invite[];
  projects: Project[];
  tasks: Task[];
  updates: TeamUpdate[];
  auditLogs: AuditLog[];
  messages: ChatMessage[];
  codeFiles: CodeFile[];
}
