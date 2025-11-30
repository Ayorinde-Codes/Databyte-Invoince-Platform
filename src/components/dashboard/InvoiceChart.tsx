import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { formatCurrency } from '../../utils/helpers';

interface ChartData {
  name: string;
  value: number;
  amount?: number;
  color?: string;
}

interface InvoiceChartProps {
  type: 'bar' | 'pie' | 'line';
  title: string;
  description?: string;
  data: ChartData[];
  className?: string;
}

const COLORS = [
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#06B6D4',
];

export const InvoiceChart: React.FC<InvoiceChartProps> = ({
  type,
  title,
  description,
  data,
  className = '',
}) => {
  const renderBarChart = () => (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => formatCurrency(value, 'NGN', false)}
        />
        <Tooltip
          formatter={(value: number) => [formatCurrency(value), 'Amount']}
          labelStyle={{ color: '#374151' }}
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
          }}
        />
        <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );

  const getDisplayAmount = (item: ChartData) =>
    typeof item.amount === 'number' ? item.amount : item.value;

  const renderPieChart = () => {
    // Filter out zero values for the pie chart (they won't render anyway)
    // But keep all data for the legend below
    const chartData = data.filter(item => item.value > 0);
    
    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          {chartData.length > 0 ? (
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) =>
                `${name} ${(percent * 100).toFixed(0)}%`
              }
              outerRadius={80}
              innerRadius={0}
              fill="#8884d8"
              dataKey="value"
              startAngle={90}
              endAngle={-270}
              animationBegin={0}
              animationDuration={800}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color || COLORS[index % COLORS.length]} 
                />
              ))}
            </Pie>
          ) : (
            // Show empty circle when all values are 0
            <Pie
              data={[{ name: 'No Data', value: 1 }]}
              cx="50%"
              cy="50%"
              outerRadius={80}
              innerRadius={0}
              fill="#e5e7eb"
              dataKey="value"
            >
              <Cell fill="#e5e7eb" />
            </Pie>
          )}
          <Tooltip
            formatter={(_value: number, _name, props) => {
              const payload = props?.payload as ChartData | undefined;
              const amount = payload ? getDisplayAmount(payload) : _value;
              return [formatCurrency(amount), 'Amount'];
            }}
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  const renderLineChart = () => (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => formatCurrency(value, 'NGN', false)}
        />
        <Tooltip
          formatter={(value: number) => [formatCurrency(value), 'Amount']}
          labelStyle={{ color: '#374151' }}
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
          }}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke="#3B82F6"
          strokeWidth={2}
          dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return renderBarChart();
      case 'pie':
        return renderPieChart();
      case 'line':
        return renderLineChart();
      default:
        return renderBarChart();
    }
  };

  // Handle empty data first
  if (!data || data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              {description && (
                <CardDescription className="mt-1">{description}</CardDescription>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            No data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const getTotalValue = () => {
    if (!data || data.length === 0) return 0;
    return data.reduce((sum, item) => sum + getDisplayAmount(item), 0);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            {description && (
              <CardDescription className="mt-1">{description}</CardDescription>
            )}
          </div>
          {type === 'pie' && (
            <Badge variant="secondary">
              Total: {formatCurrency(getTotalValue())}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {renderChart()}

        {type === 'pie' && (
          <div className="mt-4 grid grid-cols-3 gap-x-4 gap-y-3">
            {data.map((item, index) => (
              <div key={item.name} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color || COLORS[index % COLORS.length] }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-muted-foreground truncate">
                    {item.name}
                  </div>
                  <div className="text-xs font-medium text-foreground">
                    {formatCurrency(getDisplayAmount(item))}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {item.value} {item.value === 1 ? 'invoice' : 'invoices'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
