import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Ensures a demo user exists in the system and returns their ID.
 * Since this is a hackathon MVP, we use a single static user for the voice diary.
 */
export async function ensureDemoUser() {
  const DEMO_USER_ID = 'demo-user-123';
  return DEMO_USER_ID;
}
