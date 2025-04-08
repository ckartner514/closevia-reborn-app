
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { format, parseISO, isWithinInterval } from "date-fns";
import { toast } from "sonner";
import { DateRange } from "react-day-picker";

// Import custom components
import { InvoiceHeader } from "@/components/invoices/InvoiceHeader";
import { InvoiceFilters } from "@/components/invoices/InvoiceFilters";
import { InvoiceSummary } from "@/components/invoices/InvoiceSummary";
import { InvoiceTable } from "@/components/invoices/InvoiceTable";
import { InvoiceEmptyState } from "@/components/invoices/InvoiceEmptyState";

// Import custom hook
import { useInvoices } from "@/hooks/useInvoices";

const InvoicesPage = () => {
  const { user } = useAuth();
  const { invoices, loading } = useInvoices(user?.id);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [contacts, setContacts] = useState<{ id: string; name: string; company: string }[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [dateOpen, setDateOpen] = useState(false);
  
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
    ];
    
    const rows = filteredInvoices.map((invoice) => [
      format(parseISO(invoice.created_at), "MM/dd/yyyy"),
      invoice.contact?.name || "",
      invoice.contact?.company || "",
      invoice.amount.toFixed(2),
      invoice.title,
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
          <InvoiceTable invoices={filteredInvoices} />
        </>
      ) : (
        <InvoiceEmptyState loading={loading} hasFilters={hasFilters} />
      )}
    </div>
  );
};

export default InvoicesPage;
