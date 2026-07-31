import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { processGeminiRequest } from './src/server/geminiHandler.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parser with 10mb limit for base64 image data
  app.use(express.json({ limit: '10mb' }));

  // API Route for Gemini analysis
  const handleGeminiAnalysis = async (req: express.Request, res: express.Response) => {
    try {
      const result = await processGeminiRequest(req.body);
      return res.status(result.success ? 200 : 400).json(result);
    } catch (err: any) {
      console.error('Error in /api/gemini route:', err);
      return res.status(500).json({
        success: false,
        error: err.message || '서버 응답을 처리하는 중 오류가 발생했습니다.',
      });
    }
  };

  app.post('/api/gemini', handleGeminiAnalysis);
  app.post('/api/gemini/route', handleGeminiAnalysis);

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
