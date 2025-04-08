
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { ProposalWithContact } from "@/components/proposals/types";

export const useProposals = (userId: string | undefined) => {
  const [proposals, setProposals] = useState<ProposalWithContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isConvertingToInvoice, setIsConvertingToInvoice] = useState(false);

  useEffect(() => {
    if (!userId) return;
    fetchProposals();
  }, [userId]);

  const fetchProposals = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("deals")
        .select(`
          *,
          contact:contact_id (
            id, name, company, email, phone
          )
        `)
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      console.log("Fetched proposals:", data);
      
      const proposalsWithContacts = data.map((item: any) => ({
        ...item,
        contact: item.contact,
      }));
      
      setProposals(proposalsWithContacts);
    } catch (error) {
      console.error("Error fetching proposals:", error);
      toast.error("Failed to load proposals");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (proposalId: string, newStatus: 'open' | 'accepted' | 'refused') => {
    try {
      setIsUpdatingStatus(true);
      const { error } = await supabase
        .from("deals")
        .update({ status: newStatus })
        .eq("id", proposalId);

      if (error) throw error;
      
      setProposals(proposals.map(p => p.id === proposalId ? { ...p, status: newStatus } : p));
      
      toast.success(`Proposal marked as ${newStatus}`);
    } catch (error) {
      console.error("Error updating proposal status:", error);
      toast.error("Failed to update proposal status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleConvertToInvoice = async (proposal: ProposalWithContact) => {
    try {
      setIsConvertingToInvoice(true);
      
      // Prepare the invoice data using the existing proposal data
      const invoiceData = {
        contact_id: proposal.contact_id,
        title: `Invoice for: ${proposal.title}`,
        amount: proposal.amount,
        notes: proposal.notes,
        status: "invoice", 
        invoice_status: "pending",
        due_date: proposal.due_date,
        user_id: userId
        // Removed proposal_id field as it doesn't exist in the schema
      };
      
      console.log("Creating invoice with data:", invoiceData);
      
      // Insert the invoice into the deals table
      const { data: newInvoice, error } = await supabase
        .from("deals")
        .insert(invoiceData)
        .select('id')
        .single();

      if (error) {
        console.error("Error creating invoice:", error);
        throw error;
      }
      
      console.log("Invoice created successfully:", newInvoice);
      
      // Show success message
      toast.success("Invoice created successfully!");
      
      return newInvoice.id;
    } catch (error: any) {
      console.error("Error creating invoice:", error);
      // Show detailed error message
      toast.error(`Failed to create invoice: ${error.message || "Please try again"}`);
      return null;
    } finally {
      setIsConvertingToInvoice(false);
    }
  };

  return {
    proposals,
    loading,
    isUpdatingStatus,
    isConvertingToInvoice,
    fetchProposals,
    handleStatusChange,
    handleConvertToInvoice
  };
};
