
import { format, parseISO } from "date-fns";
import { InvoiceWithContact } from "./types";
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface InvoiceTableProps {
  invoices: InvoiceWithContact[];
  onStatusChange?: (invoiceId: string, status: string) => Promise<void>;
  onDeleteInvoice?: (invoiceId: string) => void;
}

export const InvoiceTable = ({ invoices, onStatusChange, onDeleteInvoice }: InvoiceTableProps) => {
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleStatusToggle = async (invoice: InvoiceWithContact) => {
    if (!onStatusChange) return;
    
    try {
      setUpdatingId(invoice.id);
      const newStatus = invoice.invoice_status === "pending" ? "paid" : "pending";
      await onStatusChange(invoice.id, newStatus);
    } catch (error) {
      console.error("Error updating invoice status:", error);
      toast.error("Failed to update invoice status");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="rounded-md border bg-white shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead>Created</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead className="hidden md:table-cell">Company</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead className="hidden md:table-cell">Due Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id} className="hover:bg-muted/30">
              <TableCell>{format(parseISO(invoice.created_at), "PP")}</TableCell>
              <TableCell className="font-medium">{invoice.title}</TableCell>
              <TableCell>{invoice.contact?.name}</TableCell>
              <TableCell className="hidden md:table-cell">{invoice.contact?.company}</TableCell>
              <TableCell className="font-medium">${invoice.amount.toFixed(2)}</TableCell>
              <TableCell className="hidden md:table-cell">
                {invoice.due_date ? format(parseISO(invoice.due_date), "PP") : "—"}
              </TableCell>
              <TableCell>
                <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium
                  ${invoice.invoice_status === "paid" 
                    ? "bg-green-100 text-green-800" 
                    : "bg-amber-100 text-amber-800"}`
                }>
                  {invoice.invoice_status === "paid" ? (
                    <CheckCircle className="w-3.5 h-3.5" />
                  ) : (
                    <Clock className="w-3.5 h-3.5" />
                  )}
                  {invoice.invoice_status === "paid" ? "Paid" : "Pending"}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end space-x-2">
                  {onDeleteInvoice && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => onDeleteInvoice(invoice.id)}
                      className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                  {onStatusChange && (
                    <Button 
                      variant={invoice.invoice_status === "pending" ? "default" : "outline"} 
                      size="sm" 
                      onClick={() => handleStatusToggle(invoice)}
                      disabled={updatingId === invoice.id}
                      className={`text-xs ${invoice.invoice_status === "pending" ? "bg-primary hover:bg-primary/90" : ""}`}
                    >
                      {updatingId === invoice.id ? (
                        "Updating..."
                      ) : invoice.invoice_status === "pending" ? (
                        "Mark as Paid"
                      ) : (
                        "Mark as Pending"
                      )}
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
