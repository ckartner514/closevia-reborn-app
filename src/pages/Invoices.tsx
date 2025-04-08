import { useState, useEffect } from "react";
import { supabase, Invoice } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ArrowDownToLine, 
  CalendarIcon, 
  Loader2, 
  RefreshCw, 
  Search, 
  X 
} from "lucide-react";
import { format, parseISO, isWithinInterval, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";

type InvoiceWithContact = Invoice & {
  contact: {
    id: string;
    name: string;
    company: string;
  };
  proposal?: {
    id: string;
    title: string;
  } | null;
};

const InvoicesPage = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<InvoiceWithContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [contacts, setContacts] = useState<{ id: string; name: string; company: string }[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [dateOpen, setDateOpen] = useState(false);
  
  useEffect(() => {
    if (!user) return;
    fetchInvoices();
    fetchContacts();
  }, [user]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("invoices")
        .select(`
          *,
          contact:contact_id (
            id, name, company
          ),
          proposal:proposal_id (
            id, title
          )
        `)
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      const invoicesWithContacts = data.map((item: any) => ({
        ...item,
        contact: item.contact,
        proposal: item.proposal
      }));
      
      setInvoices(invoicesWithContacts);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      toast.error("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

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
      "Related Proposal",
    ];
    
    const rows = filteredInvoices.map((invoice) => [
      format(parseISO(invoice.created_at), "MM/dd/yyyy"),
      invoice.contact?.name || "",
      invoice.contact?.company || "",
      invoice.amount.toFixed(2),
      invoice.proposal?.title || "",
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
    if (selectedContactId && invoice.contact_id !== selectedContactId) {
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
      const matchesProposal = invoice.proposal?.title.toLowerCase().includes(query);
      const matchesAmount = invoice.amount.toString().includes(query);
      
      return matchesContact || matchesProposal || matchesAmount;
    }
    
    return true;
  });

  const totalInvoiceAmount = filteredInvoices.reduce((sum, invoice) => sum + invoice.amount, 0);

  const setCurrentMonth = () => {
    const now = new Date();
    setDateRange({
      from: startOfMonth(now),
      to: endOfMonth(now)
    });
  };
  
  const setPreviousMonth = () => {
    const now = new Date();
    const previousMonth = subMonths(now, 1);
    setDateRange({
      from: startOfMonth(previousMonth),
      to: endOfMonth(previousMonth)
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title mb-1">Internal Invoices</h1>
          <p className="text-muted-foreground">For internal revenue tracking - not sent to clients</p>
        </div>
        
        <Button 
          variant="outline"
          onClick={handleExportCSV}
          className="gap-2"
          disabled={filteredInvoices.length === 0}
        >
          <ArrowDownToLine className="h-4 w-4" />
          Export CSV
        </Button>
      </div>
      
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search invoices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        <Select 
          value={selectedContactId || ""} 
          onValueChange={(value) => setSelectedContactId(value || null)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All contacts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All contacts</SelectItem>
            {contacts.map(contact => (
              <SelectItem key={contact.id} value={contact.id}>
                {contact.name} ({contact.company})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Popover open={dateOpen} onOpenChange={setDateOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[200px] justify-start text-left",
                !dateRange && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "LLL dd, y")} -{" "}
                    {format(dateRange.to, "LLL dd, y")}
                  </>
                ) : (
                  format(dateRange.from, "LLL dd, y")
                )
              ) : (
                "Date range"
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="p-3 border-b">
              <div className="flex gap-2 mb-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-xs"
                  onClick={setCurrentMonth}
                >
                  Current Month
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-xs"
                  onClick={setPreviousMonth}
                >
                  Last Month
                </Button>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-xs"
                  onClick={() => setDateRange(undefined)}
                >
                  Clear
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-xs ml-auto"
                  onClick={() => setDateOpen(false)}
                >
                  Apply
                </Button>
              </div>
            </div>
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={setDateRange}
              initialFocus
              numberOfMonths={2}
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
        
        {(searchQuery || selectedContactId || dateRange) && (
          <Button 
            variant="ghost" 
            onClick={clearFilters}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Clear Filters
          </Button>
        )}
      </div>
      
      {filteredInvoices.length > 0 && (
        <div className="bg-muted p-4 rounded-md">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-medium">Showing {filteredInvoices.length} invoices</h3>
              {(searchQuery || selectedContactId || dateRange) && (
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
      )}
      
      {loading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="text-center p-8">
          <p className="text-lg text-muted-foreground">No invoices found</p>
          {(searchQuery || selectedContactId || dateRange) && (
            <p className="text-sm text-muted-foreground mt-2">
              Try adjusting your filters
            </p>
          )}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Created</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="hidden md:table-cell">Company</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="hidden md:table-cell">Related Proposal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell>{format(parseISO(invoice.created_at), "PP")}</TableCell>
                  <TableCell>{invoice.contact?.name}</TableCell>
                  <TableCell className="hidden md:table-cell">{invoice.contact?.company}</TableCell>
                  <TableCell>${invoice.amount.toFixed(2)}</TableCell>
                  <TableCell className="hidden md:table-cell">{invoice.proposal?.title || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default InvoicesPage;
