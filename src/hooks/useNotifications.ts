import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { Notification, NotificationApiResponse, NotificationType } from '../types/notification';
import { formatDistanceToNow } from 'date-fns';

export const useNotifications = (params?: {
  read?: boolean;
  type?: string;
  per_page?: number;
  page?: number;
}) => {
  const queryClient = useQueryClient();

  // Fetch notifications
  const {
    data: notificationsData,
    isLoading,
    error,
    refetch,
  } = useQuery<NotificationApiResponse>({
    queryKey: ['notifications', params],
    queryFn: () => apiService.getNotifications(params),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch unread count
  const { data: unreadCountData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => apiService.getUnreadNotificationCount(),
    refetchInterval: 30000,
  });

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: (id: number) => apiService.markNotificationAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Mark all as read
  const markAllAsReadMutation = useMutation({
    mutationFn: () => apiService.markAllNotificationsAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Delete notification
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiService.deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const notifications = notificationsData?.data?.notifications || [];
  const unreadCount = unreadCountData?.data?.unread_count || 0;
  const pagination = notificationsData?.data?.pagination;

  const markAsRead = (id: number) => {
    markAsReadMutation.mutate(id);
  };

  const markAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const deleteNotification = (id: number) => {
    deleteMutation.mutate(id);
  };

  const formatTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Just now';
    }
  };

  const getNotificationIcon = (notification: Notification) => {
    if (notification.icon) return notification.icon;
    
    // Default icons based on type
    switch (notification.type) {
      case NotificationType.INVOICE_SUBMITTED:
      case NotificationType.IRN_GENERATED:
        return 'info';
      case NotificationType.FIRS_APPROVAL:
      case NotificationType.INVOICE_PAID:
        return 'success';
      case NotificationType.INVOICE_REJECTED:
      case NotificationType.FIRS_VALIDATION_FAILED:
      case NotificationType.INVOICE_SIGNING_FAILED:
      case NotificationType.ERP_SYNC_FAILED:
        return 'error';
      case NotificationType.ERP_SYNC:
        return 'info';
      default:
        return 'info';
    }
  };

  const getNotificationColor = (notification: Notification) => {
    if (notification.color) return notification.color;
    
    // Default colors based on type
    switch (notification.type) {
      case NotificationType.INVOICE_SUBMITTED:
      case NotificationType.IRN_GENERATED:
        return 'blue';
      case NotificationType.FIRS_APPROVAL:
      case NotificationType.INVOICE_PAID:
        return 'green';
      case NotificationType.INVOICE_REJECTED:
      case NotificationType.FIRS_VALIDATION_FAILED:
      case NotificationType.INVOICE_SIGNING_FAILED:
      case NotificationType.ERP_SYNC_FAILED:
        return 'red';
      case NotificationType.ERP_SYNC:
        return 'yellow';
      default:
        return 'blue';
    }
  };

  return {
    notifications,
    unreadCount,
    pagination,
    isLoading,
    error,
    refetch,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    formatTimeAgo,
    getNotificationIcon,
    getNotificationColor,
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
