import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import {
  formatCurrency,
  formatNumber,
  formatPercentage,
} from '../../utils/helpers';
import { CURRENCIES } from '../../utils/constants';

interface MetricsCardProps {
  title: string;
  value: number | string;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  format?: 'currency' | 'number' | 'percentage' | 'text';
  icon?: React.ComponentType<{ className?: string }>;
  description?: string;
  trend?: number[];
  className?: string;
}

export const MetricsCard: React.FC<MetricsCardProps> = ({
  title,
  value,
  change,
  changeType = 'neutral',
  format = 'number',
  icon: Icon,
  description,
  className = '',
}) => {
  const formatValue = (val: number | string) => {
    if (typeof val === 'string') return val;

    switch (format) {
      case 'currency': {
        // Abbreviate large currency values for better display
        const absVal = Math.abs(val as number);
        const currencyInfo = CURRENCIES.NGN || { symbol: '₦', decimal_places: 2 };
        const symbol = currencyInfo.symbol;

        if (absVal >= 1000000000) {
          const abbreviated = ((val as number) / 1000000000).toFixed(1);
          return `${symbol}${abbreviated}B`;
        }
        if (absVal >= 1000000) {
          const abbreviated = ((val as number) / 1000000).toFixed(1);
          return `${symbol}${abbreviated}M`;
        }
        if (absVal >= 1000) {
          const abbreviated = ((val as number) / 1000).toFixed(1);
          return `${symbol}${abbreviated}K`;
        }
        return formatCurrency(val as number);
      }
      case 'percentage': {
        return formatPercentage((val as number) / 100);
      }
      case 'number': {
        return formatNumber(val as number);
      }
      default: {
        return val.toString();
      }
    }
  };

  const getChangeIcon = () => {
    switch (changeType) {
      case 'increase': {
        return <TrendingUp className="h-3 w-3 text-green-500" />;
      }
      case 'decrease': {
        return <TrendingDown className="h-3 w-3 text-red-500" />;
      }
      default: {
        return <Minus className="h-3 w-3 text-gray-500" />;
      }
    }
  };

  const getChangeColor = () => {
    switch (changeType) {
      case 'increase': {
        return 'text-green-600';
      }
      case 'decrease': {
        return 'text-red-600';
      }
      default: {
        return 'text-gray-600';
      }
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold mb-1 break-words overflow-hidden text-ellipsis line-clamp-2" title={typeof value === 'number' && format === 'currency' ? formatCurrency(value) : String(value)}>
          {formatValue(value)}
        </div>

        {change !== undefined && (
          <div className={`flex items-center text-xs ${getChangeColor()}`}>
            {getChangeIcon()}
            <span className="ml-1">
              {change > 0 ? '+' : ''}
              {formatPercentage(change / 100)} from last month
            </span>
          </div>
        )}

        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
};
