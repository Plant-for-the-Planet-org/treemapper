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




// Modal Component


const NotificationsPanel = () => {
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
      <div className="relative">
        {/* Notification Bell */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-3 rounded-xl text-gray-700 hover:bg-gray-100 transition-all duration-200 hover:scale-105"
        >
          <Bell size={24} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-green-700 text-white text-xs min-w-[20px] h-5 rounded-full flex items-center justify-center font-semibold shadow-lg animate-pulse">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* Panel */}
        {isOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/50 bg-opacity-10 z-40"
              onClick={() => setIsOpen(false)} // Add click handler to close
              style={{ width: '100vw', height: '100vh' }}
            />
            <div className="absolute right-0 mt-3 w-80 md:w-96 bg-white border border-gray-200 rounded-2xl shadow-2xl z-[40] overflow-hidden">
              {/* Header */}

              <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                  {unreadCount > 0 && (
                    <p className="text-sm text-gray-600">{unreadCount} unread</p>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium hover:bg-blue-100 px-3 py-1 rounded-lg transition-colors"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {/* List */}
              {notifications.length > 0 ? (
                <div className="max-h-96 overflow-y-auto">
                  {notifications.map(notification => (
                    <div
                      key={notification.id}
                      onClick={() => openNotificationModal(notification)}
                      className={`flex items-start gap-4 px-6 py-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-all duration-200 ${!notification.isRead ? 'bg-blue-50/50 border-l-4 border-l-blue-500' : ''
                        }`}
                    >
                      {/* Avatar with priority indicator */}
                      <NotificationIcon type={notification.type} priority={notification.priority} image={notification.image} />

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <div className="flex items-center gap-2">
                            {notification.icon}
                            <h4 className="font-semibold text-gray-900 text-sm">{notification.title}</h4>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeNotification(notification.id);
                            }}
                            className="text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                          >
                            <X size={14} />
                          </button>
                        </div>

                        <p className="text-sm text-gray-700 line-clamp-2 mb-2">{notification.message}</p>

                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">{getTimeAgo(notification.createdAt)}</span>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-gray-500">
                  <Bell size={48} className="mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">No notifications</p>
                  <p className="text-sm">You're all caught up!</p>
                </div>
              )}

              {/* Footer */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 text-center">
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-sm text-gray-600 hover:text-gray-800 font-medium"
                >
                  Close Panel
                </button>
              </div>
            </div>
          </>

        )}
      </div>

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