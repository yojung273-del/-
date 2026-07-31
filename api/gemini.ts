import type { VercelRequest, VercelResponse } from '@vercel/node';
import { processGeminiRequest } from '../src/server/geminiHandler';

export const config = {
  maxDuration: 30, // Extend Vercel function timeout allowance
};

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
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        body = {};
      }
    }
    body = body || {};

    const result = await processGeminiRequest(body);
    return res.status(result.success ? 200 : 400).json(result);
  } catch (err: any) {
    console.error('Vercel API route invocation error:', err);
    return res.status(500).json({
      success: false,
      error: `Vercel 함수 실행 오류: ${err?.message || '알 수 없는 서버 오류가 발생했습니다.'}`,
    });
  }
}
