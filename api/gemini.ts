import type { VercelRequest, VercelResponse } from '@vercel/node';
import { processGeminiRequest } from '../src/server/geminiHandler';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS configuration for Vercel Serverless Function
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const result = await processGeminiRequest(req.body || {});
    return res.status(result.success ? 200 : 400).json(result);
  } catch (err: any) {
    console.error('Vercel API route error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || '서버 응답 처리 중 오류가 발생했습니다.',
    });
  }
}
