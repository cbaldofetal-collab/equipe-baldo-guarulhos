import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    const [doctorsRes, shiftsRes, tradesRes] = await Promise.all([
      supabase.from('doctors').select('*').limit(1000),
      supabase.from('shifts').select('*').limit(1000),
      supabase.from('trades').select('*').limit(1000),
    ]);

    res.json({
      doctors: doctorsRes.data || [],
      shifts: shiftsRes.data || [],
      trades: tradesRes.data || [],
      auditLogs: [],
    });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Error fetching state' });
  }
}
