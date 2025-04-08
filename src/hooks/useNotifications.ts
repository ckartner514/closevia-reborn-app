
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
  viewed: boolean; // Track if notification has been viewed
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  
  // Fetch notifications on component mount
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

      // Check for viewed notifications in local storage
      const viewedNotifications = JSON.parse(localStorage.getItem('viewedNotifications') || '{}');
      // Check for deleted notifications in local storage
      const deletedNotifications = JSON.parse(localStorage.getItem('deletedNotifications') || '{}');

      const proposalNotifications: NotificationItem[] =
        (proposals || [])
          .filter((deal) => deal.due_date && isBefore(new Date(deal.due_date), today))
          .filter((deal) => !deletedNotifications[deal.id]) // Filter out deleted notifications
          .map((deal) => ({
            id: deal.id,
            title: deal.title,
            due_date: format(new Date(deal.due_date), "PPP"),
            contact: Array.isArray(deal.contact)
              ? (deal.contact[0] as { id: string; name: string })
              : (deal.contact as { id: string; name: string }),
            type: "proposal",
            viewed: Boolean(viewedNotifications[deal.id])
          }));

      const invoiceNotifications: NotificationItem[] =
        (invoices || [])
          .filter((deal) => deal.due_date && isBefore(new Date(deal.due_date), today))
          .filter((deal) => !deletedNotifications[deal.id]) // Filter out deleted notifications
          .map((deal) => ({
            id: deal.id,
            title: deal.title,
            due_date: format(new Date(deal.due_date), "PPP"),
            contact: Array.isArray(deal.contact)
              ? (deal.contact[0] as { id: string; name: string })
              : (deal.contact as { id: string; name: string }),
            type: "invoice",
            viewed: Boolean(viewedNotifications[deal.id])
          }));

      setNotifications([...proposalNotifications, ...invoiceNotifications]);
    };

    fetchNotifications();
    
    // Set up a refresh interval to check for new notifications (due dates that have passed)
    const refreshInterval = setInterval(fetchNotifications, 60000); // Check every minute
    
    return () => {
      clearInterval(refreshInterval);
    };
  }, []);

  // Mark a notification as viewed
  const markAsViewed = (notificationId: string) => {
    // Update local state
    setNotifications(prev => prev.map(notification => 
      notification.id === notificationId ? { ...notification, viewed: true } : notification
    ));
    
    // Store in local storage to persist across sessions
    const viewedNotifications = JSON.parse(localStorage.getItem('viewedNotifications') || '{}');
    viewedNotifications[notificationId] = true;
    localStorage.setItem('viewedNotifications', JSON.stringify(viewedNotifications));
  };

  // Delete a notification
  const deleteNotification = (notificationId: string) => {
    // Update local state by removing the notification
    setNotifications(prev => prev.filter(notification => notification.id !== notificationId));
    
    // Store in local storage to persist across sessions
    const deletedNotifications = JSON.parse(localStorage.getItem('deletedNotifications') || '{}');
    deletedNotifications[notificationId] = true;
    localStorage.setItem('deletedNotifications', JSON.stringify(deletedNotifications));
  };

  // Get count of unviewed notifications
  const unviewedCount = notifications.filter(notification => !notification.viewed).length;

  return { notifications, markAsViewed, deleteNotification, unviewedCount };
};
