
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { InvoiceWithContact } from "@/components/invoices/types";
import { toast } from "sonner";

export const useInvoices = (userId: string | undefined) => {
  const [invoices, setInvoices] = useState<InvoiceWithContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  
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

  const updateInvoiceStatus = async (invoiceId: string, newStatus: string) => {
    try {
      setIsUpdatingStatus(true);
      console.log(`Updating invoice ${invoiceId} status to ${newStatus}`);
      
      const { error } = await supabase
        .from("deals")
        .update({ invoice_status: newStatus })
        .eq("id", invoiceId)
        .eq("user_id", userId);

      if (error) {
        console.error("Error updating invoice status:", error);
        throw error;
      }
      
      // Update local state
      setInvoices(
        invoices.map(invoice => 
          invoice.id === invoiceId 
            ? { ...invoice, invoice_status: newStatus } 
            : invoice
        )
      );
      
      toast.success(`Invoice marked as ${newStatus}`);
    } catch (error) {
      console.error("Error updating invoice status:", error);
      toast.error("Failed to update invoice status");
      throw error;
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return {
    invoices,
    loading,
    isUpdatingStatus,
    fetchInvoices,
    updateInvoiceStatus
  };
};
