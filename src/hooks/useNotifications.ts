
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { format, isPast, parseISO } from "date-fns";
import { supabase } from "@/lib/supabase";

export type Notification = {
  id: string;
  title: string;
  client: string;
  date: string;
  type: 'proposal' | 'invoice';
};

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchNotifications();
  }, [user]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      
      // Fetch all proposals that are still open and have a past follow-up date
      const { data: overdueProposals, error: proposalsError } = await supabase
        .from("deals")
        .select(`
          id, 
          title, 
          due_date,
          contact:contact_id (
            id, name
          )
        `)
        .eq("user_id", user!.id)
        .eq("status", "open")
        .not("due_date", "is", null)
        .neq("status", "invoice");
      
      if (proposalsError) throw proposalsError;
      
      // Fetch all invoices that are pending and have a past due date
      const { data: overdueInvoices, error: invoicesError } = await supabase
        .from("deals")
        .select(`
          id, 
          title, 
          due_date,
          contact:contact_id (
            id, name
          )
        `)
        .eq("user_id", user!.id)
        .eq("status", "invoice")
        .eq("invoice_status", "pending")
        .not("due_date", "is", null);
      
      if (invoicesError) throw invoicesError;
      
      // Process proposals to find those with past due_date
      const proposalNotifications = overdueProposals
        .filter(proposal => proposal.due_date && isPast(parseISO(proposal.due_date)))
        .map(proposal => {
          // Check if contact exists and is properly structured
          let clientName = 'Unknown Client';
          if (proposal.contact && typeof proposal.contact === 'object' && !Array.isArray(proposal.contact)) {
            clientName = proposal.contact.name || 'Unknown Client';
          }
          
          return {
            id: proposal.id,
            title: proposal.title,
            client: clientName,
            date: proposal.due_date ? format(parseISO(proposal.due_date), 'PP') : 'Unknown',
            type: 'proposal' as const
          };
        });
      
      // Process invoices to find those with past due_date
      const invoiceNotifications = overdueInvoices
        .filter(invoice => invoice.due_date && isPast(parseISO(invoice.due_date)))
        .map(invoice => {
          // Check if contact exists and is properly structured
          let clientName = 'Unknown Client';
          if (invoice.contact && typeof invoice.contact === 'object' && !Array.isArray(invoice.contact)) {
            clientName = invoice.contact.name || 'Unknown Client';
          }
          
          return {
            id: invoice.id,
            title: invoice.title,
            client: clientName,
            date: invoice.due_date ? format(parseISO(invoice.due_date), 'PP') : 'Unknown',
            type: 'invoice' as const
          };
        });
      
      // Combine all notifications
      setNotifications([...proposalNotifications, ...invoiceNotifications]);
      
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  return {
    notifications,
    loading,
    refreshNotifications: fetchNotifications
  };
};
