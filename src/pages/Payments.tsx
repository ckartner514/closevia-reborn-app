import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BarChart, 
  Bar,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend
} from "recharts";
import { 
  ArrowDownToLine, 
  Loader2,
  DollarSign
} from "lucide-react";
import { 
  format, 
  parseISO, 
  startOfYear,
  endOfYear,
  eachMonthOfInterval,
  isSameMonth
} from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InvoiceTable } from "@/components/invoices/InvoiceTable";
import { InvoiceWithContact } from "@/components/invoices/types";
import { toast } from "sonner";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const PaymentsPage = () => {
  const { user } = useAuth();
  const [paidInvoices, setPaidInvoices] = useState<InvoiceWithContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthlyRevenue, setMonthlyRevenue] = useState<any[]>([]);
  const [clientRevenue, setClientRevenue] = useState<any[]>([]);
  const [yearFilter, setYearFilter] = useState<string>(new Date().getFullYear().toString());
  
  useEffect(() => {
    if (!user) return;
    fetchPaidInvoices();
  }, [user, yearFilter]);
  
  const fetchPaidInvoices = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from("deals")
        .select(`
          *,
          contact:contact_id (
            id, name, company
          )
        `)
        .eq("user_id", user!.id)
        .eq("status", "invoice")
        .eq("invoice_status", "paid")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      console.log("Fetched paid invoices:", data);
      
      const year = parseInt(yearFilter);
      const filteredInvoices = data.filter((invoice: any) => {
        const invoiceDate = parseISO(invoice.created_at);
        return invoiceDate.getFullYear() === year;
      });
      
      const invoicesWithContacts = filteredInvoices.map((item: any) => ({
        ...item,
        contact: item.contact
      }));
      
      setPaidInvoices(invoicesWithContacts);
      
      prepareChartData(invoicesWithContacts);
      prepareClientData(invoicesWithContacts);
    } catch (error) {
      console.error("Error fetching paid invoices:", error);
      toast.error("Failed to load payment data");
    } finally {
      setLoading(false);
    }
  };
  
  const prepareChartData = (invoices: InvoiceWithContact[]) => {
    const year = parseInt(yearFilter);
    const startDate = startOfYear(new Date(year, 0, 1));
    const endDate = endOfYear(new Date(year, 0, 1));
    
    const monthsData = eachMonthOfInterval({ 
      start: startDate, 
      end: endDate 
    }).map(date => ({
      name: format(date, "MMM"),
      revenue: 0,
      count: 0
    }));
    
    invoices.forEach(invoice => {
      const invoiceDate = parseISO(invoice.created_at);
      const monthIndex = invoiceDate.getMonth();
      
      monthsData[monthIndex].revenue += invoice.amount;
      monthsData[monthIndex].count += 1;
    });
    
    setMonthlyRevenue(monthsData);
  };
  
  const prepareClientData = (invoices: InvoiceWithContact[]) => {
    const clientMap = new Map<string, number>();
    
    invoices.forEach(invoice => {
      const clientName = invoice.contact?.name || "Unknown";
      
      if (clientMap.has(clientName)) {
        clientMap.set(clientName, clientMap.get(clientName)! + invoice.amount);
      } else {
        clientMap.set(clientName, invoice.amount);
      }
    });
    
    const clientData = Array.from(clientMap.entries())
      .map(([name, amount]) => ({ 
        name: name.length > 15 ? name.substring(0, 12) + '...' : name,
        fullName: name,
        value: amount 
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
    
    setClientRevenue(clientData);
  };
  
  const handleExportCSV = () => {
    if (paidInvoices.length === 0) {
      toast.error("No payment data to export");
      return;
    }
    
    const headers = [
      "Date",
      "Contact",
      "Company",
      "Amount",
      "Invoice Title"
    ];
    
    const rows = paidInvoices.map((invoice) => [
      format(parseISO(invoice.created_at), "MM/dd/yyyy"),
      invoice.contact?.name || "Unknown",
      invoice.contact?.company || "Unknown",
      invoice.amount.toFixed(2),
      invoice.title
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `payments_${yearFilter}_export.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Payment data exported to CSV");
  };
  
  const yearOptions = Array.from({ length: 5 }, (_, i) => {
    const year = new Date().getFullYear() - i;
    return year.toString();
  });
  
  const totalRevenue = paidInvoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background p-2 border rounded shadow-sm">
          <p className="font-medium">{`${label}`}</p>
          <p className="text-primary">{`Revenue: $${typeof payload[0].value === 'number' ? payload[0].value.toFixed(2) : payload[0].value}`}</p>
          {payload[1] && <p className="text-sm text-muted-foreground">{`Invoices: ${payload[1].value}`}</p>}
        </div>
      );
    }
    return null;
  };
  
  const CustomPieChartLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name, fullName }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor="middle" 
        dominantBaseline="central"
        fontSize={12}
        title={fullName}
      >
        {`${name}: ${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Payments</h1>
        
        <div className="flex items-center gap-2">
          <Select 
            value={yearFilter} 
            onValueChange={setYearFilter}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map(year => (
                <SelectItem key={year} value={year}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline"
            onClick={handleExportCSV}
            className="gap-2"
            disabled={paidInvoices.length === 0}
          >
            <ArrowDownToLine className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Revenue Overview - {yearFilter}</CardTitle>
                  <CardDescription>Payments collected</CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">Total Revenue</p>
                  <p className="text-2xl font-bold">${totalRevenue.toFixed(2)}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {paidInvoices.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <DollarSign className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p>No paid invoices for {yearFilter}</p>
                </div>
              ) : (
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyRevenue}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis 
                        yAxisId="left" 
                        orientation="left" 
                        tickFormatter={(value) => `$${value}`} 
                      />
                      <YAxis 
                        yAxisId="right" 
                        orientation="right" 
                        dataKey="count" 
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar 
                        yAxisId="left" 
                        dataKey="revenue" 
                        name="Revenue" 
                        fill="#0ea5e9" 
                        radius={[4, 4, 0, 0]} 
                      />
                      <Bar 
                        yAxisId="right" 
                        dataKey="count" 
                        name="Invoices" 
                        fill="#94a3b8" 
                        radius={[4, 4, 0, 0]} 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
          
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Clients</CardTitle>
                <CardDescription>Revenue by client for {yearFilter}</CardDescription>
              </CardHeader>
              <CardContent>
                {clientRevenue.length === 0 ? (
                  <div className="py-16 text-center text-muted-foreground">
                    No client data available
                  </div>
                ) : (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={clientRevenue}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent, fullName }) => CustomPieChartLabel({ cx: "50%", cy: "50%", midAngle: 0, innerRadius: 40, outerRadius: 80, percent, name, fullName })}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {clientRevenue.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value, name, props) => {
                          const entry = props.payload;
                          return [`$${typeof value === 'number' ? value.toFixed(2) : value}`, entry.fullName || entry.name];
                        }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Paid Invoices</CardTitle>
                <CardDescription>Recent payments for {yearFilter}</CardDescription>
              </CardHeader>
              <CardContent>
                {paidInvoices.length === 0 ? (
                  <div className="py-16 text-center text-muted-foreground">
                    No paid invoices for this period
                  </div>
                ) : (
                  <div className="max-h-[300px] overflow-y-auto">
                    <InvoiceTable 
                      invoices={paidInvoices.slice(0, 5)}
                      readOnly={true}
                    />
                    {paidInvoices.length > 5 && (
                      <p className="text-xs text-center mt-2 text-muted-foreground">
                        Showing 5 of {paidInvoices.length} paid invoices
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {paidInvoices.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>All Paid Invoices</CardTitle>
                <CardDescription>Complete payment history for {yearFilter}</CardDescription>
              </CardHeader>
              <CardContent>
                <InvoiceTable 
                  invoices={paidInvoices}
                  readOnly={true}
                />
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default PaymentsPage;
