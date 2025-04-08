
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface ProposalEmptyStateProps {
  loading: boolean;
  onCreateNew: () => void;
}

export const ProposalEmptyState = ({ loading, onCreateNew }: ProposalEmptyStateProps) => {
  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="text-center p-8">
      <p className="text-lg text-muted-foreground">No proposals found</p>
      <Button 
        variant="outline" 
        className="mt-4"
        onClick={onCreateNew}
      >
        Create a new proposal
      </Button>
    </div>
  );
};
