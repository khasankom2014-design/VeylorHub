import crypto from 'crypto';
import { db } from './db.js';
import { User } from './types.js';

// In-memory token store mapping token -> userId
const sessions = new Map<string, { userId: string; createdAt: number }>();

export function createSession(userId: string): string {
  const token = 'vh_tok_' + crypto.randomBytes(24).toString('hex');
  sessions.set(token, {
    userId,
    createdAt: Date.now(),
  });
  return token;
}

export function getUserFromToken(token: string | undefined): User | null {
  if (!token) return null;
  
  // Clean 'Bearer ' prefix if present
  const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token;
  const session = sessions.get(cleanToken);
  if (!session) return null;

  // Retrieve current fresh user state from DB
  const user = db.getUserById(session.userId);
  if (!user) {
    sessions.delete(cleanToken);
    return null;
  }

  return user;
}

export function revokeSession(token: string | undefined) {
  if (!token) return;
  const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token;
  sessions.delete(cleanToken);
}

// Generate random invite token
export function generateInviteToken(): string {
  return 'inv_' + crypto.randomBytes(12).toString('hex');
}
