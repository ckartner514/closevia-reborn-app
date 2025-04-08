
import { createClient } from '@supabase/supabase-js';

// Use the direct values from the Supabase integration
const supabaseUrl = "https://xduyycigyknioeqyynfp.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkdXl5Y2lneWtuaW9lcXl5bmZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5OTIwMjcsImV4cCI6MjA1OTU2ODAyN30.8_l0FMbt0THLeERo4nHx7S-gtDbyRHH9H_ZJpYEJRk0";

// Create the Supabase client with explicit configuration
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'closevia-auth-storage',
  }
});

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
