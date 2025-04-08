
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { format, subMonths, isAfter, parseISO, isBefore, differenceInDays } from "date-fns";

export type Period = "3months" | "6months" | "1year";

export type DashboardMetrics = {
  proposalsSent: number;
  dealsClosed: number;
  totalInvoiceAmount: number;
  openProposals: number;
  overdueInvoices: number;
  conversionRate: number;
};

export const useDashboardData = (userId: string | undefined) => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    proposalsSent: 0,
    dealsClosed: 0,
    totalInvoiceAmount: 0,
    openProposals: 0,
    overdueInvoices: 0,
    conversionRate: 0,
  });
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [proposalData, setProposalData] = useState<any[]>([]);
  const [openProposals, setOpenProposals] = useState(0);
  const [overdueInvoices, setOverdueInvoices] = useState(0);
  const [upcomingInvoices, setUpcomingInvoices] = useState<any[]>([]);
  const [period, setPeriod] = useState<Period>("6months");

  useEffect(() => {
    if (!userId) return;
    fetchData();
  }, [userId, period]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch proposals
      const { data: proposals, error: proposalsError } = await supabase
        .from("deals")
        .select("*")
        .eq("user_id", userId)
        .neq("status", "invoice");

      if (proposalsError) throw proposalsError;

      // Fetch all invoices
      const { data: allInvoices, error: allInvoicesError } = await supabase
        .from("deals")
        .select("*, contact:contacts(name, company)")
        .eq("user_id", userId)
        .eq("status", "invoice");

      if (allInvoicesError) throw allInvoicesError;

      // Fetch paid invoices only
      const { data: invoices, error: invoicesError } = await supabase
        .from("deals")
        .select("*, contact:contacts(name, company)")
        .eq("user_id", userId)
        .eq("status", "invoice")
        .eq("invoice_status", "paid");

      if (invoicesError) throw invoicesError;

      console.log("Fetched paid invoices for dashboard:", invoices);
      console.log("Fetched proposals for dashboard:", proposals);

      // Calculate open proposals (status = 'open')
      const openProposalsCount = proposals.filter(p => p.status === "open").length;
      setOpenProposals(openProposalsCount);

      // Calculate overdue invoices
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const overdueInvoicesCount = allInvoices.filter(invoice => {
        if (!invoice.due_date) return false;
        const dueDate = parseISO(invoice.due_date);
        return isBefore(dueDate, today) && invoice.invoice_status !== "paid";
      }).length;
      setOverdueInvoices(overdueInvoicesCount);

      // Get upcoming invoices due (not paid and due date in the future)
      const upcomingInvoicesData = allInvoices
        .filter(invoice => {
          if (!invoice.due_date) return false;
          const dueDate = parseISO(invoice.due_date);
          return isAfter(dueDate, today) && invoice.invoice_status !== "paid";
        })
        .sort((a, b) => {
          if (!a.due_date || !b.due_date) return 0;
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        })
        .slice(0, 3) // Limit to top 3
        .map(invoice => ({
          id: invoice.id,
          title: invoice.title,
          due_date: invoice.due_date,
          amount: invoice.amount
        }));

      setUpcomingInvoices(upcomingInvoicesData);

      // Calculate conversion rate
      const totalProposals = proposals.length;
      const acceptedProposals = proposals.filter(p => p.status === "accepted").length;
      const conversionRate = totalProposals > 0 
        ? (acceptedProposals / totalProposals) * 100 
        : 0;

      // Calculate basic metrics
      const proposalsSent = proposals.length;
      const dealsClosed = proposals.filter(p => p.status === "accepted").length;
      const totalInvoiceAmount = invoices.reduce((sum, invoice) => sum + invoice.amount, 0);

      setMetrics({
        proposalsSent,
        dealsClosed,
        totalInvoiceAmount,
        openProposals: openProposalsCount,
        overdueInvoices: overdueInvoicesCount,
        conversionRate,
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

    // Populate revenue data from PAID invoices only
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

    // Populate proposal data with status breakdown
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
    setPeriod,
    openProposals,
    overdueInvoices,
    upcomingInvoices
  };
};
