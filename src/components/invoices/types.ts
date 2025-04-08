
import { Contact } from "@/lib/supabase";

export type Invoice = {
  id: string;
  contact_id: string;
  title: string;
  notes: string | null;
  amount: number;
  due_date: string | null;
  status: string;
  invoice_status: string;
  created_at: string;
  user_id: string;
  items?: any | null;
};

export type InvoiceWithContact = Invoice & {
  contact: {
    id: string;
    name: string;
    company: string;
  };
};
