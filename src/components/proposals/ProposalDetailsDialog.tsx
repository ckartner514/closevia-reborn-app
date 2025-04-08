
import { useState } from "react";
import { format, parseISO } from "date-fns";
import { Check, DollarSign, FileText, Loader2, X } from "lucide-react";
import { 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ProposalWithContact } from "./types";
import { ProposalStatusBadge, getStatusColor } from "./ProposalStatusBadge";
import { toast } from "sonner";

interface ProposalDetailsDialogProps {
  proposal: ProposalWithContact | null;
  isUpdatingStatus: boolean;
  isConvertingToInvoice: boolean;
  onStatusChange: (proposalId: string, status: 'open' | 'accepted' | 'refused') => Promise<void>;
  onConvertToInvoice: () => Promise<void>;
}

export const ProposalDetailsDialog = ({
  proposal,
  isUpdatingStatus,
  isConvertingToInvoice,
  onStatusChange,
  onConvertToInvoice
}: ProposalDetailsDialogProps) => {
  const [error, setError] = useState<string | null>(null);

  const handleConvertClick = async () => {
    try {
      setError(null);
      await onConvertToInvoice();
    } catch (err: any) {
      setError(err?.message || "Failed to create invoice");
      console.error("Error in convert click handler:", err);
    }
  };

  if (!proposal) return null;

  return (
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
            <ProposalStatusBadge status={proposal.status} />
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
              onClick={() => onStatusChange(proposal.id, "open")}
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
              onClick={() => onStatusChange(proposal.id, "accepted")}
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
              onClick={() => onStatusChange(proposal.id, "refused")}
              disabled={isUpdatingStatus}
            >
              <X className="h-4 w-4" />
              Refused
            </Button>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md text-sm">
            {error}
          </div>
        )}
      </div>
      
      <DialogFooter>
        {proposal.status === "accepted" && (
          <Button
            onClick={handleConvertClick}
            disabled={isConvertingToInvoice}
          >
            {isConvertingToInvoice ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <DollarSign className="mr-2 h-4 w-4" />
                Convert to Invoice
              </>
            )}
          </Button>
        )}
      </DialogFooter>
    </DialogContent>
  );
};
