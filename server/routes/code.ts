import { Router, Response } from 'express';
import { db } from '../db.js';
import { requireAuth, requireTeamMember, AuthenticatedRequest } from '../middleware.js';
import { CodeFile } from '../types.js';

const router = Router();

// Strictly protect all code files endpoints
router.use(requireAuth);
router.use(requireTeamMember);

// List all code files (optionally filtered by projectId)
router.get('/files', (req: AuthenticatedRequest, res: Response) => {
  const { projectId } = req.query;
  const files = db.getCodeFiles(projectId as string | undefined);
  res.json({ files });
});

// Save or update code file
router.post('/files', (req: AuthenticatedRequest, res: Response) => {
  const { id, name, language, content, projectId, projectName, description } = req.body;

  if (!name || typeof content !== 'string') {
    res.status(400).json({ error: 'Имя файла и содержимое обязательны' });
    return;
  }

  const savedFile = db.saveCodeFile({
    id,
    name: name.trim(),
    language: language || 'typescript',
    content,
    projectId,
    projectName,
    description,
  });

  res.json({
    success: true,
    file: savedFile,
  });
});

// Export files to a project
router.post('/files/export-to-project', (req: AuthenticatedRequest, res: Response) => {
  const { fileIds, projectId, projectName } = req.body;

  if (!Array.isArray(fileIds) || fileIds.length === 0 || !projectId) {
    res.status(400).json({ error: 'Необходимо указать файлы и проект для экспорта' });
    return;
  }

  const projects = db.getProjects();
  const proj = projects.find(p => p.id === projectId);
  const resolvedProjectName = projectName || proj?.title || 'Проект';

  const updatedFiles = db.exportFilesToProject(fileIds, projectId, resolvedProjectName);

  db.addAuditLog({
    id: 'log_' + Date.now(),
    actorId: req.user!.id,
    actorName: req.user!.name,
    action: 'FILES_EXPORTED_TO_PROJECT',
    details: `Экспортировано файлов: ${updatedFiles.length} в проект «${resolvedProjectName}»`,
    timestamp: new Date().toISOString(),
  });

  res.json({
    success: true,
    files: updatedFiles,
    message: `Успешно экспортировано ${updatedFiles.length} файлов в проект «${resolvedProjectName}»`,
  });
});

// Delete code file
router.delete('/files/:id', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const files = db.getCodeFiles();
  const target = files.find(f => f.id === id);

  const deleted = db.deleteCodeFile(id);

  if (!deleted) {
    res.status(404).json({ error: 'Файл не найден' });
    return;
  }

  db.addAuditLog({
    id: 'log_' + Date.now(),
    actorId: req.user!.id,
    actorName: req.user!.name,
    action: 'CODE_FILE_DELETED',
    details: `Удален файл кода: «${target?.name || id}»`,
    timestamp: new Date().toISOString(),
  });

  res.json({
    success: true,
    id,
    message: 'Файл успешно удален',
  });
});

export default router;
