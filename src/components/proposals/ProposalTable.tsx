
import { format, parseISO } from "date-fns";
import { ArrowUpRight, Trash2 } from "lucide-react";
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DialogTrigger } from "@/components/ui/dialog";
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
                <ProposalStatusBadge status={proposal.status} />
              </TableCell>
              <TableCell className="text-right flex items-center justify-end space-x-1">
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => onDeleteProposal(proposal.id)}
                  className="hover:bg-muted"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <DialogTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => onSelectProposal(proposal)}
                  >
                    <ArrowUpRight className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
