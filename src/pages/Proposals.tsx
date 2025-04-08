
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
import { Dialog } from "@/components/ui/dialog";

const ProposalsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedProposal, setSelectedProposal] = useState<ProposalWithContact | null>(null);
  const [proposalToDelete, setProposalToDelete] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
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

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const proposalId = query.get('openProposal');
    
    if (proposalId && proposals.length > 0) {
      const proposal = proposals.find(p => p.id === proposalId);
      if (proposal) {
        setSelectedProposal(proposal);
        setIsDetailsOpen(true);
        
        navigate('/proposals', { replace: true });
      }
    }
  }, [location.search, proposals, navigate]);

  const handleCreateNewProposal = () => {
    navigate("/create");
  };

  const handleConvertSelectedToInvoice = async () => {
    if (!selectedProposal) {
      toast.error("No proposal selected");
      return;
    }
    
    console.log("Converting proposal to invoice:", selectedProposal);
    
    const invoiceId = await handleConvertToInvoice(selectedProposal);
    
    if (invoiceId) {
      console.log("Successfully created invoice with ID:", invoiceId);
      fetchProposals();
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
      if (selectedProposal && selectedProposal.id === proposalToDelete) {
        setSelectedProposal(null);
        setIsDetailsOpen(false);
      }
    }
  };

  const onDeleteClick = (proposalId: string) => {
    setProposalToDelete(proposalId);
    setDeleteDialogOpen(true);
  };

  const handleSelectProposal = (proposal: ProposalWithContact) => {
    setSelectedProposal(proposal);
    setIsDetailsOpen(true);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsDetailsOpen(open);
    if (!open) {
      setSelectedProposal(null);
      // Refresh proposals list to reflect any changes made in the dialog
      fetchProposals();
    }
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
        <>
          <ProposalTable
            proposals={filteredProposals}
            onSelectProposal={handleSelectProposal}
            onDeleteProposal={onDeleteClick}
          />
          
          <Dialog 
            open={isDetailsOpen} 
            onOpenChange={handleDialogOpenChange}
          >
            <ProposalDetailsDialog
              proposal={selectedProposal}
              isUpdatingStatus={isUpdatingStatus}
              isConvertingToInvoice={isConvertingToInvoice}
              onStatusChange={handleStatusChange}
              onConvertToInvoice={handleConvertSelectedToInvoice}
              onDeleteProposal={onDeleteClick}
            />
          </Dialog>
        </>
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
