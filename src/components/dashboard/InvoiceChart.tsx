import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
  amountByCurrency?: Record<string, number>;
  color?: string;
}

interface InvoiceChartProps {
  type: 'bar' | 'pie' | 'line';
  title: string;
  description?: string;
  data: ChartData[];
  className?: string;
  valueFormat?: 'currency' | 'number' | 'percent';
  totalsByCurrency?: Record<string, number>;
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
  valueFormat = 'currency',
  totalsByCurrency,
}) => {
  const isCount = valueFormat === 'number';
  const isPercent = valueFormat === 'percent';
  const primaryCurrency = totalsByCurrency && Object.keys(totalsByCurrency).length === 1 ? Object.keys(totalsByCurrency)[0] : 'NGN';
  const formatValue = (value: number) =>
    isPercent ? `${Number(value).toFixed(1)}%` : isCount ? String(value) : formatCurrency(value, primaryCurrency, false);
  const valueLabel = isPercent ? 'Rate' : isCount ? 'Count' : 'Amount';

  const renderBarChart = () => (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => formatValue(value)}
        />
        <Tooltip
          formatter={(value: number) => [formatValue(value), valueLabel]}
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
    const chartData = data.filter(item => item.value > 0);
    
    return (
      <ResponsiveContainer width="100%" height="100%">
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
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => formatValue(value)}
        />
        <Tooltip
          formatter={(value: number) => [formatValue(value), valueLabel]}
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

  const currencyKeys = totalsByCurrency ? Object.keys(totalsByCurrency) : [];
  const hasMultiCurrency = currencyKeys.length > 1;
  const singleCurrencyTotal = currencyKeys.length === 1 ? totalsByCurrency![currencyKeys[0]] : null;

  return (
    <Card className={`h-full flex flex-col min-h-0 ${className}`}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-lg">{title}</CardTitle>
            {description && (
              <CardDescription className="mt-1">{description}</CardDescription>
            )}
          </div>
          {type === 'pie' && (
            <div className="flex-shrink-0 rounded-md border bg-secondary/50 px-3 py-2 text-secondary-foreground min-w-0 max-w-full">
              {hasMultiCurrency ? (
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium">Totals by currency</span>
                  <div className="flex flex-col gap-0.5">
                    {currencyKeys.map((ccy) => (
                      <span key={ccy} className="text-xs tabular-nums break-words">
                        {ccy}: {formatCurrency(totalsByCurrency[ccy], ccy)}
                      </span>
                    ))}
                  </div>
                </div>
              ) : singleCurrencyTotal != null ? (
                <span className="text-xs">
                  Total: {formatCurrency(singleCurrencyTotal, currencyKeys[0])}
                </span>
              ) : (
                <span className="text-xs">
                  Total: {formatCurrency(getTotalValue(), 'NGN')}
                </span>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 min-h-[280px]">
          {renderChart()}
        </div>

        {type === 'pie' && (
          <div className="mt-4 grid grid-cols-3 gap-x-4 gap-y-3">
            {data.map((item, index) => {
              const byCurrency = item.amountByCurrency && typeof item.amountByCurrency === 'object';
              const currencyKeys = byCurrency ? Object.keys(item.amountByCurrency).filter((k) => (item.amountByCurrency![k] ?? 0) !== 0) : [];
              const hasMultiCurrency = currencyKeys.length > 1;
              return (
                <div key={item.name} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.color || COLORS[index % COLORS.length] }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-muted-foreground truncate">
                      {item.name}
                    </div>
                    {hasMultiCurrency ? (
                      <div className="text-xs font-medium text-foreground space-y-0.5">
                        {currencyKeys.map((ccy) => (
                          <div key={ccy}>
                            {ccy}: {formatCurrency(item.amountByCurrency![ccy], ccy)}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs font-medium text-foreground">
                        {formatCurrency(
                          currencyKeys.length === 1 ? item.amountByCurrency![currencyKeys[0]] : getDisplayAmount(item),
                          currencyKeys.length === 1 ? currencyKeys[0] : 'NGN'
                        )}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      {item.value} {item.value === 1 ? 'invoice' : 'invoices'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
