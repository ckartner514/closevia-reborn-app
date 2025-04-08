
import { useAuth } from "@/contexts/AuthContext";
import { useDashboardData } from "@/hooks/useDashboardData";
import { MetricsCards } from "@/components/dashboard/MetricsCards";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import { DashboardLoading } from "@/components/dashboard/DashboardLoading";

const Dashboard = () => {
  const { user } = useAuth();
  const { 
    loading, 
    metrics, 
    revenueData, 
    proposalData, 
    period, 
    setPeriod 
  } = useDashboardData(user?.id);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="page-title mb-2 md:mb-0">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.user_metadata?.name || user?.email?.split('@')[0] || 'User'}
        </p>
      </div>
      
      {loading ? (
        <DashboardLoading />
      ) : (
        <>
          <MetricsCards metrics={metrics} />
          <DashboardCharts 
            revenueData={revenueData}
            proposalData={proposalData}
            period={period}
            onPeriodChange={setPeriod}
          />
        </>
      )}
    </div>
  );
};

export default Dashboard;
