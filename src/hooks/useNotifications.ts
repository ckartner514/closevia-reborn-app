
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Contact, Deal } from "@/types";

export interface NotificationItem {
  id: string;
  title: string;
  due_date: string;
  contact: {
    id: string;
    name: string;
  };
  type: "invoice" | "proposal";
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      const today = new Date().toISOString().split("T")[0];

      // Fetch overdue proposals
      const { data: overdueProposals, error: proposalsError } = await supabase
        .from("deals")
        .select("id, title, due_date, contact(id, name)")
        .eq("status", "proposal")
        .lt("due_date", today);

      // Fetch unpaid & overdue invoices
      const { data: unpaidInvoices, error: invoicesError } = await supabase
        .from("deals")
        .select("id, title, due_date, contact(id, name)")
        .eq("status", "invoice")
        .eq("invoice_status", "pending")
        .lt("due_date", today);

      if (proposalsError || invoicesError) {
        console.error("Error fetching notifications:", proposalsError || invoicesError);
        return;
      }

      const proposalNotifications = (overdueProposals ?? []).map((deal) => ({
        id: deal.id,
        title: deal.title,
        due_date: deal.due_date,
        contact: deal.contact as { id: string; name: string },
        type: "proposal" as const,
      }));

      const invoiceNotifications = (unpaidInvoices ?? []).map((deal) => ({
        id: deal.id,
        title: deal.title,
        due_date: deal.due_date,
        contact: deal.contact as { id: string; name: string },
        type: "invoice" as const,
      }));

      setNotifications([...proposalNotifications, ...invoiceNotifications]);
    };

    fetchNotifications();
  }, []);

  return notifications;
};
