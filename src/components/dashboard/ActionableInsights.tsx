
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { differenceInDays, format, parseISO } from "date-fns";
import { InfoIcon, CalendarIcon } from "lucide-react";

interface UpcomingInvoice {
  id: string;
  title: string;
  due_date: string;
  amount: number;
}

interface ActionableInsightsProps {
  openProposals: number;
  overdueInvoices: number;
  upcomingInvoices: UpcomingInvoice[];
}

export const ActionableInsights = ({ 
  openProposals, 
  overdueInvoices, 
  upcomingInvoices 
}: ActionableInsightsProps) => {
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getDaysRemaining = (dueDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDateObj = parseISO(dueDate);
    const diff = differenceInDays(dueDateObj, today);
    
    return diff === 1 
      ? 'Tomorrow' 
      : `In ${diff} days`;
  };

  return (
    <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
      {/* This Week's Focus */}
      <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <InfoIcon className="h-5 w-5 text-blue-600" />
          <h3 className="font-medium text-gray-900">This Week's Focus</h3>
        </div>
        
        <p className="text-gray-700 mt-3">
          {openProposals === 0 && overdueInvoices === 0 ? (
            <span className="text-green-600 font-medium">You're all caught up! No urgent tasks for this week.</span>
          ) : (
            <>
              You have{' '}
              {openProposals > 0 && (
                <span className="font-medium text-amber-600">{openProposals} proposal{openProposals !== 1 ? 's' : ''} to follow up</span>
              )}
              {openProposals > 0 && overdueInvoices > 0 && ' and '}
              {overdueInvoices > 0 && (
                <span className="font-medium text-red-600">{overdueInvoices} overdue invoice{overdueInvoices !== 1 ? 's' : ''}</span>
              )}
              .
            </>
          )}
        </p>
        
        <div className="mt-4 text-sm text-gray-500">
          {openProposals > 0 && (
            <p>Don't let leads go cold! Follow up on open proposals to increase your conversion rate.</p>
          )}
          {overdueInvoices > 0 && (
            <p className="mt-1">Remind clients about overdue payments to maintain your cash flow.</p>
          )}
        </div>
      </div>

      {/* Upcoming Due Dates */}
      <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <CalendarIcon className="h-5 w-5 text-blue-600" />
          <h3 className="font-medium text-gray-900">Upcoming Due Dates</h3>
        </div>
        
        {upcomingInvoices.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Due In</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {upcomingInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium truncate max-w-[160px]" title={invoice.title}>
                    {invoice.title}
                  </TableCell>
                  <TableCell>{getDaysRemaining(invoice.due_date)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(invoice.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center justify-center h-[160px] text-gray-500">
            <p>No upcoming invoices due</p>
            <p className="text-sm mt-1">All caught up on payments!</p>
          </div>
        )}
      </div>
    </div>
  );
};
