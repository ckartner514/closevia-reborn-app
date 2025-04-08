import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
} from "recharts";
import { format, subMonths, isAfter, parseISO, startOfMonth, endOfMonth } from "date-fns";
import { Loader2 } from "lucide-react";

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    proposalsSent: 0,
    dealsClosed: 0,
    totalInvoiceAmount: 0,
  });
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [proposalData, setProposalData] = useState<any[]>([]);
  const [period, setPeriod] = useState("6months"); // 3months, 6months, 1year

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch deals for both proposal and invoice data
        const { data: deals, error: dealsError } = await supabase
          .from("deals")
          .select("*")
          .eq("user_id", user.id);

        if (dealsError) throw dealsError;

        // Filter proposals and invoices from deals
        const proposals = deals.filter(deal => deal.status !== 'invoice');
        const invoices = deals.filter(deal => deal.status === 'invoice');

        // Calculate metrics
        const proposalsSent = proposals.length;
        const dealsClosed = proposals.filter(p => p.status === "accepted").length;
        const totalInvoiceAmount = invoices.reduce((sum, invoice) => sum + invoice.amount, 0);

        setMetrics({
          proposalsSent,
          dealsClosed,
          totalInvoiceAmount,
        });

        // Prepare time-series data for charts
        prepareChartData(proposals, invoices);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, period]);

  const prepareChartData = (proposals: any[], invoices: any[]) => {
    // Determine date range based on selected period
    const today = new Date();
    let startDate;
    
    switch(period) {
      case "3months":
        startDate = subMonths(today, 3);
        break;
      case "1year":
        startDate = subMonths(today, 12);
        break;
      case "6months":
      default:
        startDate = subMonths(today, 6);
    }

    // Create month buckets for the selected period
    const months: any[] = [];
    let currentDate = startDate;
    
    while (isAfter(today, currentDate) || format(currentDate, "MMM yyyy") === format(today, "MMM yyyy")) {
      months.push({
        month: format(currentDate, "MMM yyyy"),
        revenue: 0,
        proposals: 0,
        openProposals: 0,
        acceptedProposals: 0,
        refusedProposals: 0,
      });
      currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    }

    // Populate revenue data from invoices
    invoices.forEach(invoice => {
      const invoiceDate = parseISO(invoice.created_at);
      if (isAfter(invoiceDate, startDate)) {
        const monthKey = format(invoiceDate, "MMM yyyy");
        const monthData = months.find(m => m.month === monthKey);
        if (monthData) {
          monthData.revenue += invoice.amount;
        }
      }
    });

    // Populate proposal data with status breakdown - use actual status values from DB
    proposals.forEach(proposal => {
      const proposalDate = parseISO(proposal.created_at);
      if (isAfter(proposalDate, startDate)) {
        const monthKey = format(proposalDate, "MMM yyyy");
        const monthData = months.find(m => m.month === monthKey);
        if (monthData) {
          monthData.proposals += 1;
          
          // Add status-specific counts
          if (proposal.status === "open") {
            monthData.openProposals += 1;
          } else if (proposal.status === "accepted") {
            monthData.acceptedProposals += 1;
          } else if (proposal.status === "refused") {
            monthData.refusedProposals += 1;
          }
        }
      }
    });

    setRevenueData(months);
    setProposalData(months);
  };

  if (loading) {
    return (
      <div className="flex h-[200px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  return (
    <div className="space-y-8">
      <h1 className="page-title">Dashboard</h1>
      
      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="stats-card">
            <CardTitle className="text-lg">Proposals Sent</CardTitle>
            <div className="stats-value text-closevia-600">{metrics.proposalsSent}</div>
            <p className="stats-label">Total proposals</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="stats-card">
            <CardTitle className="text-lg">Deals Closed</CardTitle>
            <div className="stats-value text-green-600">{metrics.dealsClosed}</div>
            <p className="stats-label">Accepted proposals</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="stats-card">
            <CardTitle className="text-lg">Total Revenue</CardTitle>
            <div className="stats-value text-closevia-700">
              {formatCurrency(metrics.totalInvoiceAmount)}
            </div>
            <p className="stats-label">From all invoices</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>Performance Metrics</CardTitle>
          <Tabs defaultValue="6months" value={period} onValueChange={setPeriod} className="w-[400px]">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="3months">3 Months</TabsTrigger>
              <TabsTrigger value="6months">6 Months</TabsTrigger>
              <TabsTrigger value="1year">1 Year</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            <div>
              <h3 className="mb-2 text-sm font-medium">Revenue Over Time</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 12 }} 
                    />
                    <YAxis 
                      tickFormatter={(value) => `$${value}`} 
                      tick={{ fontSize: 12 }} 
                    />
                    <Tooltip 
                      formatter={(value) => [`$${value}`, 'Revenue']} 
                      labelFormatter={(label) => `Month: ${label}`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#0ea5e9" 
                      strokeWidth={2} 
                      activeDot={{ r: 8 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div>
              <h3 className="mb-2 text-sm font-medium">Proposals by Month</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={proposalData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 12 }} 
                    />
                    <YAxis 
                      allowDecimals={false} 
                      tick={{ fontSize: 12 }} 
                    />
                    <Tooltip 
                      formatter={(value, name) => {
                        const formattedName = {
                          'proposals': 'All Proposals',
                          'openProposals': 'Open Proposals',
                          'acceptedProposals': 'Accepted Proposals',
                          'refusedProposals': 'Refused Proposals'
                        }[name as string] || name;
                        return [value, formattedName];
                      }}
                      labelFormatter={(label) => `Month: ${label}`}
                    />
                    <Bar 
                      dataKey="openProposals" 
                      fill="#facc15" 
                      stackId="a"
                      name="Open Proposals"
                    />
                    <Bar 
                      dataKey="acceptedProposals" 
                      fill="#22c55e" 
                      stackId="a"
                      name="Accepted Proposals"
                    />
                    <Bar 
                      dataKey="refusedProposals" 
                      fill="#ef4444" 
                      stackId="a"
                      name="Refused Proposals"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
