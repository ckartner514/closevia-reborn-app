
import { format, parseISO } from "date-fns";
import { Trash2 } from "lucide-react";
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ProposalStatusBadge } from "./ProposalStatusBadge";
import { ProposalWithContact } from "./types";

interface ProposalTableProps {
  proposals: ProposalWithContact[];
  onSelectProposal: (proposal: ProposalWithContact) => void;
  onDeleteProposal: (proposalId: string) => void;
}

export const ProposalTable = ({ proposals, onSelectProposal, onDeleteProposal }: ProposalTableProps) => {
  return (
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
          {proposals.map((proposal) => (
            <TableRow 
              key={proposal.id}
              className="cursor-pointer hover:bg-muted/50"
            >
              <TableCell 
                className="font-medium hover:text-primary transition-colors"
                onClick={() => onSelectProposal(proposal)}
              >
                {proposal.title}
              </TableCell>
              <TableCell onClick={() => onSelectProposal(proposal)}>
                {proposal.contact?.name}
              </TableCell>
              <TableCell 
                className="hidden md:table-cell"
                onClick={() => onSelectProposal(proposal)}
              >
                ${proposal.amount.toFixed(2)}
              </TableCell>
              <TableCell 
                className="hidden md:table-cell"
                onClick={() => onSelectProposal(proposal)}
              >
                {proposal.due_date 
                  ? format(parseISO(proposal.due_date), "PP") 
                  : "Not set"}
              </TableCell>
              <TableCell onClick={() => onSelectProposal(proposal)}>
                <ProposalStatusBadge status={proposal.status} />
              </TableCell>
              <TableCell className="text-right">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteProposal(proposal.id);
                  }}
                  className="hover:bg-muted text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
