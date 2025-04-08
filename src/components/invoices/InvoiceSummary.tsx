
import { InvoiceWithContact } from "./types";

interface InvoiceSummaryProps {
  filteredInvoices: InvoiceWithContact[];
  hasFilters: boolean;
}

export const InvoiceSummary = ({ filteredInvoices, hasFilters }: InvoiceSummaryProps) => {
  const totalInvoiceAmount = filteredInvoices.reduce((sum, invoice) => sum + invoice.amount, 0);

  if (filteredInvoices.length === 0) return null;

  return (
    <div className="bg-muted p-4 rounded-md">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-sm font-medium">Showing {filteredInvoices.length} invoices</h3>
          {hasFilters && (
            <p className="text-xs text-muted-foreground">Filtered results</p>
          )}
        </div>
        <div>
          <h3 className="text-sm font-medium">Total Amount</h3>
          <p className="text-xl font-bold">
            ${totalInvoiceAmount.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
};
