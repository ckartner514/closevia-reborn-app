import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { format, parseISO } from "date-fns";
import { DateRange } from "react-day-picker";

// Custom Components
import ProposalFilters from "@/components/proposals/ProposalFilters";
import { ProposalTable } from "@/components/proposals/ProposalTable";
import { ProposalDetailsDialog } from "@/components/proposals/ProposalDetailsDialog";
import { ProposalEmptyState } from "@/components/proposals/ProposalEmptyState";
import { ProposalWithContact } from "@/components/proposals/types";
import { useProposals } from "@/hooks/useProposals";
import { filterByAmountRange, isWithinWeek, isWithinNext, isOverdue } from "@/utils/date-utils";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
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
  
  // Basic filters
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [contacts, setContacts] = useState<{ id: string; name: string; company: string }[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  
  // Advanced filters
  const [selectedAmountRange, setSelectedAmountRange] = useState<string>("all");
  const [selectedFollowUpRange, setSelectedFollowUpRange] = useState<string>("all");
  const [followUpDateRange, setFollowUpDateRange] = useState<DateRange | undefined>();
  const [followUpDateOpen, setFollowUpDateOpen] = useState(false);
  
  // UI state
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

  useEffect(() => {
    if (!user) return;
    fetchContacts();
  }, [user]);

  const fetchContacts = async () => {
    try {
      const { data, error } = await supabase
        .from("contacts")
        .select("id, name, company")
        .eq("user_id", user!.id)
        .order("name", { ascending: true });

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error("Error fetching contacts:", error);
    }
  };

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
      fetchProposals();
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setFilterStatus("all");
    setSelectedContactId(null);
    setSelectedAmountRange("all");
    setSelectedFollowUpRange("all");
    setFollowUpDateRange(undefined);
  };

  // Filter proposals based on all criteria
  const filteredProposals = useMemo(() => {
    return proposals.filter(proposal => {
      // Filter by status
      if (filterStatus !== "all" && proposal.status !== filterStatus) {
        return false;
      }
      
      // Filter by contact
      if (selectedContactId && proposal.contact_id !== selectedContactId) {
        return false;
      }
      
      // Filter by amount range
      if (selectedAmountRange !== "all" && !filterByAmountRange(proposal.amount, selectedAmountRange)) {
        return false;
      }
      
      // Filter by follow-up date range
      if (selectedFollowUpRange !== "all") {
        if (selectedFollowUpRange === "thisWeek" && !isWithinWeek(proposal.due_date)) {
          return false;
        } else if (selectedFollowUpRange === "next30Days" && !isWithinNext(proposal.due_date, 30)) {
          return false;
        } else if (selectedFollowUpRange === "overdue" && !isOverdue(proposal.due_date)) {
          return false;
        } else if (selectedFollowUpRange === "custom" && followUpDateRange) {
          if (!proposal.due_date) return false;
          
          const dueDate = parseISO(proposal.due_date);
          const from = followUpDateRange.from;
          const to = followUpDateRange.to || followUpDateRange.from;
          
          if (from && to && (dueDate < from || dueDate > to)) {
            return false;
          }
        }
      }
      
      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesContact = 
          (proposal.contact?.name?.toLowerCase().includes(query) || false) || 
          (proposal.contact?.company?.toLowerCase().includes(query) || false);
        const matchesTitle = proposal.title.toLowerCase().includes(query);
        const matchesAmount = proposal.amount.toString().includes(query);
        
        return matchesContact || matchesTitle || matchesAmount;
      }
      
      return true;
    });
  }, [
    proposals,
    filterStatus,
    selectedContactId,
    selectedAmountRange,
    selectedFollowUpRange,
    followUpDateRange,
    searchQuery
  ]);

  return (
    <div className="space-y-6">
      <ProposalFilters
        filterStatus={filterStatus}
        onFilterChange={setFilterStatus}
        onCreateNew={handleCreateNewProposal}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedAmountRange={selectedAmountRange}
        setSelectedAmountRange={setSelectedAmountRange}
        selectedFollowUpRange={selectedFollowUpRange}
        setSelectedFollowUpRange={setSelectedFollowUpRange}
        followUpDateRange={followUpDateRange}
        setFollowUpDateRange={setFollowUpDateRange}
        followUpDateOpen={followUpDateOpen}
        setFollowUpDateOpen={setFollowUpDateOpen}
        clearFilters={clearFilters}
        contacts={contacts}
        selectedContactId={selectedContactId}
        setSelectedContactId={setSelectedContactId}
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
