
import { createClient } from '@supabase/supabase-js';

// These environment variables are automatically available through the Lovable's Supabase integration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase credentials are missing. Make sure you have connected your Supabase project.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Define types for database tables
export type Contact = {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  last_interaction: string | null;
  created_at: string;
  user_id: string;
};

export type ContactComment = {
  id: string;
  contact_id: string;
  comment: string;
  created_at: string;
  user_id: string;
};

export type Proposal = {
  id: string;
  contact_id: string;
  title: string;
  description: string;
  amount: number;
  follow_up_date: string | null;
  status: 'Pending' | 'Accepted' | 'Refused';
  created_at: string;
  user_id: string;
};

export type Invoice = {
  id: string;
  contact_id: string;
  proposal_id?: string | null;
  amount: number;
  created_at: string;
  user_id: string;
  contact?: {
    id: string;
    name: string;
    company: string;
  };
};

export type User = {
  id: string;
  email: string;
  name?: string;
};
