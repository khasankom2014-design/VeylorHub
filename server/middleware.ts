import { Request, Response, NextFunction } from 'express';
import { getUserFromToken } from './auth.js';
import { User } from './types.js';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Требуется авторизация в системе',
    });
    return;
  }

  const user = getUserFromToken(authHeader);
  if (!user) {
    res.status(401).json({
      error: 'INVALID_TOKEN',
      message: 'Сессия недействительна или истекла. Пожалуйста, выполните вход повторно.',
    });
    return;
  }

  req.user = user;
  next();
}

/**
 * Ensures user is an active team member with an assigned role.
 * Any registered user without team membership (pending_invite) is strictly blocked!
 */
export function requireTeamMember(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Требуется авторизация',
    });
    return;
  }

  if (req.user.status !== 'active_member' || !req.user.role) {
    res.status(403).json({
      error: 'PENDING_INVITE',
      message: 'Ваш аккаунт создан, но у вас пока нет доступа к Veylor Hub. Дождитесь, пока владелец платформы добавит вас в команду.',
      userStatus: req.user.status,
    });
    return;
  }

  next();
}

/**
 * Ensures user is the Workspace Owner.
 * Required for team management, invites, revokes, role modifications, and audit logs.
 */
export function requireOwner(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Требуется авторизация',
    });
    return;
  }

  if (req.user.status !== 'active_member' || req.user.role !== 'owner') {
    res.status(403).json({
      error: 'FORBIDDEN_NOT_OWNER',
      message: 'Действие доступно только владельцу платформы Veylor Hub',
    });
    return;
  }

  next();
}
