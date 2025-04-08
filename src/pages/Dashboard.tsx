
import { useAuth } from "@/contexts/AuthContext";
import { useDashboardData } from "@/hooks/useDashboardData";
import { MetricsCards } from "@/components/dashboard/MetricsCards";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import { DashboardLoading } from "@/components/dashboard/DashboardLoading";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

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
  const [userFullName, setUserFullName] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user!.id)
        .maybeSingle();
      
      if (!error && data) {
        setUserFullName(data.full_name);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  // Get first name or email username
  const getDisplayName = () => {
    if (userFullName) {
      return userFullName.split(' ')[0];
    }
    return user?.email?.split('@')[0] || 'User';
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="page-title mb-2 md:mb-0">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {getDisplayName()}
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
