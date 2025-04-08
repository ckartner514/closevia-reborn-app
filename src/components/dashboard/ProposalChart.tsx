
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface ProposalChartProps {
  data: any[];
}

export const ProposalChart = ({ data }: ProposalChartProps) => {
  return (
    <div className="rounded-lg bg-white p-4 shadow-sm">
      <h3 className="mb-4 text-base font-semibold text-gray-900">Proposals by Month</h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="month" 
              tick={{ fontSize: 12, fill: '#64748b' }}
              tickMargin={10}
            />
            <YAxis 
              allowDecimals={false} 
              tick={{ fontSize: 12, fill: '#64748b' }}
            />
            <Tooltip 
              formatter={(value, name) => {
                const formattedName = {
                  'openProposals': 'Open',
                  'acceptedProposals': 'Accepted',
                  'refusedProposals': 'Declined'
                }[name as string] || name;
                return [value, formattedName];
              }}
              labelFormatter={(label) => `Month: ${label}`}
              contentStyle={{
                backgroundColor: 'white',
                borderRadius: '8px',
                padding: '10px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                borderColor: '#e2e8f0'
              }}
            />
            <Legend 
              formatter={(value) => {
                const formattedName = {
                  'openProposals': 'Open',
                  'acceptedProposals': 'Accepted',
                  'refusedProposals': 'Declined'
                }[value] || value;
                return <span style={{ color: '#64748b', fontSize: 12 }}>{formattedName}</span>;
              }}
            />
            <Bar 
              dataKey="openProposals" 
              fill="#f59e0b" 
              stackId="a"
              name="openProposals"
              radius={[4, 4, 0, 0]}
            />
            <Bar 
              dataKey="acceptedProposals" 
              fill="#10b981" 
              stackId="a"
              name="acceptedProposals"
              radius={[4, 4, 0, 0]}
            />
            <Bar 
              dataKey="refusedProposals" 
              fill="#f43f5e" 
              stackId="a"
              name="refusedProposals"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
