import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import authRouter from './server/routes/auth.js';
import teamRouter from './server/routes/team.js';
import projectsRouter from './server/routes/projects.js';
import tasksRouter from './server/routes/tasks.js';
import updatesRouter from './server/routes/updates.js';
import aiRouter from './server/routes/ai.js';
import chatRouter from './server/routes/chat.js';
import codeRouter from './server/routes/code.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  app.use(express.json());

  // Mount API routers
  app.use('/api/auth', authRouter);
  app.use('/api/team', teamRouter);
  app.use('/api/projects', projectsRouter);
  app.use('/api/tasks', tasksRouter);
  app.use('/api/updates', updatesRouter);
  app.use('/api/ai', aiRouter);
  app.use('/api/chat', chatRouter);
  app.use('/api/code', codeRouter);

  // Vite integration or static serving
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Veylor Hub server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
