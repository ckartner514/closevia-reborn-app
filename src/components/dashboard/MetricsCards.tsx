
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { DashboardMetrics } from "@/hooks/useDashboardData";

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
  );
};
