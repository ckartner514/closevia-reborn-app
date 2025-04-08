
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { InvoiceWithContact } from "@/components/invoices/types";
import { toast } from "sonner";

export const useInvoices = (userId: string | undefined) => {
  const [invoices, setInvoices] = useState<InvoiceWithContact[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!userId) return;
    fetchInvoices();
  }, [userId]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      console.log("Fetching invoices for user:", userId);
      
      const { data, error } = await supabase
        .from("deals")
        .select(`
          *,
          contact:contact_id (
            id, name, company
          )
        `)
        .eq("user_id", userId!)
        .eq("status", "invoice")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching invoices:", error);
        throw error;
      }
      
      console.log("Fetched invoices:", data);
      
      const invoicesWithContacts = data.map((item: any) => ({
        ...item,
        contact: item.contact
      }));
      
      setInvoices(invoicesWithContacts);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      toast.error("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  return {
    invoices,
    loading,
    fetchInvoices
  };
};
