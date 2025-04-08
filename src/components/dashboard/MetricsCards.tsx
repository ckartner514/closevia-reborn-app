
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { DashboardMetrics } from "@/hooks/useDashboardData";
import { CreditCard, Users, FileText } from "lucide-react";

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

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card className="overflow-hidden border-none shadow-md">
        <div className="h-2 bg-blue-500"></div>
        <CardContent className="stats-card stats-card-animate">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Proposals Sent</CardTitle>
            <div className="bg-blue-100 p-2 rounded-full">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <div className="stats-value text-blue-600">{metrics.proposalsSent}</div>
          <p className="stats-label">Total proposals</p>
        </CardContent>
      </Card>
      
      <Card className="overflow-hidden border-none shadow-md">
        <div className="h-2 bg-green-500"></div>
        <CardContent className="stats-card stats-card-animate">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Deals Closed</CardTitle>
            <div className="bg-green-100 p-2 rounded-full">
              <Users className="h-5 w-5 text-green-600" />
            </div>
          </div>
          <div className="stats-value text-green-600">{metrics.dealsClosed}</div>
          <p className="stats-label">Accepted proposals</p>
        </CardContent>
      </Card>
      
      <Card className="overflow-hidden border-none shadow-md">
        <div className="h-2 bg-primary"></div>
        <CardContent className="stats-card stats-card-animate">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Total Revenue</CardTitle>
            <div className="bg-blue-100 p-2 rounded-full">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div className="stats-value text-primary">
            {formatCurrency(metrics.totalInvoiceAmount)}
          </div>
          <p className="stats-label">From all invoices</p>
        </CardContent>
      </Card>
    </div>
  );
};
