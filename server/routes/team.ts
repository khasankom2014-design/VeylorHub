import { Router, Response } from 'express';
import { db } from '../db.js';
import { generateInviteToken } from '../auth.js';
import { requireAuth, requireTeamMember, requireOwner, AuthenticatedRequest } from '../middleware.js';
import { Invite, UserRole } from '../types.js';

const router = Router();

// Get active team members (Accessible to active team members)
router.get('/members', requireAuth, requireTeamMember, (req: AuthenticatedRequest, res: Response) => {
  const users = db.getUsers();
  const activeMembers = users
    .filter(u => u.status === 'active_member' && u.role !== null)
    .map(({ passwordHash, ...safe }) => safe);

  // If user is owner, also include pending registered accounts so owner can approve or review
  let pendingRegistrations = undefined;
  if (req.user?.role === 'owner') {
    pendingRegistrations = users
      .filter(u => u.status === 'pending_invite')
      .map(({ passwordHash, ...safe }) => safe);
  }

  res.json({
    members: activeMembers,
    pendingRegistrations,
  });
});

// Get team invites (Strictly Owner only)
router.get('/invites', requireAuth, requireOwner, (req: AuthenticatedRequest, res: Response) => {
  const invites = db.getInvites();
  res.json({ invites });
});

// Create new invitation (Strictly Owner only)
router.post('/invites', requireAuth, requireOwner, (req: AuthenticatedRequest, res: Response) => {
  const { email, role = 'member', permissions, notes } = req.body;

  if (!email || !email.includes('@')) {
    res.status(400).json({ error: 'Укажите корректный email адрес для приглашения' });
    return;
  }

  const trimmedEmail = email.trim().toLowerCase();

  // Check if already an active member
  const existingUser = db.getUserByEmail(trimmedEmail);
  if (existingUser && existingUser.status === 'active_member' && existingUser.role) {
    res.status(400).json({ error: `Пользователь ${trimmedEmail} уже является действующим участником команды` });
    return;
  }

  // Check if active pending invite already exists
  const existingInvites = db.getInvites();
  const activePendingInvite = existingInvites.find(i => i.email.toLowerCase() === trimmedEmail && i.status === 'pending');
  if (activePendingInvite) {
    res.status(400).json({ 
      error: `Для ${trimmedEmail} уже существует активное приглашение (код: ${activePendingInvite.token})`,
      existingInvite: activePendingInvite,
    });
    return;
  }

  const token = generateInviteToken();

  const newInvite: Invite = {
    id: 'inv_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
    token,
    email: trimmedEmail,
    role: (role === 'owner' ? 'owner' : 'member') as UserRole,
    permissions: permissions || {
      canManageTasks: true,
      canCreateProjects: role === 'owner',
      canPostUpdates: true,
    },
    createdBy: req.user!.id,
    createdByName: req.user!.name,
    createdAt: new Date().toISOString(),
    status: 'pending',
    notes: notes?.trim() || undefined,
  };

  db.addInvite(newInvite);

  db.addAuditLog({
    id: 'log_' + Date.now(),
    actorId: req.user!.id,
    actorName: req.user!.name,
    action: 'TEAM_INVITE_CREATED',
    details: `Владелец ${req.user!.name} создал приглашение для ${trimmedEmail} (роль: ${newInvite.role === 'owner' ? 'Владелец' : 'Участник'})`,
    timestamp: new Date().toISOString(),
  });

  res.status(201).json({
    success: true,
    invite: newInvite,
    inviteLink: `${req.protocol}://${req.get('host')}/?invite=${token}`,
    message: `Приглашение для ${trimmedEmail} успешно создано.`,
  });
});

// Revoke invitation (Strictly Owner only)
router.post('/invites/:id/revoke', requireAuth, requireOwner, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const invite = db.revokeInvite(id, req.user!);

  if (!invite) {
    res.status(404).json({ error: 'Приглашение не найдено' });
    return;
  }

  res.json({
    success: true,
    invite,
    message: `Приглашение для ${invite.email} успешно отозвано.`,
  });
});

// Remove member from team (Strictly Owner only)
router.delete('/members/:id', requireAuth, requireOwner, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  if (id === req.user!.id) {
    res.status(400).json({ error: 'Вы не можете удалить собственный аккаунт из команды' });
    return;
  }

  try {
    const success = db.removeUserFromTeam(id, req.user!);
    if (!success) {
      res.status(404).json({ error: 'Пользователь не найден' });
      return;
    }

    res.json({
      success: true,
      message: 'Пользователь исключен из команды. Доступ к закрытым данным Veylor Hub немедленно аннулирован.',
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Ошибка исключения участника' });
  }
});

// Update member role or permissions (Strictly Owner only)
router.patch('/members/:id', requireAuth, requireOwner, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { role, permissions } = req.body;

  const targetUser = db.getUserById(id);
  if (!targetUser) {
    res.status(404).json({ error: 'Пользователь не найден' });
    return;
  }

  const updates: Partial<typeof targetUser> = {};
  if (role) updates.role = role;
  if (permissions) updates.permissions = { ...targetUser.permissions, ...permissions };

  const updated = db.updateUser(id, updates);

  db.addAuditLog({
    id: 'log_' + Date.now(),
    actorId: req.user!.id,
    actorName: req.user!.name,
    action: 'MEMBER_PERMISSIONS_UPDATED',
    details: `Владелец обновил параметры доступа для ${targetUser.name} (${targetUser.email})`,
    timestamp: new Date().toISOString(),
  });

  const { passwordHash, ...safe } = updated!;
  res.json({
    success: true,
    user: safe,
    message: 'Параметры участника успешно обновлены',
  });
});

// Direct approval of a registered user who is currently in 'pending_invite' state (Owner action)
router.post('/approve-pending/:userId', requireAuth, requireOwner, (req: AuthenticatedRequest, res: Response) => {
  const { userId } = req.params;
  const { role = 'member' } = req.body;

  const targetUser = db.getUserById(userId);
  if (!targetUser) {
    res.status(404).json({ error: 'Пользователь не найден' });
    return;
  }

  targetUser.role = (role === 'owner' ? 'owner' : 'member') as UserRole;
  targetUser.status = 'active_member';
  targetUser.joinedAt = new Date().toISOString();
  targetUser.invitedBy = req.user!.id;
  targetUser.permissions = {
    canManageTasks: true,
    canCreateProjects: role === 'owner',
    canPostUpdates: true,
  };
  db.save();

  db.addAuditLog({
    id: 'log_' + Date.now(),
    actorId: req.user!.id,
    actorName: req.user!.name,
    action: 'PENDING_USER_APPROVED',
    details: `Владелец ${req.user!.name} напрямую одобрил доступ для ${targetUser.name} (${targetUser.email})`,
    timestamp: new Date().toISOString(),
  });

  const { passwordHash, ...safe } = targetUser;
  res.json({
    success: true,
    user: safe,
    message: `Доступ для ${targetUser.name} одобрен. Пользователь включен в команду.`,
  });
});

// Get Audit Logs (Strictly Owner only)
router.get('/audit', requireAuth, requireOwner, (req: AuthenticatedRequest, res: Response) => {
  const logs = db.getAuditLogs();
  res.json({ logs });
});

export default router;
