import { Router, Response } from 'express';
import { db } from '../db.js';
import { createSession, revokeSession } from '../auth.js';
import { requireAuth, AuthenticatedRequest } from '../middleware.js';
import { User } from '../types.js';

const router = Router();

function sanitizeUser(user: User) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...safe } = user;
  return safe;
}

// Check invite token info (publicly safe)
router.get('/invite-info', (req, res) => {
  const token = req.query.token as string;
  if (!token) {
    res.status(400).json({ error: 'Token is required' });
    return;
  }

  const invite = db.getInviteByToken(token);
  if (!invite) {
    res.status(404).json({ error: 'Приглашение не найдено или ссылка недействительна' });
    return;
  }

  res.json({
    email: invite.email,
    role: invite.role,
    status: invite.status,
    createdByName: invite.createdByName,
    createdAt: invite.createdAt,
    notes: invite.notes,
  });
});

// Register
router.post('/register', (req, res) => {
  const { name, email, password, inviteToken } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({ error: 'Пожалуйста, заполните имя, email и пароль' });
    return;
  }

  const trimmedEmail = email.trim().toLowerCase();
  const existingUser = db.getUserByEmail(trimmedEmail);

  if (existingUser) {
    res.status(400).json({ error: 'Пользователь с таким email уже зарегистрирован' });
    return;
  }

  // Handle invitation token if provided
  let role: User['role'] = null;
  let status: User['status'] = 'pending_invite';
  let permissions = {
    canManageTasks: false,
    canCreateProjects: false,
    canPostUpdates: false,
  };
  let invitedBy: string | undefined = undefined;

  let matchedInvite = inviteToken ? db.getInviteByToken(inviteToken.trim()) : undefined;

  if (inviteToken) {
    if (!matchedInvite) {
      res.status(400).json({ error: 'Указанный код приглашения не существует' });
      return;
    }
    if (matchedInvite.status === 'revoked') {
      res.status(400).json({ error: 'Это приглашение было отозвано владельцем платформы' });
      return;
    }
    if (matchedInvite.status === 'accepted') {
      res.status(400).json({ error: 'Это приглашение уже было активировано ранее' });
      return;
    }
    if (matchedInvite.email.toLowerCase() !== trimmedEmail) {
      res.status(400).json({ 
        error: `Приглашение предназначено для адреса ${matchedInvite.email}, а не для ${trimmedEmail}` 
      });
      return;
    }

    // Grant access from valid invite
    role = matchedInvite.role;
    status = 'active_member';
    permissions = matchedInvite.permissions;
    invitedBy = matchedInvite.createdBy;
  }

  // Create user
  const newUser: User = {
    id: 'usr_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
    name: name.trim(),
    email: trimmedEmail,
    passwordHash: password, // For demo purposes
    role,
    status,
    permissions,
    invitedBy,
    joinedAt: status === 'active_member' ? new Date().toISOString() : undefined,
    createdAt: new Date().toISOString(),
    avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
  };

  db.addUser(newUser);

  // If matched invite, mark accepted
  if (matchedInvite) {
    matchedInvite.status = 'accepted';
    matchedInvite.acceptedAt = new Date().toISOString();
    matchedInvite.acceptedByUserId = newUser.id;
    db.save();

    db.addAuditLog({
      id: 'log_' + Date.now(),
      actorId: newUser.id,
      actorName: newUser.name,
      action: 'TEAM_INVITE_ACCEPTED',
      details: `Новый пользователь ${newUser.name} (${newUser.email}) активировал инвайт и вступил в команду`,
      timestamp: new Date().toISOString(),
    });
  } else {
    // Log user registered in waiting room
    db.addAuditLog({
      id: 'log_' + Date.now(),
      actorId: newUser.id,
      actorName: newUser.name,
      action: 'USER_REGISTERED_PENDING',
      details: `Пользователь ${newUser.name} (${newUser.email}) зарегистрировался без инвайта. Статус: «Ожидание приглашения».`,
      timestamp: new Date().toISOString(),
    });
  }

  const token = createSession(newUser.id);

  res.status(201).json({
    token,
    user: sanitizeUser(newUser),
    message: status === 'active_member' 
      ? 'Добро пожаловать в команду Veylor Hub!' 
      : 'Аккаунт создан. Ожидайте приглашения от владельца команды.',
  });
});

// Login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Укажите email и пароль' });
    return;
  }

  const trimmedEmail = email.trim().toLowerCase();
  const user = db.getUserByEmail(trimmedEmail);

  if (!user || user.passwordHash !== password) {
    res.status(401).json({ error: 'Неверный email или пароль' });
    return;
  }

  const token = createSession(user.id);

  res.json({
    token,
    user: sanitizeUser(user),
  });
});

// Current User State
router.get('/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: 'Не авторизован' });
    return;
  }
  res.json({
    user: sanitizeUser(req.user),
  });
});

// Logout
router.post('/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    revokeSession(authHeader);
  }
  res.json({ success: true });
});

// Accept invite for currently authenticated user in 'pending_invite' state
router.post('/accept-invite', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { token } = req.body;
  if (!token) {
    res.status(400).json({ error: 'Код приглашения обязателен' });
    return;
  }

  if (!req.user) {
    res.status(401).json({ error: 'Не авторизован' });
    return;
  }

  const result = db.acceptInvite(token.trim(), req.user);
  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }

  const updatedUser = db.getUserById(req.user.id);
  res.json({
    success: true,
    user: updatedUser ? sanitizeUser(updatedUser) : null,
    message: 'Приглашение успешно принято! Добро пожаловать в команду Veylor Hub.',
  });
});

// Update Profile (Name, Title, Avatar, Bio, Contacts)
router.patch('/profile', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: 'Не авторизован' });
    return;
  }

  const { name, title, avatar, bio, contacts } = req.body;
  const updates: Partial<User> = {};

  if (name !== undefined && name.trim()) {
    updates.name = name.trim();
  }
  if (title !== undefined) {
    updates.title = title.trim();
  }
  if (avatar !== undefined) {
    updates.avatar = avatar.trim();
  }
  if (bio !== undefined) {
    updates.bio = bio.trim();
  }
  if (contacts !== undefined) {
    updates.contacts = {
      telegram: contacts.telegram?.trim() || undefined,
      github: contacts.github?.trim() || undefined,
      discord: contacts.discord?.trim() || undefined,
    };
  }

  const updatedUser = db.updateUser(req.user.id, updates);
  if (!updatedUser) {
    res.status(404).json({ error: 'Пользователь не найден' });
    return;
  }

  db.addAuditLog({
    id: 'log_' + Date.now(),
    actorId: req.user.id,
    actorName: updatedUser.name,
    action: 'PROFILE_UPDATED',
    details: `Пользователь ${updatedUser.name} обновил данные личного профиля`,
    timestamp: new Date().toISOString(),
  });

  res.json({
    success: true,
    user: sanitizeUser(updatedUser),
    message: 'Профиль успешно сохранен',
  });
});

// Change Password
router.post('/change-password', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: 'Не авторизован' });
    return;
  }

  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: 'Укажите текущий и новый пароль' });
    return;
  }

  const freshUser = db.getUserById(req.user.id);
  if (!freshUser || freshUser.passwordHash !== currentPassword) {
    res.status(400).json({ error: 'Неверный текущий пароль' });
    return;
  }

  if (newPassword.length < 6) {
    res.status(400).json({ error: 'Новый пароль должен содержать минимум 6 символов' });
    return;
  }

  freshUser.passwordHash = newPassword;
  db.save();

  db.addAuditLog({
    id: 'log_' + Date.now(),
    actorId: req.user.id,
    actorName: freshUser.name,
    action: 'PASSWORD_CHANGED',
    details: `Пользователь ${freshUser.name} изменил пароль доступа`,
    timestamp: new Date().toISOString(),
  });

  res.json({
    success: true,
    message: 'Пароль успешно обновлен',
  });
});

// Reset demo dataset
router.post('/reset-demo', (req, res) => {
  db.resetDemoData();
  res.json({ success: true, message: 'Демо-данные успешно сброшены к исходному состоянию' });
});

export default router;
