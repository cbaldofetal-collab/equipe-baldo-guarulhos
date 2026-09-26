import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    message: 'Equipe Baldo São Caetano - API OK!',
    timestamp: new Date().toISOString()
  });
}
