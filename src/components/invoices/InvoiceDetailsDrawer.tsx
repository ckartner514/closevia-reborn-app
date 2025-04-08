
import { format, parseISO } from "date-fns";
import { useState, useEffect } from "react";
import { InvoiceWithContact } from "./types";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import ContactComments from "@/components/contacts/ContactComments";
import { supabase } from "@/lib/supabase";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Calendar as CalendarIcon, Download, FileText } from "lucide-react";
import { generateInvoicePdf } from "@/utils/pdfGenerator";

type InvoiceComment = {
  id: string;
  contact_id: string;
  text: string;
  created_at: string;
  user_id: string;
};

interface InvoiceDetailsDrawerProps {
  invoice: InvoiceWithContact | null;
  onStatusChange?: (invoiceId: string, newStatus: string) => Promise<void>;
}

export const InvoiceDetailsDrawer = ({
  invoice,
  onStatusChange
}: InvoiceDetailsDrawerProps) => {
  const [status, setStatus] = useState<string>(invoice?.invoice_status || "pending");
  const [comments, setComments] = useState<InvoiceComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdatingDueDate, setIsUpdatingDueDate] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [dueDate, setDueDate] = useState<Date | undefined>(
    invoice?.due_date ? parseISO(invoice.due_date) : undefined
  );

  useEffect(() => {
    if (invoice) {
      fetchComments();
      setDueDate(invoice.due_date ? parseISO(invoice.due_date) : undefined);
      setStatus(invoice.invoice_status || "pending");
    }
  }, [invoice]);

  const fetchComments = async () => {
    if (!invoice) return;
    
    try {
      const { data, error } = await supabase
        .from("contact_comments")
        .select("*")
        .eq("contact_id", invoice.contact_id)
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
    if (!newComment.trim() || !invoice) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("contact_comments")
        .insert({
          contact_id: invoice.contact_id,
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

  const handleStatusChange = async (newStatus: string) => {
    if (onStatusChange) {
      await onStatusChange(invoice!.id, newStatus);
      setStatus(newStatus);
    }
  };

  const handleDueDateChange = async (date: Date | undefined) => {
    if (!invoice || !date) return;
    
    setIsUpdatingDueDate(true);
    try {
      // Clear any existing notifications in localStorage that might be related to this invoice
      const deletedNotifications = JSON.parse(localStorage.getItem('deletedNotifications') || '{}');
      deletedNotifications[invoice.id] = false; // Remove any deletion record to allow new notifications
      localStorage.setItem('deletedNotifications', JSON.stringify(deletedNotifications));

      // Update the due date in the database
      const { error } = await supabase
        .from("deals")
        .update({ due_date: date.toISOString().split('T')[0] })
        .eq("id", invoice.id);

      if (error) throw error;
      
      setDueDate(date);
      toast.success("Due date updated");
    } catch (error) {
      console.error("Error updating due date:", error);
      toast.error("Failed to update due date");
      setDueDate(invoice.due_date ? parseISO(invoice.due_date) : undefined);
    } finally {
      setIsUpdatingDueDate(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!invoice) return;
    
    setIsGeneratingPdf(true);
    try {
      await generateInvoicePdf(invoice, comments);
      toast.success("Invoice PDF generated successfully");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (!invoice) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-500">Paid</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case "overdue":
        return <Badge className="bg-red-500">Overdue</Badge>;
      default:
        return <Badge className="bg-gray-500">{status}</Badge>;
    }
  };

  return (
    <SheetContent className="sm:max-w-md w-full overflow-y-auto max-h-screen border-l">
      <SheetHeader>
        <SheetTitle className="flex items-center justify-between">
          <span>Invoice Details</span>
          {getStatusBadge(status)}
        </SheetTitle>
        <SheetDescription>
          Created on {format(parseISO(invoice.created_at), "PPP")}
        </SheetDescription>
      </SheetHeader>

      <div className="space-y-4 py-4">
        <div>
          <h3 className="text-lg font-semibold">{invoice.title}</h3>
          <p className="text-sm text-muted-foreground">
            Amount: {formatCurrency(invoice.amount)}
          </p>
        </div>

        <Separator />

        <div className="grid gap-2">
          <label className="text-sm font-medium">Status</label>
          <Select value={status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        <div className="grid gap-2">
          <div className="font-semibold">Client Information</div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-muted-foreground">Name</p>
              <p>{invoice.contact?.name}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Company</p>
              <p>{invoice.contact?.company}</p>
            </div>
          </div>
        </div>

        <Separator />
        
        <div>
          <p className="text-muted-foreground text-sm mb-2">Due Date</p>
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !dueDate && "text-muted-foreground"
                )}
                disabled={isUpdatingDueDate}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dueDate ? format(dueDate, "PPP") : "Set due date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
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

        {invoice.notes && (
          <>
            <Separator />
            <div>
              <div className="font-semibold mb-2">Notes</div>
              <p className="text-sm whitespace-pre-wrap">{invoice.notes}</p>
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

      <SheetFooter className="flex-col sm:flex-row gap-2 mt-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleDownloadPdf}
          disabled={isGeneratingPdf}
          className="gap-2"
        >
          {isGeneratingPdf ? (
            "Generating PDF..."
          ) : (
            <>
              <FileText className="h-4 w-4" />
              Download PDF
            </>
          )}
        </Button>
        <SheetClose asChild>
          <Button variant="outline" size="sm">
            Close
          </Button>
        </SheetClose>
      </SheetFooter>
    </SheetContent>
  );
};
