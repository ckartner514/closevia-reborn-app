
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface TopClientsChartProps {
  clients: { name: string; company: string; revenue: number }[];
}

export const TopClientsChart = ({ clients }: TopClientsChartProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Prepare data for the chart
  const chartData = clients.map(client => ({
    name: client.name,
    company: client.company,
    revenue: client.revenue,
    label: `${client.name} (${client.company})`,
  }));

  return (
    <div className="h-[300px]">
      {clients.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 60,
            }}
            layout="vertical"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              type="number"
              tickFormatter={(value) => formatCurrency(value)}
              tick={{ fontSize: 12, fill: '#64748b' }}
            />
            <YAxis
              dataKey="label"
              type="category"
              width={150}
              tick={{ fontSize: 12, fill: '#64748b' }}
            />
            <Tooltip
              formatter={(value) => [formatCurrency(Number(value)), 'Revenue']}
              labelFormatter={(label) => `Client: ${label}`}
              contentStyle={{
                backgroundColor: 'white',
                borderRadius: '8px',
                padding: '10px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                borderColor: '#e2e8f0'
              }}
            />
            <Bar
              dataKey="revenue"
              fill="#0c4a6e"
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-full items-center justify-center text-gray-500">
          No client data available
        </div>
      )}
    </div>
  );
};
