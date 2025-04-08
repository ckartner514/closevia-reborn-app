
import { format, parseISO } from "date-fns";
import { useState } from "react";
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InvoiceWithContact } from "./types";

interface InvoiceTableProps {
  invoices: InvoiceWithContact[];
  onStatusChange?: (invoiceId: string, newStatus: string) => void;
  onDeleteInvoice?: (invoiceId: string) => void;
  onSelectInvoice?: (invoice: InvoiceWithContact) => void;
  highlightedInvoiceId?: string | null;
  isUpdatingStatus?: boolean;
  readOnly?: boolean;
}

export function InvoiceTable({ 
  invoices, 
  onStatusChange, 
  onDeleteInvoice,
  onSelectInvoice,
  highlightedInvoiceId,
  isUpdatingStatus,
  readOnly = false
}: InvoiceTableProps) {
  const [actionInvoiceId, setActionInvoiceId] = useState<string | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
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
    <div className="border rounded-md overflow-hidden">
      <Table className="min-w-full">
        <TableHeader>
          <TableRow>
            <TableHead>Invoice</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            {!readOnly && onDeleteInvoice && (
              <TableHead className="w-[50px]"></TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow 
              key={invoice.id} 
              id={`invoice-${invoice.id}`}
              className={`transition-all ${highlightedInvoiceId === invoice.id ? 'bg-accent' : ''}`}
            >
              <TableCell 
                className="font-medium cursor-pointer hover:underline"
                onClick={() => onSelectInvoice && onSelectInvoice(invoice)}
              >
                {invoice.title}
              </TableCell>
              <TableCell>
                {invoice.created_at && format(parseISO(invoice.created_at), "MMM d, yyyy")}
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{invoice.contact?.name}</div>
                  <div className="text-xs text-muted-foreground">{invoice.contact?.company}</div>
                </div>
              </TableCell>
              <TableCell>{formatCurrency(invoice.amount)}</TableCell>
              <TableCell>{getStatusBadge(invoice.invoice_status)}</TableCell>
              {!readOnly && onDeleteInvoice && (
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDeleteInvoice(invoice.id)}
                    className="hover:bg-destructive/10 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
