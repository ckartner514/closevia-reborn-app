
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface RevenueChartProps {
  data: any[];
}

export const RevenueChart = ({ data }: RevenueChartProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="rounded-lg bg-white p-4 shadow-sm">
      <h3 className="mb-4 text-base font-semibold text-gray-900">Revenue Over Time</h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
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
              tickFormatter={(value) => formatCurrency(value)} 
              tick={{ fontSize: 12, fill: '#64748b' }} 
              width={80}
            />
            <Tooltip 
              formatter={(value) => [formatCurrency(Number(value)), 'Revenue']} 
              labelFormatter={(label) => `Month: ${label}`}
              contentStyle={{
                backgroundColor: 'white',
                borderRadius: '8px',
                padding: '10px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                borderColor: '#e2e8f0'
              }}
              itemStyle={{ color: '#0c4a6e' }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="revenue" 
              name="Revenue"
              stroke="#0c4a6e" 
              strokeWidth={3} 
              dot={{ r: 6, strokeWidth: 2 }}
              activeDot={{ r: 8, strokeWidth: 2 }} 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
