
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
    <div className="space-y-8">
      <h1 className="page-title">Dashboard</h1>
      
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
