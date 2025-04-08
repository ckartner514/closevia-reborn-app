
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { format, subMonths, isAfter, parseISO } from "date-fns";

export type Period = "3months" | "6months" | "1year";
export type DashboardMetrics = {
  proposalsSent: number;
  dealsClosed: number;
  totalInvoiceAmount: number;
};

export const useDashboardData = (userId: string | undefined) => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    proposalsSent: 0,
    dealsClosed: 0,
    totalInvoiceAmount: 0,
  });
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [proposalData, setProposalData] = useState<any[]>([]);
  const [period, setPeriod] = useState<Period>("6months");

  useEffect(() => {
    if (!userId) return;
    fetchData();
  }, [userId, period]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch proposals separately
      const { data: proposals, error: proposalsError } = await supabase
        .from("deals")
        .select("*")
        .eq("user_id", userId)
        .not("status", "eq", "invoice");

      if (proposalsError) throw proposalsError;

      // Fetch invoices separately
      const { data: invoices, error: invoicesError } = await supabase
        .from("deals")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "invoice");

      if (invoicesError) throw invoicesError;

      console.log("Fetched invoices for dashboard:", invoices);
      console.log("Fetched proposals for dashboard:", proposals);

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

  return {
    loading,
    metrics,
    revenueData,
    proposalData,
    period,
    setPeriod
  };
};
