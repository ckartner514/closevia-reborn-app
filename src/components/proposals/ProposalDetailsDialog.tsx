
import { format, parseISO } from "date-fns";
import { useState, useEffect } from "react";
import { CheckCircle, XCircle, FileText, Trash2, CalendarIcon } from "lucide-react";
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

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
  const [followUpDate, setFollowUpDate] = useState<Date | undefined>(
    proposal?.due_date ? parseISO(proposal.due_date) : undefined
  );
  const [isUpdatingDate, setIsUpdatingDate] = useState(false);

  useEffect(() => {
    if (proposal) {
      fetchComments();
      setFollowUpDate(proposal.due_date ? parseISO(proposal.due_date) : undefined);
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

  const handleDateChange = async (date: Date | undefined) => {
    if (!proposal || isUpdatingDate) return;

    try {
      setIsUpdatingDate(true);
      
      // Fix: Update the due_date field in the deals table
      const { error } = await supabase
        .from("deals")
        .update({ due_date: date ? date.toISOString() : null })
        .eq("id", proposal.id);

      if (error) throw error;
      
      setFollowUpDate(date);
      toast.success("Follow-up date updated");
      
      // Clear any existing notifications for this item in localStorage to ensure notifications will work
      // This ensures the notification system will pick up the new date
      const deletedNotifications = JSON.parse(localStorage.getItem('deletedNotifications') || '{}');
      const viewedNotifications = JSON.parse(localStorage.getItem('viewedNotifications') || '{}');
      
      // Remove this proposal from the deleted and viewed lists to ensure it can trigger notifications
      if (deletedNotifications[proposal.id]) {
        delete deletedNotifications[proposal.id];
        localStorage.setItem('deletedNotifications', JSON.stringify(deletedNotifications));
      }
      
      if (viewedNotifications[proposal.id]) {
        delete viewedNotifications[proposal.id];
        localStorage.setItem('viewedNotifications', JSON.stringify(viewedNotifications));
      }
      
    } catch (error) {
      console.error("Error updating follow-up date:", error);
      toast.error("Failed to update follow-up date");
    } finally {
      setIsUpdatingDate(false);
    }
  };

  if (!proposal) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleStatusChange = (newStatus: string) => {
    onStatusChange(proposal.id, newStatus);
  };

  return (
    <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center justify-between">
          <span>Proposal Details</span>
          <ProposalStatusBadge status={proposal.status} />
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

        {/* Status Selector */}
        <div className="grid gap-2">
          <Label htmlFor="status-select">Proposal Status</Label>
          <Select
            disabled={isUpdatingStatus}
            value={proposal.status}
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

        {/* Follow-up Date */}
        <div>
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm">Follow-up Date</p>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal mt-1",
                  !followUpDate && "text-muted-foreground"
                )}
                disabled={isUpdatingDate}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {followUpDate ? format(followUpDate, "PPP") : <span>No date set</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={followUpDate}
                onSelect={handleDateChange}
                initialFocus
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

          <DialogClose asChild>
            <Button variant="outline" size="sm">
              Close
            </Button>
          </DialogClose>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto mt-2 sm:mt-0">
          {proposal.status === 'accepted' && (
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
