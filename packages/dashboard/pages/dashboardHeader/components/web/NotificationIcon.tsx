import React, { useState } from 'react';
import {
  Bell, X, MessageSquare, Heart, UserPlus, Star, Settings, AlertCircle,
  Calendar, Clock, Tag, ExternalLink, Archive, Trash2
} from 'lucide-react';

// Updated notification data to match API response structure
const notificationData = [
  {
    id: 1,
    uid: "raw7lw6rxuvwrpzrko12",
    userId: 1,
    type: "project_update",
    title: "Project Updated",
    message: "The Reforestation Project has been updated with new information",
    relatedEntityType: "project",
    relatedEntityId: "proj_123",
    priority: "high",
    category: "updates",
    isRead: false,
    isArchived: false,
    actionUrl: "/projects/reforestation",
    actionText: "View Project",
    scheduledFor: null,
    expiresAt: null,
    deliveryMethod: "in_app",
    sentAt: "2025-06-10T03:30:12.644Z",
    deliveredAt: "2025-06-10T03:30:12.644Z",
    createdAt: "2025-06-10T03:30:12.644Z",
    updatedAt: "2025-06-10T03:30:12.644Z",
    avatar: 'https://avatar.iran.liara.run/public/girl',
    icon: <MessageSquare size={18} className="text-blue-500" />,
  },
  {
    id: 2,
    uid: "abc123def456",
    userId: 1,
    type: "social_interaction",
    title: "Project Shared",
    message: "Michael Chen shared your year in review: 2024 achievements on social media",
    relatedEntityType: "post",
    relatedEntityId: "post_456",
    priority: "normal",
    category: "social",
    isRead: false,
    isArchived: false,
    actionUrl: "/posts/year-review-2024",
    actionText: "View Post",
    scheduledFor: null,
    expiresAt: null,
    deliveryMethod: "in_app",
    sentAt: "2025-06-10T02:30:12.644Z",
    deliveredAt: "2025-06-10T02:30:12.644Z",
    createdAt: "2025-06-10T02:30:12.644Z",
    updatedAt: "2025-06-10T02:30:12.644Z",
    avatar: 'https://avatar.iran.liara.run/public/boy',
    icon: <Heart size={18} className="text-red-500" />,
  },
  {
    id: 3,
    uid: "xyz789uvw012",
    userId: 1,
    type: "collaboration_request",
    title: "Project Invitation",
    message: "Emma Wilson wants to add you to the Amazon Conservation project",
    relatedEntityType: "project",
    relatedEntityId: "proj_789",
    priority: "normal",
    category: "invitations",
    isRead: true,
    isArchived: false,
    actionUrl: "/projects/amazon-conservation/invite",
    actionText: "Accept Invitation",
    scheduledFor: null,
    expiresAt: "2025-06-17T03:30:12.644Z",
    deliveryMethod: "in_app",
    sentAt: "2025-06-09T03:30:12.644Z",
    deliveredAt: "2025-06-09T03:30:12.644Z",
    createdAt: "2025-06-09T03:30:12.644Z",
    updatedAt: "2025-06-09T03:30:12.644Z",
    avatar: 'https://avatar.iran.liara.run/public/girl?id=2',
    icon: <UserPlus size={18} className="text-green-500" />,
  },
  {
    id: 4,
    uid: "def456ghi789",
    userId: 1,
    type: "review_request",
    title: "Review Requested",
    message: "David Lopez asked you to review Las Américas 7a site for the Yucatan project",
    relatedEntityType: "site",
    relatedEntityId: "site_101",
    priority: "high",
    category: "reviews",
    isRead: true,
    isArchived: false,
    actionUrl: "/sites/las-americas-7a/review",
    actionText: "Start Review",
    scheduledFor: null,
    expiresAt: "2025-06-12T03:30:12.644Z",
    deliveryMethod: "in_app",
    sentAt: "2025-06-09T03:30:12.644Z",
    deliveredAt: "2025-06-09T03:30:12.644Z",
    createdAt: "2025-06-09T03:30:12.644Z",
    updatedAt: "2025-06-09T03:30:12.644Z",
    avatar: 'https://avatar.iran.liara.run/public/boy?id=3',
    icon: <AlertCircle size={18} className="text-purple-500" />,
  },
  {
    id: 5,
    uid: "ghi789jkl012",
    userId: 1,
    type: "system_alert",
    title: "Security Alert",
    message: "Unusual login activity detected from a new device. Please verify your account security.",
    relatedEntityType: "security",
    relatedEntityId: "sec_001",
    priority: "high",
    category: "security",
    isRead: true,
    isArchived: false,
    actionUrl: "/account/security",
    actionText: "Review Security",
    scheduledFor: null,
    expiresAt: null,
    deliveryMethod: "in_app",
    sentAt: "2025-06-08T03:30:12.644Z",
    deliveredAt: "2025-06-08T03:30:12.644Z",
    createdAt: "2025-06-08T03:30:12.644Z",
    updatedAt: "2025-06-08T03:30:12.644Z",
    avatar: 'https://avatar.iran.liara.run/public/boy?id=5',
    icon: <Settings size={18} className="text-gray-500" />,
  },
  {
    id: 6,
    uid: "jkl012mno345",
    userId: 1,
    type: "rating_received",
    title: "New Rating",
    message: "Olivia Taylor rated your responsive dashboard template 5 stars with a wonderful review!",
    relatedEntityType: "template",
    relatedEntityId: "temp_202",
    priority: "normal",
    category: "feedback",
    isRead: true,
    isArchived: false,
    actionUrl: "/templates/responsive-dashboard/reviews",
    actionText: "View Review",
    scheduledFor: null,
    expiresAt: null,
    deliveryMethod: "in_app",
    sentAt: "2025-06-03T03:30:12.644Z",
    deliveredAt: "2025-06-03T03:30:12.644Z",
    createdAt: "2025-06-03T03:30:12.644Z",
    updatedAt: "2025-06-03T03:30:12.644Z",
    avatar: 'https://avatar.iran.liara.run/public/girl?id=4',
    icon: <Star size={18} className="text-yellow-500" />,
  },
];

// Modal Component
const NotificationModal = ({ notification, isOpen, onClose, onAction }) => {
  if (!isOpen || !notification) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'normal': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'low': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <img
              src={notification.avatar}
              alt="Avatar"
              className="w-12 h-12 rounded-full object-cover"
            />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{notification.title}</h2>
              <div className="flex items-center gap-2 mt-1">
                {notification.icon}
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(notification.priority)}`}>
                  {notification.priority}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          <div className="space-y-6">
            {/* Message */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Message</h3>
              <p className="text-gray-900 leading-relaxed">{notification.message}</p>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Calendar size={16} />
                    Created
                  </label>
                  <p className="text-gray-900 mt-1">{formatDate(notification.createdAt)}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Clock size={16} />
                    Delivered
                  </label>
                  <p className="text-gray-900 mt-1">{formatDate(notification.deliveredAt)}</p>
                </div>

                {notification.category && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Tag size={16} />
                      Category
                    </label>
                    <p className="text-gray-900 mt-1 capitalize">{notification.category}</p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Type</label>
                  <p className="text-gray-900 mt-1 capitalize">{notification.type.replace('_', ' ')}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Delivery Method</label>
                  <p className="text-gray-900 mt-1 capitalize">{notification.deliveryMethod.replace('_', ' ')}</p>
                </div>

                {notification.expiresAt && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Expires</label>
                    <p className="text-gray-900 mt-1">{formatDate(notification.expiresAt)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Related Entity */}
            {notification.relatedEntityType && (
              <div>
                <label className="text-sm font-medium text-gray-700">Related to</label>
                <p className="text-gray-900 mt-1 capitalize">
                  {notification.relatedEntityType} (ID: {notification.relatedEntityId})
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onAction('archive', notification.id)}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <Archive size={16} />
              Archive
            </button>
            <button
              onClick={() => onAction('delete', notification.id)}
              className="flex items-center gap-2 px-3 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 size={16} />
              Delete
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
            >
              Close
            </button>
            {notification.actionUrl && notification.actionText && (
              <button
                onClick={() => onAction('navigate', notification.id, notification.actionUrl)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <ExternalLink size={16} />
                {notification.actionText}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const NotificationsPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(notificationData);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  const markAsRead = (id) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const removeNotification = (id) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const openNotificationModal = (notification) => {
    setSelectedNotification(notification);
    setIsModalOpen(true);
    markAsRead(notification.id);
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
      case 'navigate':
        // Handle navigation - you can implement your routing logic here
        console.log('Navigating to:', actionUrl);
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
          <div className="absolute right-0 mt-3 w-80 md:w-96 bg-white border border-gray-200 rounded-2xl shadow-2xl z-40 overflow-hidden">
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
                    className={`flex items-start gap-4 px-6 py-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-all duration-200 ${
                      !notification.isRead ? 'bg-blue-50/50 border-l-4 border-l-blue-500' : ''
                    }`}
                  >
                    {/* Avatar with priority indicator */}
                    <div className="relative">
                      <img
                        src={notification.avatar}
                        alt="Avatar"
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${getPriorityIndicator(notification.priority)}`}></div>
                    </div>

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