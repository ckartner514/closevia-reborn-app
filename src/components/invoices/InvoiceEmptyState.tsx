
import { Loader2 } from "lucide-react";

interface InvoiceEmptyStateProps {
  loading: boolean;
  hasFilters: boolean;
}

export const InvoiceEmptyState = ({ loading, hasFilters }: InvoiceEmptyStateProps) => {
  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="text-center p-8">
      <p className="text-lg text-muted-foreground">No invoices found</p>
      {hasFilters && (
        <p className="text-sm text-muted-foreground mt-2">
          Try adjusting your filters
        </p>
      )}
    </div>
  );
};
