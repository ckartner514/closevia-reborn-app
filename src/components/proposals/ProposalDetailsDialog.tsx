import { format, parseISO } from "date-fns";
import { useState, useEffect } from "react";
import { CheckCircle, XCircle, FileText, Trash2, Calendar, Download } from "lucide-react";
import { ProposalWithContact } from "./types";
import { ProposalStatusBadge } from "./ProposalStatusBadge";
import { Button } from "@/components/ui/button";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { 
  Select, 
  SelectContent, 
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import ContactComments from "@/components/contacts/ContactComments";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { generateProposalPdf } from "@/utils/pdfGenerator";

type ProposalComment = {
  id: string;
  contact_id: string;
  text: string;
  created_at: string;
  user_id: string;
};

interface ProposalDetailsDialogProps {
  proposal: ProposalWithContact | null;
  isUpdatingStatus: boolean;
  isConvertingToInvoice: boolean;
  onStatusChange: (proposalId: string, newStatus: string) => void;
  onConvertToInvoice: () => void;
  onDeleteProposal: (proposalId: string) => void;
}

export const ProposalDetailsDialog = ({
  proposal,
  isUpdatingStatus,
  isConvertingToInvoice,
  onStatusChange,
  onConvertToInvoice,
  onDeleteProposal
}: ProposalDetailsDialogProps) => {
  const [comments, setComments] = useState<ProposalComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdatingDueDate, setIsUpdatingDueDate] = useState(false);
  const [dueDate, setDueDate] = useState<Date | undefined>(
    proposal?.due_date ? parseISO(proposal.due_date) : undefined
  );
  const [currentStatus, setCurrentStatus] = useState<string>(proposal?.status || '');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  useEffect(() => {
    if (proposal) {
      fetchComments();
      setDueDate(proposal.due_date ? parseISO(proposal.due_date) : undefined);
      setCurrentStatus(proposal.status);
    }
  }, [proposal]);

  const fetchComments = async () => {
    if (!proposal) return;
    
    try {
      const { data, error } = await supabase
        .from("contact_comments")
        .select("*")
        .eq("contact_id", proposal.contact_id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error("Error fetching comments:", error);
      toast.error("Failed to load comments");
    }
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewComment(e.target.value);
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !proposal) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("contact_comments")
        .insert({
          contact_id: proposal.contact_id,
          text: newComment,
          user_id: (await supabase.auth.getUser()).data.user?.id || "",
        })
        .select()
        .single();

      if (error) throw error;
      
      setComments([data, ...comments]);
      setNewComment("");
      toast.success("Comment added");
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from("contact_comments")
        .delete()
        .eq("id", commentId);

      if (error) throw error;
      
      setComments(comments.filter((comment) => comment.id !== commentId));
      toast.success("Comment deleted");
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("Failed to delete comment");
    }
  };

  const handleStatusChange = (newStatus: string) => {
    if (!proposal) return;
    setCurrentStatus(newStatus);
    onStatusChange(proposal.id, newStatus);
  };

  const handleDueDateChange = async (date: Date | undefined) => {
    if (!proposal || !date) return;
    
    setIsUpdatingDueDate(true);
    try {
      const { error } = await supabase
        .from("deals")
        .update({ due_date: date.toISOString().split('T')[0] })
        .eq("id", proposal.id);

      if (error) throw error;
      
      toast.success("Follow-up date updated");
    } catch (error) {
      console.error("Error updating due date:", error);
      toast.error("Failed to update follow-up date");
      setDueDate(proposal.due_date ? parseISO(proposal.due_date) : undefined);
    } finally {
      setIsUpdatingDueDate(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!proposal) return;
    
    try {
      setIsGeneratingPdf(true);
      await generateProposalPdf(proposal, comments);
      toast.success("PDF generated successfully");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (!proposal) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center justify-between">
          <span>Proposal Details</span>
          <ProposalStatusBadge status={currentStatus} />
        </DialogTitle>
        <DialogDescription>
          Created on {format(parseISO(proposal.created_at), "PPP")}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">{proposal.title}</h3>
          <p className="text-sm text-muted-foreground">
            Amount: {formatCurrency(proposal.amount)}
          </p>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="status-select">Proposal Status</Label>
          <Select
            disabled={isUpdatingStatus}
            value={currentStatus}
            onValueChange={handleStatusChange}
          >
            <SelectTrigger id="status-select" className="w-full">
              <SelectValue placeholder="Select a status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="lost">Lost</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="refused">Refused</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        <div className="grid gap-2">
          <div className="font-semibold">Contact Information</div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-muted-foreground">Name</p>
              <p>{proposal.contact?.name}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Company</p>
              <p>{proposal.contact?.company}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Email</p>
              <p>{proposal.contact?.email}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Phone</p>
              <p>{proposal.contact?.phone || '-'}</p>
            </div>
          </div>
        </div>

        <Separator />
        
        <div>
          <p className="text-muted-foreground text-sm mb-2">Follow-up Date</p>
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !dueDate && "text-muted-foreground"
                )}
              >
                <Calendar className="mr-2 h-4 w-4" />
                {dueDate ? format(dueDate, "PPP") : "Set follow-up date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={dueDate}
                onSelect={(date) => {
                  setDueDate(date);
                  handleDueDateChange(date);
                }}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>

        {proposal.notes && (
          <>
            <Separator />
            <div>
              <div className="font-semibold mb-2">Notes</div>
              <p className="text-sm whitespace-pre-wrap">{proposal.notes}</p>
            </div>
          </>
        )}

        <Separator />
        
        <ContactComments
          comments={comments}
          newComment={newComment}
          isLoading={isLoading}
          onCommentChange={handleCommentChange}
          onAddComment={handleAddComment}
          onDeleteComment={handleDeleteComment}
        />
      </div>

      <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDeleteProposal(proposal.id)}
            className="sm:mr-2"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
          >
            <Download className="h-4 w-4 mr-2" />
            {isGeneratingPdf ? 'Generating...' : 'Download PDF'}
          </Button>

          <DialogClose asChild>
            <Button variant="outline" size="sm">
              Close
            </Button>
          </DialogClose>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto mt-2 sm:mt-0">
          {currentStatus === 'accepted' && (
            <Button
              variant="default"
              size="sm"
              onClick={onConvertToInvoice}
              disabled={isConvertingToInvoice}
            >
              <FileText className="h-4 w-4 mr-2" />
              {isConvertingToInvoice ? 'Converting...' : 'Convert to Invoice'}
            </Button>
          )}
        </div>
      </DialogFooter>
    </DialogContent>
  );
};
