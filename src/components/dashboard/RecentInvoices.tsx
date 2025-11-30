import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  MoreHorizontal,
  Eye,
  Download,
  Send,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  Shield,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatCurrency, formatDate } from '../../utils/helpers';

interface Invoice {
  id: string;
  customer: string;
  customerAvatar?: string;
  amount: number;
  status: 'paid' | 'sent' | 'overdue' | 'draft' | 'cancelled';
  firsStatus: 'approved' | 'validated' | 'signed' | 'pending' | 'rejected' | 'cancelled' | 'not_required' | null;
  date: string;
  dueDate?: string;
}

interface RecentInvoicesProps {
  invoices: Invoice[];
  className?: string;
}

export const RecentInvoices: React.FC<RecentInvoicesProps> = ({
  invoices,
  className = '',
}) => {
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      paid: {
        label: 'Paid',
        className: 'bg-green-100 text-green-800 border-green-200',
        icon: CheckCircle,
      },
      sent: {
        label: 'Sent',
        className: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: Send,
      },
      overdue: {
        label: 'Overdue',
        className: 'bg-red-100 text-red-800 border-red-200',
        icon: AlertTriangle,
      },
      draft: {
        label: 'Draft',
        className: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: Clock,
      },
      cancelled: {
        label: 'Cancelled',
        className: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: XCircle,
      },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    const IconComponent = config.icon;

    return (
      <Badge variant="outline" className={config.className}>
        <IconComponent className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getFirsStatusBadge = (status: string | null) => {
    // Handle null/empty status - show "Not Submitted" like InvoicesPage
    if (!status) {
      return (
        <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200 text-xs">
          <Clock className="w-3 h-3 mr-1" />
          Not Submitted
        </Badge>
      );
    }

    const statusConfig = {
      approved: {
        label: 'FIRS Approved',
        className: 'bg-green-100 text-green-800 border-green-200',
        icon: CheckCircle,
      },
      validated: {
        label: 'FIRS Validated',
        className: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: Shield,
      },
      signed: {
        label: 'FIRS Signed',
        className: 'bg-purple-100 text-purple-800 border-purple-200',
        icon: Send,
      },
      cancelled: {
        label: 'FIRS Cancelled',
        className: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: XCircle,
      },
      pending: {
        label: 'FIRS Pending',
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: Clock,
      },
      rejected: {
        label: 'FIRS Rejected',
        className: 'bg-red-100 text-red-800 border-red-200',
        icon: XCircle,
      },
      not_required: {
        label: 'FIRS N/A',
        className: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: CheckCircle,
      },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] ||
      statusConfig.not_required;
    const IconComponent = config.icon;

    return (
      <Badge variant="outline" className={`${config.className} text-xs`}>
        <IconComponent className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getCustomerInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Recent Invoices</CardTitle>
            <CardDescription>
              Your latest invoice activity and FIRS compliance status
            </CardDescription>
          </div>
          <Button variant="outline" size="sm">
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {invoices.map((invoice) => (
            <div
              key={invoice.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={invoice.customerAvatar}
                    alt={invoice.customer}
                  />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {getCustomerInitials(invoice.customer)}
                  </AvatarFallback>
                </Avatar>

                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <p className="font-medium text-sm">{invoice.id}</p>
                    {getStatusBadge(invoice.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {invoice.customer}
                  </p>
                  <div className="mt-1">
                    {getFirsStatusBadge(invoice.firsStatus)}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="font-semibold">
                    {formatCurrency(invoice.amount)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(invoice.date)}
                  </p>
                  {invoice.dueDate && (
                    <p className="text-xs text-muted-foreground">
                      Due: {formatDate(invoice.dueDate)}
                    </p>
                  )}
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Download className="mr-2 h-4 w-4" />
                      Download PDF
                    </DropdownMenuItem>
                    {invoice.status === 'draft' && (
                      <DropdownMenuItem>
                        <Send className="mr-2 h-4 w-4" />
                        Send Invoice
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>

        {invoices.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No recent invoices found</p>
            <Button variant="outline" size="sm" className="mt-2">
              Create Your First Invoice
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
