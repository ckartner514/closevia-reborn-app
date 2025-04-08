
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { format, isBefore } from "date-fns";

export interface NotificationItem {
  id: string;
  title: string;
  due_date: string;
  contact: {
    id: string;
    name: string;
  };
  type: "proposal" | "invoice";
}

export const useNotifications = (): NotificationItem[] => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      const today = new Date();

      const { data: proposals, error: proposalsError } = await supabase
        .from("deals")
        .select("id, title, due_date, contact:contacts(id, name)")
        .eq("status", "accepted");

      const { data: invoices, error: invoicesError } = await supabase
        .from("deals")
        .select("id, title, due_date, contact:contacts(id, name)")
        .eq("status", "invoice")
        .eq("invoice_status", "pending");

      if (proposalsError || invoicesError) {
        console.error("Error fetching notifications:", proposalsError || invoicesError);
        return;
      }

      const proposalNotifications: NotificationItem[] =
        (proposals || [])
          .filter((deal) => deal.due_date && isBefore(new Date(deal.due_date), today))
          .map((deal) => ({
            id: deal.id,
            title: deal.title,
            due_date: format(new Date(deal.due_date), "PPP"),
            contact: Array.isArray(deal.contact)
              ? (deal.contact[0] as { id: string; name: string })
              : (deal.contact as { id: string; name: string }),
            type: "proposal",
          }));

      const invoiceNotifications: NotificationItem[] =
        (invoices || [])
          .filter((deal) => deal.due_date && isBefore(new Date(deal.due_date), today))
          .map((deal) => ({
            id: deal.id,
            title: deal.title,
            due_date: format(new Date(deal.due_date), "PPP"),
            contact: Array.isArray(deal.contact)
              ? (deal.contact[0] as { id: string; name: string })
              : (deal.contact as { id: string; name: string }),
            type: "invoice",
          }));

      setNotifications([...proposalNotifications, ...invoiceNotifications]);
    };

    fetchNotifications();
  }, []);

  return notifications;
};
