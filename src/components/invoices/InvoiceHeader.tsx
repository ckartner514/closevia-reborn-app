
import { ArrowDownToLine } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InvoiceHeaderProps {
  onExportCSV: () => void;
  hasInvoices: boolean;
}

export const InvoiceHeader = ({ onExportCSV, hasInvoices }: InvoiceHeaderProps) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="page-title mb-1">Internal Invoices</h1>
        <p className="text-muted-foreground">For internal revenue tracking - not sent to clients</p>
      </div>
      
      <Button 
        variant="outline"
        onClick={onExportCSV}
        className="gap-2"
        disabled={!hasInvoices}
      >
        <ArrowDownToLine className="h-4 w-4" />
        Export CSV
      </Button>
    </div>
  );
};
