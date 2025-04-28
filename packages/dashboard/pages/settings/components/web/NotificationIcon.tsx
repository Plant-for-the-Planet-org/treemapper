import React, { useState } from 'react';
import {
  Bell, X, MessageSquare, Heart, UserPlus, Star, Settings, AlertCircle,
} from 'lucide-react';

// Dummy notifications
const notificationData = [
  {
    id: 1,
    type: 'message',
    username: 'Sarah Johnson',
    action: 'sent you Project invite',
    content: 'New Project onboarded-Amazon Reforestation',
    time: '2 min ago',
    read: false,
    avatar: 'https://avatar.iran.liara.run/public/girl',
    icon: <MessageSquare size={18} className="text-blue-500" />,
  },
  {
    id: 2,
    type: 'like',
    username: 'Michael Chen',
    action: 'shared project on social media',
    content: 'Your year in review: 2024 achievements',
    time: '1 hour ago',
    read: false,
    avatar: 'https://avatar.iran.liara.run/public/boy',
    icon: <Heart size={18} className="text-red-500" />,
  },
  {
    id: 3,
    type: 'follow',
    username: 'Emma Wilson',
    action: 'Wants to add you to new project',
    time: '3 hours ago',
    read: true,
    avatar: 'https://avatar.iran.liara.run/public/girl?id=2',
    icon: <UserPlus size={18} className="text-green-500" />,
  },
  {
    id: 4,
    type: 'mention',
    username: 'David Lopez',
    action: 'Asked to review Las Américas 7a site',
    content: 'Review this amazing site for Yucatan project',
    time: 'Yesterday',
    read: true,
    avatar: 'https://avatar.iran.liara.run/public/boy?id=3',
    icon: <AlertCircle size={18} className="text-purple-500" />,
  },
  {
    id: 5,
    type: 'system',
    username: 'System',
    action: 'Security alert',
    content: 'Help required',
    time: '2 days ago',
    read: true,
    avatar: 'https://avatar.iran.liara.run/public/boy?id=5',
    icon: <Settings size={18} className="text-gray-500" />,
  },
  {
    id: 6,
    type: 'rating',
    username: 'Olivia Taylor',
    action: 'rated your product 5 stars',
    content: 'Your responsive dashboard template is amazing!',
    time: '1 week ago',
    read: true,
    avatar: 'https://avatar.iran.liara.run/public/girl?id=4',
    icon: <Star size={18} className="text-yellow-500" />,
  },
];

const NotificationsPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(notificationData);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const markAsRead = (id) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const removeNotification = (id) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full text-gray-700 hover:bg-gray-100 transition"
      >
        <Bell size={24} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-green-700 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-semibold shadow">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 md:w-96 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden animate-fadeIn">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
            <h3 className="text-base font-semibold text-gray-800">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* List */}
          {notifications.length > 0 ? (
            <div className="max-h-96 overflow-y-auto">
              {notifications.map(notification => (
                <div
                  key={notification.id}
                  onClick={() => markAsRead(notification.id)}
                  className={`flex items-start gap-3 px-4 py-3 border-b hover:bg-gray-50 cursor-pointer transition ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                >
                  {/* Avatar */}
                  <img
                    src={notification.avatar}
                    alt={notification.username}
                    className="w-10 h-10 rounded-full object-cover"
                  />

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm text-gray-900">
                          {notification.icon}
                          <span className="font-medium">{notification.username}</span>{' '}
                          <span className="text-gray-700">{notification.action}</span>
                        </div>
                        {notification.content && (
                          <p className="text-sm text-gray-600 line-clamp-2">{notification.content}</p>
                        )}
                        <p className="text-xs text-gray-400">{notification.time}</p>
                      </div>

                      {/* Dismiss */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNotification(notification.id);
                        }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-gray-500">
              <p>No notifications</p>
            </div>
          )}

          {/* Footer */}
          <div className="px-4 py-3 bg-gray-50 border-t text-center">
            <button
              onClick={() => setIsOpen(false)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsPanel;
