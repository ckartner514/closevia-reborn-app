
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

interface InvoiceTableProps {
  invoices: InvoiceWithContact[];
}

export const InvoiceTable = ({ invoices }: InvoiceTableProps) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Created</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead className="hidden md:table-cell">Company</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead className="hidden md:table-cell">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell>{format(parseISO(invoice.created_at), "PP")}</TableCell>
              <TableCell>{invoice.title}</TableCell>
              <TableCell>{invoice.contact?.name}</TableCell>
              <TableCell className="hidden md:table-cell">{invoice.contact?.company}</TableCell>
              <TableCell>${invoice.amount.toFixed(2)}</TableCell>
              <TableCell className="hidden md:table-cell">
                {invoice.invoice_status || "pending"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
