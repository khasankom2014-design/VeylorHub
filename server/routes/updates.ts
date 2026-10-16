import { Router, Response } from 'express';
import { db } from '../db.js';
import { requireAuth, requireTeamMember, AuthenticatedRequest } from '../middleware.js';
import { TeamUpdate } from '../types.js';

const router = Router();

// Strictly protect all updates endpoints
router.use(requireAuth);
router.use(requireTeamMember);

// List updates
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const updates = db.getUpdates();
  res.json({ updates });
});

// Create update
router.post('/', (req: AuthenticatedRequest, res: Response) => {
  const { title, content, category = 'general' } = req.body;
  if (!title || !content) {
    res.status(400).json({ error: 'Заголовок и содержание обязательны' });
    return;
  }

  const newUpdate: TeamUpdate = {
    id: 'upd_' + Date.now().toString(36),
    authorId: req.user!.id,
    authorName: req.user!.name,
    authorRole: req.user!.role!,
    authorAvatar: req.user!.avatar,
    title: title.trim(),
    content: content.trim(),
    category,
    createdAt: new Date().toISOString(),
  };

  db.addUpdate(newUpdate);

  res.status(201).json({ success: true, update: newUpdate });
});

export default router;
