
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

export type Deal = {
  id: string;
  contact_id: string;
  title: string;
  amount: number;
  due_date: string | null;
  status: string;
  invoice_status?: string;
  notes?: string | null;
  created_at: string;
  user_id: string;
  items?: any | null;
  contact?: {
    id: string;
    name: string;
    company: string;
  };
  proposal_id?: string | null;
};

// For backward compatibility - use Deal as Invoice
export type Invoice = Deal;

export type User = {
  id: string;
  email: string;
  name?: string;
};
