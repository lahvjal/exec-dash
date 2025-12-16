import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env.local file');
}

// Client for browser/client-side
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Service role client for server-side admin operations
export const getServiceRoleClient = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!serviceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  }
  
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

// Database types
export interface GoalRecord {
  id: number;
  kpi_id: string;
  period: string;
  value: number;
  created_at: string;
  updated_at: string;
}

export interface GoalsTable {
  Row: GoalRecord;
  Insert: Omit<GoalRecord, 'id' | 'created_at' | 'updated_at'>;
  Update: Partial<Omit<GoalRecord, 'id' | 'created_at' | 'updated_at'>>;
}

export interface Database {
  public: {
    Tables: {
      goals: GoalsTable;
    };
  };
}
