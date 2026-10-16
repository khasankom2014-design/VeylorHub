import { Router, Response } from 'express';
import { db } from '../db.js';
import { requireAuth, requireTeamMember, AuthenticatedRequest } from '../middleware.js';
import { Task } from '../types.js';

const router = Router();

// Strictly protect all tasks endpoints
router.use(requireAuth);
router.use(requireTeamMember);

// List tasks (Veylor Flow)
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const { projectId } = req.query;
  let tasks = db.getTasks();
  if (projectId) {
    tasks = tasks.filter(t => t.projectId === projectId);
  }
  res.json({ tasks });
});

// Create task
router.post('/', (req: AuthenticatedRequest, res: Response) => {
  const { title, description, projectId, priority = 'medium', assigneeId, status = 'todo' } = req.body;

  if (!title || !projectId) {
    res.status(400).json({ error: 'Название задачи и проект обязательны' });
    return;
  }

  let assigneeName: string | undefined;
  let assigneeAvatar: string | undefined;

  if (assigneeId) {
    const assignee = db.getUserById(assigneeId);
    if (assignee) {
      assigneeName = assignee.name;
      assigneeAvatar = assignee.avatar;
    }
  }

  const newTask: Task = {
    id: 'tsk_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
    projectId,
    title: title.trim(),
    description: description?.trim() || '',
    status,
    priority,
    assigneeId,
    assigneeName,
    assigneeAvatar,
    createdBy: req.user!.id,
    createdByName: req.user!.name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.addTask(newTask);

  db.addAuditLog({
    id: 'log_' + Date.now(),
    actorId: req.user!.id,
    actorName: req.user!.name,
    action: 'TASK_CREATED',
    details: `Создана задача «${newTask.title}» в Veylor Flow`,
    timestamp: new Date().toISOString(),
  });

  res.status(201).json({ success: true, task: newTask });
});

// Update task status or details
router.patch('/:id', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status, title, description, priority, assigneeId } = req.body;

  const updates: Partial<Task> = {};
  if (status !== undefined) updates.status = status;
  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (priority !== undefined) updates.priority = priority;

  if (assigneeId !== undefined) {
    if (assigneeId === null || assigneeId === '') {
      updates.assigneeId = undefined;
      updates.assigneeName = undefined;
      updates.assigneeAvatar = undefined;
    } else {
      const assignee = db.getUserById(assigneeId);
      if (assignee) {
        updates.assigneeId = assignee.id;
        updates.assigneeName = assignee.name;
        updates.assigneeAvatar = assignee.avatar;
      }
    }
  }

  const updated = db.updateTask(id, updates);
  if (!updated) {
    res.status(404).json({ error: 'Задача не найдена' });
    return;
  }

  res.json({ success: true, task: updated });
});

// Delete task
router.delete('/:id', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const success = db.deleteTask(id);
  if (!success) {
    res.status(404).json({ error: 'Задача не найдена' });
    return;
  }
  res.json({ success: true });
});

export default router;
