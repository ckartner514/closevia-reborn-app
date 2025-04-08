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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { 
  ArrowUpRight, 
  Check, 
  CheckCircle2, 
  FileText, 
  Loader2, 
  PlusCircle,
  X, 
  XCircle, 
  DollarSign
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

type Proposal = {
  id: string;
  contact_id: string;
  title: string;
  notes: string | null;
  amount: number;
  due_date: string | null;
  status: 'open' | 'accepted' | 'refused';
  created_at: string;
  user_id: string;
};

type ProposalWithContact = Proposal & {
  contact: Contact;
};

const InvoiceSchema = z.object({
  amount: z.coerce.number().min(1, "Amount must be greater than 0"),
  notes: z.string().optional(),
  includeItems: z.boolean().default(false),
});

const ProposalsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [proposals, setProposals] = useState<ProposalWithContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProposal, setSelectedProposal] = useState<ProposalWithContact | null>(null);
  const [isConvertingToInvoice, setIsConvertingToInvoice] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [invoiceStep, setInvoiceStep] = useState<number>(1);
  const [invoiceCreated, setInvoiceCreated] = useState<boolean>(false);
  const [invoiceId, setInvoiceId] = useState<string | null>(null);

  const form = useForm<z.infer<typeof InvoiceSchema>>({
    resolver: zodResolver(InvoiceSchema),
    defaultValues: {
      amount: 0,
      notes: "",
      includeItems: false,
    },
  });

  useEffect(() => {
    if (!user) return;
    fetchProposals();
  }, [user]);

  useEffect(() => {
    if (selectedProposal) {
      form.setValue("amount", selectedProposal.amount);
      form.setValue("notes", selectedProposal.notes || "");
    }
  }, [selectedProposal, form]);

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
        .eq("user_id", user!.id)
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

  const resetInvoiceProcess = () => {
    setInvoiceStep(1);
    setInvoiceCreated(false);
    setInvoiceId(null);
    form.reset({
      amount: selectedProposal?.amount || 0,
      notes: selectedProposal?.notes || "",
      includeItems: false,
    });
  };

  const handleCreateInvoice = async (data: z.infer<typeof InvoiceSchema>) => {
    if (!selectedProposal) return;
    
    try {
      setIsConvertingToInvoice(true);
      
      const { data: invoiceData, error } = await supabase
        .from("invoices")
        .insert({
          contact_id: selectedProposal.contact_id,
          proposal_id: selectedProposal.id,
          amount: data.amount,
          user_id: user!.id,
        })
        .select('id')
        .single();

      if (error) throw error;
      
      setInvoiceId(invoiceData.id);
      setInvoiceCreated(true);
      setInvoiceStep(3);
      toast.success("Invoice created successfully!");
    } catch (error) {
      console.error("Error creating invoice:", error);
      toast.error("Failed to create invoice");
    } finally {
      setIsConvertingToInvoice(false);
    }
  };

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
                    <Dialog onOpenChange={(open) => {
                      if (open) {
                        setSelectedProposal(proposal);
                        resetInvoiceProcess();
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon"
                        >
                          <ArrowUpRight className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        {invoiceStep === 1 && (
                          <>
                            <DialogHeader>
                              <DialogTitle>Proposal Details</DialogTitle>
                              <DialogDescription>
                                Created on {selectedProposal && format(parseISO(selectedProposal.created_at), "PPP")}
                              </DialogDescription>
                            </DialogHeader>
                            
                            <div className="grid gap-4 py-4">
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <h3 className="text-lg font-medium">{selectedProposal?.title}</h3>
                                  <Badge 
                                    variant="outline"
                                    className={cn(
                                      "flex items-center gap-1",
                                      selectedProposal ? getStatusColor(selectedProposal.status) : ""
                                    )}
                                  >
                                    {selectedProposal && getStatusIcon(selectedProposal.status)}
                                    <span className="capitalize">{selectedProposal?.status}</span>
                                  </Badge>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium">Client:</span>
                                  <span className="text-sm">
                                    {selectedProposal?.contact?.name} ({selectedProposal?.contact?.company})
                                  </span>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium">Amount:</span>
                                  <span className="text-sm">${selectedProposal?.amount.toFixed(2)}</span>
                                </div>
                                
                                {selectedProposal?.due_date && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">Follow-up:</span>
                                    <span className="text-sm">
                                      {format(parseISO(selectedProposal.due_date), "PPP")}
                                    </span>
                                  </div>
                                )}
                                
                                {selectedProposal?.notes && (
                                  <div className="mt-4">
                                    <Label className="mb-2 block">Description</Label>
                                    <Textarea 
                                      value={selectedProposal.notes}
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
                                      selectedProposal?.status === "open" 
                                        ? "border-yellow-500 bg-yellow-50" 
                                        : ""
                                    )}
                                    onClick={() => selectedProposal && handleStatusChange(selectedProposal.id, "open")}
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
                                      selectedProposal?.status === "accepted" 
                                        ? "border-green-500 bg-green-50" 
                                        : ""
                                    )}
                                    onClick={() => selectedProposal && handleStatusChange(selectedProposal.id, "accepted")}
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
                                      selectedProposal?.status === "refused" 
                                        ? "border-red-500 bg-red-50" 
                                        : ""
                                    )}
                                    onClick={() => selectedProposal && handleStatusChange(selectedProposal.id, "refused")}
                                    disabled={isUpdatingStatus}
                                  >
                                    <X className="h-4 w-4" />
                                    Refused
                                  </Button>
                                </div>
                              </div>
                            </div>
                            
                            <DialogFooter>
                              {selectedProposal?.status === "accepted" && (
                                <Button
                                  onClick={() => setInvoiceStep(2)}
                                >
                                  <DollarSign className="mr-2 h-4 w-4" />
                                  Convert to Invoice
                                </Button>
                              )}
                            </DialogFooter>
                          </>
                        )}

                        {invoiceStep === 2 && (
                          <>
                            <DialogHeader>
                              <DialogTitle>Create Invoice</DialogTitle>
                              <DialogDescription>
                                Convert "{selectedProposal?.title}" to an invoice.
                              </DialogDescription>
                            </DialogHeader>
                            
                            <Form {...form}>
                              <form onSubmit={form.handleSubmit(handleCreateInvoice)} className="space-y-4">
                                <FormField
                                  control={form.control}
                                  name="amount"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Invoice Amount</FormLabel>
                                      <FormControl>
                                        <div className="relative">
                                          <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                          <Input type="number" step="0.01" className="pl-9" {...field} />
                                        </div>
                                      </FormControl>
                                      <FormDescription>
                                        Amount to be invoiced to client
                                      </FormDescription>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                
                                <FormField
                                  control={form.control}
                                  name="notes"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Additional Notes</FormLabel>
                                      <FormControl>
                                        <Textarea 
                                          placeholder="Any additional notes about this invoice" 
                                          className="resize-none" 
                                          rows={4}
                                          {...field}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                
                                <div className="flex justify-between pt-4">
                                  <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={() => setInvoiceStep(1)}
                                  >
                                    Back
                                  </Button>
                                  <Button 
                                    type="submit"
                                    disabled={isConvertingToInvoice}
                                  >
                                    {isConvertingToInvoice ? (
                                      <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating...
                                      </>
                                    ) : (
                                      <>Create Invoice</>
                                    )}
                                  </Button>
                                </div>
                              </form>
                            </Form>
                          </>
                        )}

                        {invoiceStep === 3 && (
                          <>
                            <DialogHeader>
                              <DialogTitle>Invoice Created</DialogTitle>
                              <DialogDescription>
                                Your invoice has been created successfully.
                              </DialogDescription>
                            </DialogHeader>
                            
                            <div className="py-6">
                              <Card>
                                <CardHeader className="pb-3">
                                  <CardTitle className="text-center text-green-600">
                                    <div className="flex justify-center mb-2">
                                      <CheckCircle2 className="h-12 w-12" />
                                    </div>
                                    Success!
                                  </CardTitle>
                                  <CardDescription className="text-center">
                                    Your invoice has been created and is ready for tracking.
                                  </CardDescription>
                                </CardHeader>
                                <CardContent className="text-center space-y-2">
                                  <p><strong>Amount:</strong> ${form.getValues("amount").toFixed(2)}</p>
                                  <p><strong>Client:</strong> {selectedProposal?.contact?.name}</p>
                                </CardContent>
                                <CardFooter className="flex justify-center gap-4">
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      resetInvoiceProcess();
                                      setInvoiceStep(1);
                                    }}
                                  >
                                    Close
                                  </Button>
                                  <Button
                                    onClick={() => {
                                      navigate("/invoices");
                                    }}
                                  >
                                    View Invoices
                                  </Button>
                                </CardFooter>
                              </Card>
                            </div>
                          </>
                        )}
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
