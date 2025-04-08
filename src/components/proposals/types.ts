
import { Contact } from "@/lib/supabase";

export type Proposal = {
  id: string;
  contact_id: string;
  title: string;
  notes: string | null;
  amount: number;
  due_date: string | null;
  status: 'open' | 'accepted' | 'refused' | 'lost' | 'pending';
  created_at: string;
  user_id: string;
};

export type ProposalWithContact = Proposal & {
  contact: Contact;
};
