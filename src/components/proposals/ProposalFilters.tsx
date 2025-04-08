
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProposalFiltersProps {
  filterStatus: string;
  onFilterChange: (value: string) => void;
  onCreateNew: () => void;
}

export const ProposalFilters = ({
  filterStatus,
  onFilterChange,
  onCreateNew
}: ProposalFiltersProps) => {
  return (
    <div className="flex justify-between items-center">
      <h1 className="page-title">Proposals</h1>
      
      <div className="flex items-center gap-2">
        <Select 
          value={filterStatus} 
          onValueChange={onFilterChange}
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
        
        <Button onClick={onCreateNew}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Proposal
        </Button>
      </div>
    </div>
  );
};
