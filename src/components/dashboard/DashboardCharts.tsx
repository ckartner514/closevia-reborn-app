
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
    <Card className="border-none shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
        <CardTitle className="text-lg font-semibold text-gray-900">Performance Metrics</CardTitle>
        <PeriodSelector period={period} onPeriodChange={onPeriodChange} />
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 p-4">
          <RevenueChart data={revenueData} />
          <ProposalChart data={proposalData} />
        </div>
      </CardContent>
    </Card>
  );
};
