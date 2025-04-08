
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

const ProposalsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedProposal, setSelectedProposal] = useState<ProposalWithContact | null>(null);
  
  const {
    proposals,
    loading,
    isUpdatingStatus,
    isConvertingToInvoice,
    handleStatusChange,
    handleConvertToInvoice
  } = useProposals(user?.id);

  const handleCreateNewProposal = () => {
    navigate("/create");
  };

  const handleConvertSelectedToInvoice = async () => {
    if (!selectedProposal) return;
    
    // Create the invoice
    const invoiceId = await handleConvertToInvoice(selectedProposal);
    
    if (invoiceId) {
      // Navigate to invoices page
      navigate("/invoices");
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
        <Dialog onOpenChange={(open) => {
          if (!open) setSelectedProposal(null);
        }}>
          <ProposalTable
            proposals={filteredProposals}
            onSelectProposal={setSelectedProposal}
          />
          
          <ProposalDetailsDialog
            proposal={selectedProposal}
            isUpdatingStatus={isUpdatingStatus}
            isConvertingToInvoice={isConvertingToInvoice}
            onStatusChange={handleStatusChange}
            onConvertToInvoice={handleConvertSelectedToInvoice}
          />
        </Dialog>
      )}
    </div>
  );
};

export default ProposalsPage;
