
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PeriodSelector } from "./PeriodSelector";
import { RevenueChart } from "./RevenueChart";
import { ProposalChart } from "./ProposalChart";
import { Period } from "@/hooks/useDashboardData";

interface DashboardChartsProps {
  revenueData: any[];
  proposalData: any[];
  period: Period;
  onPeriodChange: (period: Period) => void;
}

export const DashboardCharts = ({ 
  revenueData, 
  proposalData, 
  period, 
  onPeriodChange 
}: DashboardChartsProps) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Performance Metrics</CardTitle>
        <PeriodSelector period={period} onPeriodChange={onPeriodChange} />
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          <RevenueChart data={revenueData} />
          <ProposalChart data={proposalData} />
        </div>
      </CardContent>
    </Card>
  );
};
