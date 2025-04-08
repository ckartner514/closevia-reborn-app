
import { format, parseISO } from "date-fns";
import { CheckCircle, XCircle, FileText, Trash2 } from "lucide-react";
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

        {proposal.notes && (
          <>
            <Separator />
            <div>
              <div className="font-semibold mb-2">Notes</div>
              <p className="text-sm whitespace-pre-wrap">{proposal.notes}</p>
            </div>
          </>
        )}

        {proposal.due_date && (
          <>
            <Separator />
            <div>
              <p className="text-muted-foreground text-sm">Follow-up Date</p>
              <p>{format(parseISO(proposal.due_date), "PPP")}</p>
            </div>
          </>
        )}
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
