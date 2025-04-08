
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { DashboardMetrics } from "@/hooks/useDashboardData";
import { CreditCard, Users, FileText, AlertCircle, BarChart } from "lucide-react";

interface MetricsCardsProps {
  metrics: DashboardMetrics;
}

export const MetricsCards = ({ metrics }: MetricsCardsProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value / 100);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="overflow-hidden border-none shadow-md">
        <div className="h-2 bg-blue-500"></div>
        <CardContent className="stats-card stats-card-animate">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Open Proposals</CardTitle>
            <div className="bg-blue-100 p-2 rounded-full">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <div className="stats-value text-blue-600">{metrics.openProposals}</div>
          <p className="stats-label">Awaiting response</p>
        </CardContent>
      </Card>
      
      <Card className="overflow-hidden border-none shadow-md">
        <div className="h-2 bg-amber-500"></div>
        <CardContent className="stats-card stats-card-animate">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Overdue Invoices</CardTitle>
            <div className="bg-amber-100 p-2 rounded-full">
              <AlertCircle className="h-5 w-5 text-amber-600" />
            </div>
          </div>
          <div className="stats-value text-amber-600">{metrics.overdueInvoices}</div>
          <p className="stats-label">Past due date</p>
        </CardContent>
      </Card>
      
      <Card className="overflow-hidden border-none shadow-md">
        <div className="h-2 bg-green-500"></div>
        <CardContent className="stats-card stats-card-animate">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Total Revenue</CardTitle>
            <div className="bg-green-100 p-2 rounded-full">
              <CreditCard className="h-5 w-5 text-green-600" />
            </div>
          </div>
          <div className="stats-value text-green-600">
            {formatCurrency(metrics.totalInvoiceAmount)}
          </div>
          <p className="stats-label">From paid invoices</p>
        </CardContent>
      </Card>
      
      <Card className="overflow-hidden border-none shadow-md">
        <div className="h-2 bg-purple-500"></div>
        <CardContent className="stats-card stats-card-animate">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Conversion Rate</CardTitle>
            <div className="bg-purple-100 p-2 rounded-full">
              <BarChart className="h-5 w-5 text-purple-600" />
            </div>
          </div>
          <div className="stats-value text-purple-600">
            {formatPercentage(metrics.conversionRate)}
          </div>
          <p className="stats-label">Proposals to invoices</p>
        </CardContent>
      </Card>
    </div>
  );
};
