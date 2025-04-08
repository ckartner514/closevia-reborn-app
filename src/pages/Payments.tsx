
import { useState, useEffect } from "react";
import { supabase, Invoice } from "@/lib/supabase";
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
  LineChart, 
  ResponsiveContainer, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  BarChart, 
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { 
  ArrowDownToLine, 
  Loader2, 
  RefreshCw
} from "lucide-react";
import { 
  format, 
  subMonths, 
  parseISO, 
  startOfMonth, 
  endOfMonth, 
  eachMonthOfInterval,
  isSameMonth,
  getMonth
} from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const PaymentsPage = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);
  const [contactData, setContactData] = useState<any[]>([]);
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString());
  const [chartType, setChartType] = useState("monthly");
  
  useEffect(() => {
    if (!user) return;
    fetchInvoices();
  }, [user]);
  
  useEffect(() => {
    if (invoices.length > 0) {
      prepareChartData();
      prepareContactData();
    }
  }, [invoices, yearFilter, chartType]);
  
  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("invoices")
        .select(`
          *,
          contact:contact_id (
            id, name, company
          )
        `)
        .eq("user_id", user!.id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      
      // Process the data to standardize format
      const processedInvoices = data.map((item: any) => ({
        ...item,
        contact: item.contact
      }));
      
      setInvoices(processedInvoices);
    } catch (error) {
      console.error("Error fetching invoice data:", error);
      toast.error("Failed to load payment data");
    } finally {
      setLoading(false);
    }
  };
  
  const prepareChartData = () => {
    // Filter invoices for the selected year
    const filteredInvoices = invoices.filter(invoice => {
      const invoiceDate = parseISO(invoice.created_at);
      return invoiceDate.getFullYear().toString() === yearFilter;
    });
    
    if (chartType === "monthly") {
      // Create all months for the selected year
      const year = parseInt(yearFilter);
      const startDate = new Date(year, 0, 1); // January 1st
      const endDate = new Date(year, 11, 31); // December 31st
      
      const months = eachMonthOfInterval({ start: startDate, end: endDate }).map(date => ({
        month: format(date, "MMM"),
        total: 0,
        count: 0
      }));
      
      // Populate with invoice data
      filteredInvoices.forEach(invoice => {
        const invoiceDate = parseISO(invoice.created_at);
        const monthIndex = invoiceDate.getMonth();
        
        months[monthIndex].total += invoice.amount;
        months[monthIndex].count += 1;
      });
      
      setChartData(months);
    } else if (chartType === "quarterly") {
      // Create quarters for the selected year
      const quarters = [
        { quarter: "Q1", total: 0, count: 0 },
        { quarter: "Q2", total: 0, count: 0 },
        { quarter: "Q3", total: 0, count: 0 },
        { quarter: "Q4", total: 0, count: 0 }
      ];
      
      // Populate with invoice data
      filteredInvoices.forEach(invoice => {
        const invoiceDate = parseISO(invoice.created_at);
        const month = invoiceDate.getMonth();
        const quarterIndex = Math.floor(month / 3);
        
        quarters[quarterIndex].total += invoice.amount;
        quarters[quarterIndex].count += 1;
      });
      
      setChartData(quarters);
    }
  };
  
  const prepareContactData = () => {
    // Filter invoices for the selected year
    const filteredInvoices = invoices.filter(invoice => {
      const invoiceDate = parseISO(invoice.created_at);
      return invoiceDate.getFullYear().toString() === yearFilter;
    });
    
    // Aggregate by contact
    const contactMap = new Map();
    
    filteredInvoices.forEach(invoice => {
      const contactName = invoice.contact?.name || "Unknown";
      
      if (contactMap.has(contactName)) {
        contactMap.set(contactName, contactMap.get(contactName) + invoice.amount);
      } else {
        contactMap.set(contactName, invoice.amount);
      }
    });
    
    // Convert to array for chart
    const contactChartData = Array.from(contactMap.entries())
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5); // Top 5 clients
    
    setContactData(contactChartData);
  };
  
  const handleExportCSV = () => {
    const headers = [
      "Month/Quarter",
      "Total Amount",
      "Invoice Count",
    ];
    
    const rows = chartData.map((item) => [
      item.month || item.quarter,
      item.total.toFixed(2),
      item.count,
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `revenue_${yearFilter}_${chartType}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Revenue data exported to CSV");
  };
  
  // Generate yearly options (last 5 years)
  const yearOptions = Array.from({ length: 5 }, (_, i) => {
    const year = new Date().getFullYear() - i;
    return year.toString();
  });
  
  // Calculate total revenue for the selected period
  const totalRevenue = chartData.reduce((sum, item) => sum + item.total, 0);
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background p-2 border rounded shadow-sm">
          <p className="font-medium">{`${label}`}</p>
          <p className="text-primary">{`Revenue: $${payload[0].value.toFixed(2)}`}</p>
          <p className="text-sm text-muted-foreground">{`Invoices: ${payload[1].value}`}</p>
        </div>
      );
    }
    return null;
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
            disabled={chartData.length === 0}
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
                  <CardDescription>Track your revenue performance</CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">Total Revenue</p>
                  <p className="text-2xl font-bold">${totalRevenue.toFixed(2)}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="monthly" onValueChange={setChartType} value={chartType}>
                <TabsList className="mb-4">
                  <TabsTrigger value="monthly">Monthly</TabsTrigger>
                  <TabsTrigger value="quarterly">Quarterly</TabsTrigger>
                </TabsList>
                
                <TabsContent value="monthly" className="space-y-4">
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis yAxisId="left" orientation="left" stroke="#0ea5e9" />
                        <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar yAxisId="left" dataKey="total" fill="#0ea5e9" name="Revenue" radius={[4, 4, 0, 0]} />
                        <Bar yAxisId="right" dataKey="count" fill="#94a3b8" name="Invoices" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </TabsContent>
                
                <TabsContent value="quarterly" className="space-y-4">
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="quarter" />
                        <YAxis yAxisId="left" orientation="left" stroke="#0ea5e9" />
                        <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar yAxisId="left" dataKey="total" fill="#0ea5e9" name="Revenue" radius={[4, 4, 0, 0]} />
                        <Bar yAxisId="right" dataKey="count" fill="#94a3b8" name="Invoices" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Clients by Revenue</CardTitle>
                <CardDescription>Your highest revenue-generating clients</CardDescription>
              </CardHeader>
              <CardContent>
                {contactData.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No client data available for {yearFilter}
                  </p>
                ) : (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={contactData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="amount"
                        >
                          {contactData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`$${value.toFixed(2)}`, 'Revenue']} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>Monthly progression for {yearFilter}</CardDescription>
              </CardHeader>
              <CardContent>
                {chartData.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No revenue data available for {yearFilter}
                  </p>
                ) : (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey={chartType === "monthly" ? "month" : "quarter"} />
                        <YAxis tickFormatter={(value) => `$${value}`} />
                        <Tooltip formatter={(value) => [`$${value.toFixed(2)}`, 'Revenue']} />
                        <Line
                          type="monotone"
                          dataKey="total"
                          stroke="#0ea5e9"
                          strokeWidth={2}
                          activeDot={{ r: 8 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default PaymentsPage;
