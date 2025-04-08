
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface ProposalChartProps {
  data: any[];
}

export const ProposalChart = ({ data }: ProposalChartProps) => {
  return (
    <div>
      <h3 className="mb-2 text-sm font-medium">Proposals by Month</h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="month" 
              tick={{ fontSize: 12 }} 
            />
            <YAxis 
              allowDecimals={false} 
              tick={{ fontSize: 12 }} 
            />
            <Tooltip 
              formatter={(value, name) => {
                const formattedName = {
                  'proposals': 'All Proposals',
                  'openProposals': 'Open Proposals',
                  'acceptedProposals': 'Accepted Proposals',
                  'refusedProposals': 'Refused Proposals'
                }[name as string] || name;
                return [value, formattedName];
              }}
              labelFormatter={(label) => `Month: ${label}`}
            />
            <Bar 
              dataKey="openProposals" 
              fill="#facc15" 
              stackId="a"
              name="Open Proposals"
            />
            <Bar 
              dataKey="acceptedProposals" 
              fill="#22c55e" 
              stackId="a"
              name="Accepted Proposals"
            />
            <Bar 
              dataKey="refusedProposals" 
              fill="#ef4444" 
              stackId="a"
              name="Refused Proposals"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
