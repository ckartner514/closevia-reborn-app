
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { ProposalWithContact } from "@/components/proposals/types";

export const useProposals = (userId: string | undefined) => {
  const [proposals, setProposals] = useState<ProposalWithContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isConvertingToInvoice, setIsConvertingToInvoice] = useState(false);
  const [isDeletingProposal, setIsDeletingProposal] = useState(false);

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
        .neq("status", "invoice") // This specifically excludes invoices
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

  const handleStatusChange = async (proposalId: string, newStatus: string) => {
    try {
      setIsUpdatingStatus(true);
      
      console.log(`Updating proposal ${proposalId} status to: ${newStatus}`);
      
      const { error } = await supabase
        .from("deals")
        .update({ status: newStatus })
        .eq("id", proposalId);

      if (error) throw error;
      
      // Update the local state with the new status
      setProposals(proposals.map(p => 
        p.id === proposalId ? { ...p, status: newStatus } : p
      ));
      
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
      
      // Refresh proposals to ensure the list is updated
      fetchProposals();
      
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

  const deleteProposal = async (proposalId: string) => {
    try {
      setIsDeletingProposal(true);
      
      const { error } = await supabase
        .from("deals")
        .delete()
        .eq("id", proposalId)
        .eq("user_id", userId);

      if (error) throw error;
      
      // Remove the deleted proposal from the state
      setProposals(proposals.filter(p => p.id !== proposalId));
      
      toast.success("Proposal deleted successfully");
      return true;
    } catch (error) {
      console.error("Error deleting proposal:", error);
      toast.error("Failed to delete proposal");
      return false;
    } finally {
      setIsDeletingProposal(false);
    }
  };

  return {
    proposals,
    loading,
    isUpdatingStatus,
    isConvertingToInvoice,
    isDeletingProposal,
    fetchProposals,
    handleStatusChange,
    handleConvertToInvoice,
    deleteProposal
  };
};
