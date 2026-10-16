import { Router, Response } from 'express';
import { db } from '../db.js';
import { requireAuth, requireTeamMember, AuthenticatedRequest } from '../middleware.js';
import { ChatMessage } from '../types.js';

const router = Router();

// Strictly protect all chat endpoints
router.use(requireAuth);
router.use(requireTeamMember);

// List messages
router.get('/messages', (req: AuthenticatedRequest, res: Response) => {
  const { channelId, recipientId } = req.query;
  const messages = db.getMessages(
    channelId as string | undefined,
    recipientId as string | undefined,
    req.user!.id
  );
  res.json({ messages });
});

// Send new message
router.post('/messages', (req: AuthenticatedRequest, res: Response) => {
  const { channelId, recipientId, content, codeSnippet, stickerId } = req.body;

  if (!content && !codeSnippet && !stickerId) {
    res.status(400).json({ error: 'Сообщение не может быть пустым' });
    return;
  }

  const newMessage: ChatMessage = {
    id: 'msg_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
    senderId: req.user!.id,
    senderName: req.user!.name,
    senderAvatar: req.user!.avatar,
    senderRole: req.user!.role!,
    channelId: channelId || undefined,
    recipientId: recipientId || undefined,
    content: (content || '').trim(),
    stickerId: stickerId || undefined,
    codeSnippet: codeSnippet ? {
      code: codeSnippet.code,
      language: codeSnippet.language || 'typescript',
    } : undefined,
    reactions: {},
    createdAt: new Date().toISOString(),
  };

  db.addMessage(newMessage);

  res.status(201).json({
    success: true,
    message: newMessage,
  });
});

// Edit message (only author or owner)
router.put('/messages/:id', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { content } = req.body;

  if (!content || !content.trim()) {
    res.status(400).json({ error: 'Содержимое сообщения не может быть пустым' });
    return;
  }

  const isOwner = req.user!.role === 'owner';
  const updatedMessage = db.editMessage(id, content, req.user!.id, isOwner);

  if (!updatedMessage) {
    res.status(403).json({ error: 'Недостаточно прав для редактирования или сообщение не найдено' });
    return;
  }

  res.json({
    success: true,
    message: updatedMessage,
  });
});

// Delete message (only author or owner)
router.delete('/messages/:id', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const forEveryone = req.query.forEveryone !== 'false' && req.body?.forEveryone !== false;
  const isOwner = req.user!.role === 'owner';

  const deleted = db.deleteMessage(id, req.user!.id, isOwner, forEveryone);

  if (!deleted) {
    res.status(403).json({ error: 'Недостаточно прав для удаления или сообщение не найдено' });
    return;
  }

  res.json({
    success: true,
    id,
    message: 'Сообщение удалено',
  });
});

// React with emoji
router.post('/messages/:id/react', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { emoji } = req.body;

  if (!emoji) {
    res.status(400).json({ error: 'Emoji is required' });
    return;
  }

  const updatedMessage = db.toggleReaction(id, emoji, req.user!.id);
  if (!updatedMessage) {
    res.status(404).json({ error: 'Сообщение не найдено' });
    return;
  }

  res.json({
    success: true,
    message: updatedMessage,
  });
});

export default router;
