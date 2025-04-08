
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";

// Custom Components
import { ProposalFilters } from "@/components/proposals/ProposalFilters";
import { ProposalTable } from "@/components/proposals/ProposalTable";
import { ProposalDetailsDialog } from "@/components/proposals/ProposalDetailsDialog";
import { ProposalEmptyState } from "@/components/proposals/ProposalEmptyState";
import { ProposalWithContact } from "@/components/proposals/types";
import { useProposals } from "@/hooks/useProposals";
import { toast } from "sonner";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const ProposalsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedProposal, setSelectedProposal] = useState<ProposalWithContact | null>(null);
  const [proposalToDelete, setProposalToDelete] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  const {
    proposals,
    loading,
    isUpdatingStatus,
    isConvertingToInvoice,
    isDeletingProposal,
    fetchProposals,
    handleStatusChange,
    handleConvertToInvoice,
    deleteProposal
  } = useProposals(user?.id);

  const handleCreateNewProposal = () => {
    navigate("/create");
  };

  const handleConvertSelectedToInvoice = async () => {
    if (!selectedProposal) {
      toast.error("No proposal selected");
      return;
    }
    
    console.log("Converting proposal to invoice:", selectedProposal);
    
    // Create the invoice
    const invoiceId = await handleConvertToInvoice(selectedProposal);
    
    if (invoiceId) {
      console.log("Successfully created invoice with ID:", invoiceId);
      // Refresh proposals list to reflect changes
      fetchProposals();
      // Only navigate to invoices page on success
      navigate("/invoices");
    } else {
      console.error("Failed to create invoice - no invoice ID returned");
    }
  };

  const handleDeleteProposal = async () => {
    if (!proposalToDelete) return;
    
    const success = await deleteProposal(proposalToDelete);
    if (success) {
      setDeleteDialogOpen(false);
      setProposalToDelete(null);
      // If the deleted proposal was selected, clear the selection
      if (selectedProposal && selectedProposal.id === proposalToDelete) {
        setSelectedProposal(null);
      }
    }
  };

  const onDeleteClick = (proposalId: string) => {
    setProposalToDelete(proposalId);
    setDeleteDialogOpen(true);
  };

  const filteredProposals = filterStatus === "all" 
    ? proposals 
    : proposals.filter(p => p.status === filterStatus);

  return (
    <div className="space-y-6">
      <ProposalFilters
        filterStatus={filterStatus}
        onFilterChange={setFilterStatus}
        onCreateNew={handleCreateNewProposal}
      />
      
      {loading || filteredProposals.length === 0 ? (
        <ProposalEmptyState 
          loading={loading} 
          onCreateNew={handleCreateNewProposal} 
        />
      ) : (
        <Dialog onOpenChange={(open) => {
          if (!open) setSelectedProposal(null);
        }}>
          <ProposalTable
            proposals={filteredProposals}
            onSelectProposal={setSelectedProposal}
            onDeleteProposal={onDeleteClick}
          />
          
          <ProposalDetailsDialog
            proposal={selectedProposal}
            isUpdatingStatus={isUpdatingStatus}
            isConvertingToInvoice={isConvertingToInvoice}
            onStatusChange={handleStatusChange}
            onConvertToInvoice={handleConvertSelectedToInvoice}
            onDeleteProposal={onDeleteClick}
          />
        </Dialog>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this proposal?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the proposal from your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteProposal}
              disabled={isDeletingProposal}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingProposal ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProposalsPage;
