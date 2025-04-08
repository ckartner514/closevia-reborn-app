
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, Contact } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogTrigger, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowUpRight, 
  Check, 
  CheckCircle2, 
  FileText, 
  Loader2, 
  PlusCircle,
  X, 
  XCircle 
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Update type definition to match the database schema
type Proposal = {
  id: string;
  contact_id: string;
  title: string;
  notes: string | null; // Changed from description to notes
  amount: number;
  due_date: string | null; // Changed from follow_up_date to due_date
  status: 'open' | 'accepted' | 'refused'; // Changed status values
  created_at: string;
  user_id: string;
};

type ProposalWithContact = Proposal & {
  contact: Contact;
};

const ProposalsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [proposals, setProposals] = useState<ProposalWithContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProposal, setSelectedProposal] = useState<ProposalWithContact | null>(null);
  const [isConvertingToInvoice, setIsConvertingToInvoice] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    if (!user) return;
    fetchProposals();
  }, [user]);

  const fetchProposals = async () => {
    try {
      setLoading(true);
      // Updated to use "deals" table instead of "proposals"
      const { data, error } = await supabase
        .from("deals")
        .select(`
          *,
          contact:contact_id (
            id, name, company, email, phone
          )
        `)
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      console.log("Fetched proposals:", data);
      
      // Transform data to match our expected type
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
        .from("deals") // Changed from "proposals" to "deals"
        .update({ status: newStatus })
        .eq("id", proposalId);

      if (error) throw error;
      
      // Update local state
      setProposals(proposals.map(p => p.id === proposalId ? { ...p, status: newStatus } : p));
      
      if (selectedProposal?.id === proposalId) {
        setSelectedProposal({ ...selectedProposal, status: newStatus });
      }
      
      toast.success(`Proposal marked as ${newStatus}`);
    } catch (error) {
      console.error("Error updating proposal status:", error);
      toast.error("Failed to update proposal status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleCreateNewProposal = () => {
    navigate("/create");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
        return "bg-green-100 text-green-800 hover:bg-green-200";
      case "refused":
        return "bg-red-100 text-red-800 hover:bg-red-200";
      default:
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "accepted":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "refused":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <FileText className="h-4 w-4 text-yellow-600" />;
    }
  };

  // Filter proposals by status
  const filteredProposals = filterStatus === "all" 
    ? proposals 
    : proposals.filter(p => p.status === filterStatus);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="page-title">Proposals</h1>
        
        <div className="flex items-center gap-2">
          <Select 
            value={filterStatus} 
            onValueChange={setFilterStatus}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="refused">Refused</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={handleCreateNewProposal}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Proposal
          </Button>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredProposals.length === 0 ? (
        <div className="text-center p-8">
          <p className="text-lg text-muted-foreground">No proposals found</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={handleCreateNewProposal}
          >
            Create a new proposal
          </Button>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="hidden md:table-cell">Amount</TableHead>
                <TableHead className="hidden md:table-cell">Follow-up</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProposals.map((proposal) => (
                <TableRow key={proposal.id}>
                  <TableCell>{proposal.title}</TableCell>
                  <TableCell>{proposal.contact?.name}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    ${proposal.amount.toFixed(2)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {proposal.due_date 
                      ? format(parseISO(proposal.due_date), "PP") 
                      : "Not set"}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline"
                      className={cn(
                        "flex w-fit items-center gap-1",
                        getStatusColor(proposal.status)
                      )}
                    >
                      {getStatusIcon(proposal.status)}
                      <span className="capitalize">{proposal.status}</span>
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => setSelectedProposal(proposal)}
                        >
                          <ArrowUpRight className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Proposal Details</DialogTitle>
                          <DialogDescription>
                            Created on {format(parseISO(proposal.created_at), "PPP")}
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="grid gap-4 py-4">
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <h3 className="text-lg font-medium">{proposal.title}</h3>
                              <Badge 
                                variant="outline"
                                className={cn(
                                  "flex items-center gap-1",
                                  getStatusColor(proposal.status)
                                )}
                              >
                                {getStatusIcon(proposal.status)}
                                <span className="capitalize">{proposal.status}</span>
                              </Badge>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">Client:</span>
                              <span className="text-sm">
                                {proposal.contact?.name} ({proposal.contact?.company})
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">Amount:</span>
                              <span className="text-sm">${proposal.amount.toFixed(2)}</span>
                            </div>
                            
                            {proposal.due_date && (
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">Follow-up:</span>
                                <span className="text-sm">
                                  {format(parseISO(proposal.due_date), "PPP")}
                                </span>
                              </div>
                            )}
                            
                            {proposal.notes && (
                              <div className="mt-4">
                                <Label className="mb-2 block">Description</Label>
                                <Textarea 
                                  value={proposal.notes}
                                  readOnly
                                  className="resize-none"
                                  rows={4}
                                />
                              </div>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Update Status</Label>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className={cn(
                                  "flex-1 gap-1",
                                  proposal.status === "open" 
                                    ? "border-yellow-500 bg-yellow-50" 
                                    : ""
                                )}
                                onClick={() => handleStatusChange(proposal.id, "open")}
                                disabled={isUpdatingStatus}
                              >
                                <FileText className="h-4 w-4" />
                                Open
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className={cn(
                                  "flex-1 gap-1",
                                  proposal.status === "accepted" 
                                    ? "border-green-500 bg-green-50" 
                                    : ""
                                )}
                                onClick={() => handleStatusChange(proposal.id, "accepted")}
                                disabled={isUpdatingStatus}
                              >
                                <Check className="h-4 w-4" />
                                Accepted
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className={cn(
                                  "flex-1 gap-1",
                                  proposal.status === "refused" 
                                    ? "border-red-500 bg-red-50" 
                                    : ""
                                )}
                                onClick={() => handleStatusChange(proposal.id, "refused")}
                                disabled={isUpdatingStatus}
                              >
                                <X className="h-4 w-4" />
                                Refused
                              </Button>
                            </div>
                          </div>
                        </div>
                        
                        <DialogFooter>
                          {proposal.status === "accepted" && (
                            <Button
                              onClick={() => {
                                /* Implement invoice creation later */
                                toast.info("Invoice creation will be implemented in a future update");
                              }}
                              disabled={isConvertingToInvoice}
                            >
                              {isConvertingToInvoice ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Converting...
                                </>
                              ) : (
                                "Convert to Invoice"
                              )}
                            </Button>
                          )}
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default ProposalsPage;
