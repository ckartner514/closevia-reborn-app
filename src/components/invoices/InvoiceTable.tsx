
import { useState } from "react";
import { format, parseISO } from "date-fns";
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Ban, Loader2, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { InvoiceWithContact } from "./types";

interface InvoiceTableProps {
  invoices: InvoiceWithContact[];
  onStatusChange: (invoiceId: string, newStatus: string) => void;
  onDeleteInvoice: (invoiceId: string) => void;
  highlightedInvoiceId?: string | null;
  isUpdatingStatus?: boolean;
}

export function InvoiceTable({ 
  invoices, 
  onStatusChange, 
  onDeleteInvoice,
  highlightedInvoiceId,
  isUpdatingStatus 
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

  const handleActionClick = async (invoiceId: string, action: string) => {
    setActionInvoiceId(invoiceId);
    await onStatusChange(invoiceId, action);
    setActionInvoiceId(null);
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
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow 
              key={invoice.id} 
              id={`invoice-${invoice.id}`}
              className={`transition-all ${highlightedInvoiceId === invoice.id ? 'bg-accent' : ''}`}
            >
              <TableCell className="font-medium">
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
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      {actionInvoiceId === invoice.id && isUpdatingStatus ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Actions"
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {invoice.invoice_status === "pending" && (
                      <DropdownMenuItem 
                        onClick={() => handleActionClick(invoice.id, "paid")}
                        disabled={actionInvoiceId === invoice.id && isUpdatingStatus}
                      >
                        <Check className="mr-2 h-4 w-4 text-green-500" />
                        Mark as Paid
                      </DropdownMenuItem>
                    )}
                    {invoice.invoice_status === "pending" && (
                      <DropdownMenuItem 
                        onClick={() => handleActionClick(invoice.id, "overdue")}
                        disabled={actionInvoiceId === invoice.id && isUpdatingStatus}
                      >
                        <Ban className="mr-2 h-4 w-4 text-yellow-500" />
                        Mark as Overdue
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => onDeleteInvoice(invoice.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Invoice
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
