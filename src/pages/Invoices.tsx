
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { format, parseISO, isWithinInterval } from "date-fns";
import { toast } from "sonner";
import { DateRange } from "react-day-picker";
import { useLocation } from "react-router-dom";

// Import custom components
import { InvoiceHeader } from "@/components/invoices/InvoiceHeader";
import { InvoiceFilters } from "@/components/invoices/InvoiceFilters";
import { InvoiceSummary } from "@/components/invoices/InvoiceSummary";
import { InvoiceTable } from "@/components/invoices/InvoiceTable";
import { InvoiceEmptyState } from "@/components/invoices/InvoiceEmptyState";
import { InvoiceDetailsDrawer } from "@/components/invoices/InvoiceDetailsDrawer";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Sheet } from "@/components/ui/sheet";

// Import custom hook
import { useInvoices } from "@/hooks/useInvoices";
import { InvoiceWithContact } from "@/components/invoices/types";

const InvoicesPage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const { 
    invoices, 
    loading, 
    isUpdatingStatus,
    isDeletingInvoice,
    fetchInvoices, 
    updateInvoiceStatus,
    deleteInvoice
  } = useInvoices(user?.id);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [contacts, setContacts] = useState<{ id: string; name: string; company: string }[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [dateOpen, setDateOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [highlightedInvoiceId, setHighlightedInvoiceId] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceWithContact | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const invoiceId = query.get('highlightInvoice');
    
    if (invoiceId) {
      setHighlightedInvoiceId(invoiceId);
      
      setTimeout(() => {
        const invoiceElement = document.getElementById(`invoice-${invoiceId}`);
        if (invoiceElement) {
          invoiceElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          
          invoiceElement.classList.add('bg-accent');
          setTimeout(() => {
            invoiceElement.classList.remove('bg-accent');
            invoiceElement.classList.add('transition-colors', 'duration-1000');
          }, 100);
        }
        
        window.history.replaceState({}, document.title, '/invoices');
      }, 500);
    }
  }, [location.search, invoices]);
  
  useEffect(() => {
    if (!user) return;
    fetchContacts();
  }, [user]);

  const fetchContacts = async () => {
    try {
      const { data, error } = await supabase
        .from("contacts")
        .select("id, name, company")
        .eq("user_id", user!.id)
        .order("name", { ascending: true });

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error("Error fetching contacts:", error);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      "Created Date",
      "Contact",
      "Company",
      "Amount",
      "Title",
      "Status"
    ];
    
    const rows = filteredInvoices.map((invoice) => [
      format(parseISO(invoice.created_at), "MM/dd/yyyy"),
      invoice.contact?.name || "",
      invoice.contact?.company || "",
      invoice.amount.toFixed(2),
      invoice.title,
      invoice.invoice_status
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `invoices_export_${format(new Date(), "yyyy-MM-dd")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Invoices exported to CSV");
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedContactId(null);
    setDateRange(undefined);
  };

  const handleDeleteInvoice = async () => {
    if (!invoiceToDelete) return;
    
    const success = await deleteInvoice(invoiceToDelete);
    if (success) {
      setDeleteDialogOpen(false);
      setInvoiceToDelete(null);
    }
  };

  const onDeleteClick = (invoiceId: string) => {
    setInvoiceToDelete(invoiceId);
    setDeleteDialogOpen(true);
  };

  const handleStatusChange = async (invoiceId: string, newStatus: string) => {
    await updateInvoiceStatus(invoiceId, newStatus);
  };

  const handleSelectInvoice = (invoice: InvoiceWithContact) => {
    setSelectedInvoice(invoice);
    setDrawerOpen(true);
  };

  // Handle drawer open change with data refresh
  const handleDrawerOpenChange = (open: boolean) => {
    setDrawerOpen(open);
    if (!open) {
      // Refresh data when drawer is closed
      fetchInvoices();
      setSelectedInvoice(null);
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    if (selectedContactId && selectedContactId !== "all" && invoice.contact_id !== selectedContactId) {
      return false;
    }
    
    if (dateRange?.from) {
      const invoiceDate = parseISO(invoice.created_at);
      if (dateRange.to) {
        if (!isWithinInterval(invoiceDate, { start: dateRange.from, end: dateRange.to })) {
          return false;
        }
      } else {
        if (invoiceDate < dateRange.from) {
          return false;
        }
      }
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesContact = invoice.contact?.name.toLowerCase().includes(query) || 
                            invoice.contact?.company.toLowerCase().includes(query);
      const matchesTitle = invoice.title.toLowerCase().includes(query);
      const matchesAmount = invoice.amount.toString().includes(query);
      
      return matchesContact || matchesTitle || matchesAmount;
    }
    
    return true;
  });

  const hasFilters = !!(searchQuery || selectedContactId || dateRange);

  return (
    <div className="space-y-6">
      <InvoiceHeader 
        onExportCSV={handleExportCSV} 
        hasInvoices={filteredInvoices.length > 0} 
      />
      
      <InvoiceFilters 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        contacts={contacts}
        selectedContactId={selectedContactId}
        setSelectedContactId={setSelectedContactId}
        dateRange={dateRange}
        setDateRange={setDateRange}
        dateOpen={dateOpen}
        setDateOpen={setDateOpen}
        clearFilters={clearFilters}
      />
      
      {filteredInvoices.length > 0 ? (
        <>
          <InvoiceSummary 
            filteredInvoices={filteredInvoices} 
            hasFilters={hasFilters} 
          />
          <InvoiceTable 
            invoices={filteredInvoices} 
            onStatusChange={handleStatusChange}
            onDeleteInvoice={onDeleteClick}
            onSelectInvoice={handleSelectInvoice}
            highlightedInvoiceId={highlightedInvoiceId}
            isUpdatingStatus={isUpdatingStatus}
          />
        </>
      ) : (
        <InvoiceEmptyState loading={loading} hasFilters={hasFilters} />
      )}

      <Sheet open={drawerOpen} onOpenChange={handleDrawerOpenChange}>
        <InvoiceDetailsDrawer 
          invoice={selectedInvoice} 
          onStatusChange={updateInvoiceStatus}
        />
      </Sheet>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this invoice?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the invoice from your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteInvoice}
              disabled={isDeletingInvoice}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingInvoice ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default InvoicesPage;
