
import { format, parseISO } from "date-fns";
import { InvoiceWithContact } from "./types";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

interface InvoiceDetailsDrawerProps {
  invoice: InvoiceWithContact | null;
  onStatusChange?: (invoiceId: string, newStatus: string) => Promise<void>;
}

export const InvoiceDetailsDrawer = ({
  invoice,
  onStatusChange
}: InvoiceDetailsDrawerProps) => {
  const [status, setStatus] = useState<string>(invoice?.invoice_status || "pending");

  if (!invoice) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
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

  const handleStatusChange = async (newStatus: string) => {
    if (onStatusChange) {
      await onStatusChange(invoice.id, newStatus);
      setStatus(newStatus);
    }
  };

  return (
    <SheetContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
      <SheetHeader>
        <SheetTitle className="flex items-center justify-between">
          <span>Invoice Details</span>
          {getStatusBadge(status)}
        </SheetTitle>
        <SheetDescription>
          Created on {format(parseISO(invoice.created_at), "PPP")}
        </SheetDescription>
      </SheetHeader>

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">{invoice.title}</h3>
          <p className="text-sm text-muted-foreground">
            Amount: {formatCurrency(invoice.amount)}
          </p>
        </div>

        <Separator />

        <div className="grid gap-2">
          <label className="text-sm font-medium">Status</label>
          <Select value={status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        <div className="grid gap-2">
          <div className="font-semibold">Client Information</div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-muted-foreground">Name</p>
              <p>{invoice.contact?.name}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Company</p>
              <p>{invoice.contact?.company}</p>
            </div>
          </div>
        </div>

        {invoice.due_date && (
          <>
            <Separator />
            <div>
              <p className="text-muted-foreground text-sm">Due Date</p>
              <p>{format(parseISO(invoice.due_date), "PPP")}</p>
            </div>
          </>
        )}

        {invoice.notes && (
          <>
            <Separator />
            <div>
              <div className="font-semibold mb-2">Notes</div>
              <p className="text-sm whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          </>
        )}
      </div>

      <SheetFooter className="flex-col sm:flex-row gap-2 mt-4">
        <SheetClose asChild>
          <Button variant="outline" size="sm">
            Close
          </Button>
        </SheetClose>
      </SheetFooter>
    </SheetContent>
  );
};
