import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Loader2,
  Filter,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useNotifications } from '@/hooks/useNotifications';
import { Notification, NotificationType } from '@/types/notification';
import { cn } from '@/lib/utils';

export const NotificationsPage = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const perPage = 20;

  const {
    notifications,
    unreadCount,
    pagination,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    formatTimeAgo,
    getNotificationColor,
    isMarkingAsRead,
    isMarkingAllAsRead,
  } = useNotifications({
    read: filter === 'all' ? undefined : filter === 'read',
    type: typeFilter === 'all' ? undefined : typeFilter,
    per_page: perPage,
    page,
  });

  const getColorClass = (color: string | null) => {
    if (!color) return 'bg-blue-500';
    
    const colorMap: Record<string, string> = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      red: 'bg-red-500',
      yellow: 'bg-yellow-500',
      orange: 'bg-orange-500',
      purple: 'bg-purple-500',
    };
    
    return colorMap[color] || 'bg-blue-500';
  };

  const getTypeLabel = (type: NotificationType) => {
    const labels: Record<NotificationType, string> = {
      [NotificationType.INVOICE_SUBMITTED]: 'Invoice Submitted',
      [NotificationType.FIRS_APPROVAL]: 'FIRS Approval',
      [NotificationType.IRN_GENERATED]: 'IRN Generated',
      [NotificationType.INVOICE_PAID]: 'Invoice Paid',
      [NotificationType.INVOICE_REJECTED]: 'Invoice Rejected',
      [NotificationType.FIRS_VALIDATION_FAILED]: 'FIRS Validation Failed',
      [NotificationType.INVOICE_SIGNING_FAILED]: 'Invoice Signing Failed',
      [NotificationType.ERP_SYNC]: 'ERP Sync',
      [NotificationType.ERP_SYNC_FAILED]: 'ERP Sync Failed',
    };
    return labels[type] || type;
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
            <p className="text-muted-foreground">
              Manage and view all your notifications
            </p>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              onClick={() => markAllAsRead()}
              disabled={isMarkingAllAsRead}
            >
              {isMarkingAllAsRead ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCheck className="w-4 h-4 mr-2" />
              )}
              Mark all as read
            </Button>
          )}
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
            </CardTitle>
            <CardDescription>
              Filter notifications by status and type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Tabs value={filter} onValueChange={(v) => {
                  setFilter(v as 'all' | 'unread' | 'read');
                  setPage(1);
                }}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="unread">
                      Unread {unreadCount > 0 && `(${unreadCount})`}
                    </TabsTrigger>
                    <TabsTrigger value="read">Read</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium mb-2 block">Type</label>
                <Select
                  value={typeFilter}
                  onValueChange={(v) => {
                    setTypeFilter(v);
                    setPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value={NotificationType.INVOICE_SUBMITTED}>
                      Invoice Submitted
                    </SelectItem>
                    <SelectItem value={NotificationType.FIRS_APPROVAL}>
                      FIRS Approval
                    </SelectItem>
                    <SelectItem value={NotificationType.IRN_GENERATED}>
                      IRN Generated
                    </SelectItem>
                    <SelectItem value={NotificationType.INVOICE_PAID}>
                      Invoice Paid
                    </SelectItem>
                    <SelectItem value={NotificationType.INVOICE_REJECTED}>
                      Invoice Rejected
                    </SelectItem>
                    <SelectItem value={NotificationType.FIRS_VALIDATION_FAILED}>
                      FIRS Validation Failed
                    </SelectItem>
                    <SelectItem value={NotificationType.INVOICE_SIGNING_FAILED}>
                      Invoice Signing Failed
                    </SelectItem>
                    <SelectItem value={NotificationType.ERP_SYNC}>
                      ERP Sync
                    </SelectItem>
                    <SelectItem value={NotificationType.ERP_SYNC_FAILED}>
                      ERP Sync Failed
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications List */}
        <Card>
          <CardHeader>
            <CardTitle>All Notifications</CardTitle>
            <CardDescription>
              {pagination?.total || 0} total notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Bell className="w-16 h-16 text-gray-300 mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">
                  No notifications found
                </p>
                <p className="text-sm text-gray-500">
                  {filter !== 'all' || typeFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'You\'re all caught up!'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      'flex items-start space-x-4 p-4 rounded-lg border transition-colors',
                      notification.read
                        ? 'bg-white hover:bg-gray-50'
                        : 'bg-blue-50 hover:bg-blue-100 border-blue-200'
                    )}
                  >
                    <div
                      className={cn(
                        'w-3 h-3 rounded-full mt-2 flex-shrink-0',
                        notification.read
                          ? 'opacity-0'
                          : getColorClass(getNotificationColor(notification))
                      )}
                    />
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p
                              className={cn(
                                'text-sm font-semibold',
                                notification.read
                                  ? 'text-gray-700'
                                  : 'text-gray-900'
                              )}
                            >
                              {notification.title}
                            </p>
                            <Badge variant="outline" className="text-xs">
                              {getTypeLabel(notification.type)}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400">
                            {formatTimeAgo(notification.created_at)}
                          </p>
                        </div>
                        <TooltipProvider>
                          <div className="flex items-center space-x-1 ml-4">
                            {!notification.read && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      markAsRead(notification.id);
                                    }}
                                    disabled={isMarkingAsRead}
                                  >
                                    {isMarkingAsRead ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Check className="w-4 h-4" />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Mark as read</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteNotification(notification.id);
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Delete notification</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </TooltipProvider>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination && pagination.last_page > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t">
                <div className="text-sm text-gray-600">
                  Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to{' '}
                  {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of{' '}
                  {pagination.total} notifications
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, pagination.last_page) }, (_, i) => {
                      let pageNum;
                      if (pagination.last_page <= 5) {
                        pageNum = i + 1;
                      } else if (page <= 3) {
                        pageNum = i + 1;
                      } else if (page >= pagination.last_page - 2) {
                        pageNum = pagination.last_page - 4 + i;
                      } else {
                        pageNum = page - 2 + i;
                      }
                      return (
                        <Button
                          key={pageNum}
                          variant={page === pageNum ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === pagination.last_page}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};
