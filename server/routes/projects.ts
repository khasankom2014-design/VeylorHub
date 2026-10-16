import { Router, Response } from 'express';
import { db } from '../db.js';
import { requireAuth, requireTeamMember, AuthenticatedRequest } from '../middleware.js';
import { Project } from '../types.js';

const router = Router();

// Strictly protect all project endpoints
router.use(requireAuth);
router.use(requireTeamMember);

// List projects
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const projects = db.getProjects();
  res.json({ projects });
});

// Create project
router.post('/', (req: AuthenticatedRequest, res: Response) => {
  const { title, description, code, color } = req.body;
  if (!title) {
    res.status(400).json({ error: 'Название проекта обязательно' });
    return;
  }

  // Check permissions: Owner or member with canCreateProjects
  if (req.user?.role !== 'owner' && !req.user?.permissions?.canCreateProjects) {
    res.status(403).json({ error: 'У вас нет прав на создание новых проектов' });
    return;
  }

  const newProject: Project = {
    id: 'prj_' + Date.now().toString(36),
    title: title.trim(),
    description: description?.trim() || '',
    code: (code || title.substring(0, 3)).toUpperCase().trim(),
    color: color || '#6366f1',
    status: 'active',
    createdBy: req.user!.id,
    createdAt: new Date().toISOString(),
    membersCount: 1,
  };

  db.addProject(newProject);

  db.addAuditLog({
    id: 'log_' + Date.now(),
    actorId: req.user!.id,
    actorName: req.user!.name,
    action: 'PROJECT_CREATED',
    details: `Создан новый проект «${newProject.title}» (${newProject.code})`,
    timestamp: new Date().toISOString(),
  });

  res.status(201).json({ success: true, project: newProject });
});

// Delete project
router.delete('/:id', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  // Only owner or project creator can delete
  const projects = db.getProjects();
  const target = projects.find(p => p.id === id);
  if (!target) {
    res.status(404).json({ error: 'Проект не найден' });
    return;
  }

  if (req.user?.role !== 'owner' && target.createdBy !== req.user?.id) {
    res.status(403).json({ error: 'Недостаточно прав для удаления проекта' });
    return;
  }

  const deleted = db.deleteProject(id);
  if (!deleted) {
    res.status(404).json({ error: 'Проект не найден' });
    return;
  }

  db.addAuditLog({
    id: 'log_' + Date.now(),
    actorId: req.user!.id,
    actorName: req.user!.name,
    action: 'PROJECT_DELETED',
    details: `Проект «${target.title}» (${target.code}) удален`,
    timestamp: new Date().toISOString(),
  });

  res.json({ success: true, message: 'Проект успешно удален' });
});

export default router;
