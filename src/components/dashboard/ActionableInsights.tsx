
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDistanceToNow } from "date-fns";

interface ActionableInsightsProps {
  proposalsToFollowUp: number;
  overdueInvoices: number;
  upcomingInvoices: {
    id: string;
    title: string;
    due_date: string;
    amount: number;
  }[];
}

export const ActionableInsights = ({ 
  proposalsToFollowUp, 
  overdueInvoices,
  upcomingInvoices
}: ActionableInsightsProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  return (
    <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
      {/* This Week's Focus Card */}
      <Card className="border-none shadow-md">
        <CardHeader className="pb-2 border-b">
          <CardTitle className="text-lg font-semibold text-gray-900">This Week's Focus</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex flex-col items-start justify-center h-full">
            <p className="text-lg text-gray-800">
              You have <span className="font-semibold text-blue-600">{proposalsToFollowUp} {proposalsToFollowUp === 1 ? 'proposal' : 'proposals'}</span> to follow up 
              and <span className="font-semibold text-amber-600">{overdueInvoices} {overdueInvoices === 1 ? 'overdue invoice' : 'overdue invoices'}</span>.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Due Dates Card */}
      <Card className="border-none shadow-md">
        <CardHeader className="pb-2 border-b">
          <CardTitle className="text-lg font-semibold text-gray-900">Upcoming Due Dates</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          {upcomingInvoices.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice Title</TableHead>
                  <TableHead>Due In</TableHead>
                  <TableHead>Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcomingInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.title}</TableCell>
                    <TableCell>
                      {invoice.due_date && 
                        `In ${formatDistanceToNow(new Date(invoice.due_date), { addSuffix: false })}`
                      }
                    </TableCell>
                    <TableCell>{formatCurrency(invoice.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex justify-center items-center py-4">
              <p className="text-gray-500">No upcoming invoices due</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
