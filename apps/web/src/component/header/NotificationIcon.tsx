import React, { useEffect, useState } from 'react';
import {
  Bell, X, MessageSquare, Heart, UserPlus, Star, Settings, AlertCircle,
  Calendar, Clock, Tag, ExternalLink, Archive, Trash2
} from 'lucide-react';
import { getMyNotification, markNotificationRead, markSingleNotificationRead } from '@shared-core/fetchApi/api.fetch';
import { useToken } from "@/context/useTokenContext";
import NotificationIcon, { NotificationType } from './NotificationIcons';
import { NotificationModal } from './NotificationModal';
import { useUserStore } from '@shared-core/store/useUserStore';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';




// Modal Component


const NotificationsPanel = ({ variant = 'header' }: { variant?: 'header' | 'sidebar' }) => {
  const isSidebar = variant === 'sidebar';
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Array<any>>([]);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const User = useUserStore((state) => state.user);
  useEffect(() => {
    if (User && User.primaryProjectUid) {
      fetchAllNotification()
    }
  }, [User])
  const { accessToken } = useToken()

  const fetchAllNotification = async () => {
    const response = await getMyNotification(accessToken || '', 1, 10)
    if (response && response.statusCode == 200) {
      setNotifications(response.data.notifications)
    }
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAllAsRead = async () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    await markNotificationRead(accessToken || '')
  };

  const markAsRead = async (id) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
    await markSingleNotificationRead(accessToken, id)
  };

  const removeNotification = (id) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };



  const openNotificationModal = (notification) => {
    setSelectedNotification(notification);
    setIsModalOpen(true);
    setIsOpen(false);
    // markAsRead(notification.id);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedNotification(null);
  };

  const handleModalAction = (action, notificationId, actionUrl = null) => {
    switch (action) {
      case 'archive':
        setNotifications(notifications.map(n =>
          n.id === notificationId ? { ...n, isArchived: true } : n
        ));
        closeModal();
        break;
      case 'delete':
        removeNotification(notificationId);
        closeModal();
        break;
      case 'read':
        markAsRead(notificationId)
        closeModal();
        break;
      case 'navigate':
        // Handle navigation - you can implement your routing logic here
        closeModal();
        break;
      default:
        break;
    }
  };

  const getTimeAgo = (dateString) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffInMinutes = Math.floor((now - past) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hour${Math.floor(diffInMinutes / 60) !== 1 ? 's' : ''} ago`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)} day${Math.floor(diffInMinutes / 1440) !== 1 ? 's' : ''} ago`;
    return past.toLocaleDateString();
  };

  const getPriorityIndicator = (priority) => {
    switch (priority) {
      case 'high': return 'bg-green-700';
      case 'normal': return 'bg-blue-500';
      case 'low': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  return (
    <>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button
            title="Notifications"
            className={isSidebar
              ? "relative p-1 rounded-md text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
              : "relative p-3 rounded-xl text-foreground/70 hover:bg-accent transition-colors"}
          >
            <Bell size={isSidebar ? 14 : 24} />
            {unreadCount > 0 && (
              <span className={cn(
                "absolute flex items-center justify-center rounded-full bg-green-700 font-semibold text-white",
                isSidebar
                  ? "-top-0.5 -right-0.5 text-[8px] min-w-[14px] h-3.5 px-0.5"
                  : "-top-1 -right-1 text-xs min-w-[20px] h-5 px-1 shadow-lg"
              )}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
        </PopoverTrigger>

        <PopoverContent
          align={isSidebar ? "start" : "end"}
          side={isSidebar ? "top" : "bottom"}
          sideOffset={8}
          className="w-80 p-0 gap-0 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border">
            <h3 className="text-sm font-medium text-foreground">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-1.5 text-xs font-normal text-muted-foreground">{unreadCount} unread</span>
              )}
            </h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="h-6 px-1.5 text-xs text-muted-foreground"
              >
                Mark all read
              </Button>
            )}
          </div>

          {/* List */}
          {notifications.length > 0 ? (
            <div className="max-h-80 overflow-y-auto">
              {notifications.map(notification => (
                <button
                  key={notification.id}
                  onClick={() => openNotificationModal(notification)}
                  className={cn(
                    "group flex w-full items-start gap-2.5 px-3 py-2 text-left border-b border-border/60 transition-colors hover:bg-accent",
                    !notification.isRead && "bg-primary/10"
                  )}
                >
                  <NotificationIcon type={notification.type} priority={notification.priority} image={notification.image} size={16} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-1.5">
                        {notification.icon}
                        <h4 className={cn(
                          "truncate text-[13px] leading-tight",
                          notification.isRead ? "font-normal text-muted-foreground" : "font-medium text-foreground"
                        )}>{notification.title}</h4>
                      </div>
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNotification(notification.id);
                        }}
                        className="shrink-0 p-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
                      >
                        <X size={13} />
                      </span>
                    </div>

                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{notification.message}</p>

                    <p className="mt-1 text-[11px] text-muted-foreground">{getTimeAgo(notification.createdAt)}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="px-3 py-8 text-center">
              <Bell size={28} className="mx-auto mb-2 text-muted-foreground/40" />
              <p className="text-sm font-medium text-foreground">No notifications</p>
              <p className="text-xs text-muted-foreground">You're all caught up!</p>
            </div>
          )}
        </PopoverContent>
      </Popover>

      {/* Modal */}
      <NotificationModal
        notification={selectedNotification}
        isOpen={isModalOpen}
        onClose={closeModal}
        onAction={handleModalAction}
      />
    </>
  );
};

export default NotificationsPanel;