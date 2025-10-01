import { X, Calendar, Clock, Tag, Trash2, ExternalLink, AlertCircle, CheckCircle, Info } from "lucide-react";
import NotificationIcon from "./NotificationIcon";

export const NotificationModal = ({ notification, isOpen, onClose, onAction }) => {
  if (!isOpen || !notification) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
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
      case 'urgent': return 'text-red-700 bg-red-50 border-red-200';
      case 'high': return 'text-orange-700 bg-orange-50 border-orange-200';
      case 'normal': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'low': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'urgent': return <AlertCircle size={14} className="text-red-600" />;
      case 'high': return <AlertCircle size={14} className="text-orange-600" />;
      case 'normal': return <Info size={14} className="text-blue-600" />;
      case 'low': return <CheckCircle size={14} className="text-gray-600" />;
      default: return <Info size={14} className="text-gray-600" />;
    }
  };

  const getStatusBadge = () => {
    if (notification.isArchived) {
      return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">Archived</span>;
    }
    if (!notification.isRead) {
      return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Unread</span>;
    }
    return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">Read</span>;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <NotificationIcon
              size={30}
              type={notification.type} 
              priority={notification.priority} 
              image={notification.image} 
              className="w-12 h-12 rounded-full object-cover" 
            />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{notification.title}</h2>
              <div className="flex items-center gap-2 mt-1">
                {getPriorityIcon(notification.priority)}
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(notification.priority)}`}>
                  {notification.priority || 'normal'}
                </span>
                {getStatusBadge()}
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

                {notification.sentAt && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Clock size={16} />
                      Sent
                    </label>
                    <p className="text-gray-900 mt-1">{formatDate(notification.sentAt)}</p>
                  </div>
                )}

                {notification.deliveredAt && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <CheckCircle size={16} />
                      Delivered
                    </label>
                    <p className="text-gray-900 mt-1">{formatDate(notification.deliveredAt)}</p>
                  </div>
                )}

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

                {notification.deliveryMethod && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Delivery Method</label>
                    <p className="text-gray-900 mt-1 capitalize">{notification.deliveryMethod.replace('_', ' ')}</p>
                  </div>
                )}

                {notification.scheduledFor && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Scheduled For</label>
                    <p className="text-gray-900 mt-1">{formatDate(notification.scheduledFor)}</p>
                  </div>
                )}

                {notification.expiresAt && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Expires</label>
                    <p className="text-gray-900 mt-1">{formatDate(notification.expiresAt)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Related Entity - Updated field name */}
            {notification.entityId && (
              <div>
                <label className="text-sm font-medium text-gray-700">Related Entity</label>
                <p className="text-gray-900 mt-1">
                  Entity ID: {notification.entityId}
                </p>
              </div>
            )}

            {/* Batch Information */}
            {notification.batchId && (
              <div>
                <label className="text-sm font-medium text-gray-700">Batch ID</label>
                <p className="text-gray-900 mt-1 font-mono text-sm">{notification.batchId}</p>
              </div>
            )}

            {/* Retry Information */}
            {notification.retryCount > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-700">Delivery Attempts</label>
                <p className="text-gray-900 mt-1">{notification.retryCount} retries</p>
              </div>
            )}

            {/* Status Information */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="text-sm font-medium text-gray-700">Read Status</label>
                <p className="text-gray-900 mt-1">{notification.isRead ? 'Read' : 'Unread'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Archive Status</label>
                <p className="text-gray-900 mt-1">{notification.isArchived ? 'Archived' : 'Active'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center gap-3">
            {/* {!notification.isArchived && (
              <button
                onClick={() => onAction('archive', notification.id)}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <Tag size={16} />
                Archive
              </button>
            )}
            <button
              onClick={() => onAction('delete', notification.id)}
              className="flex items-center gap-2 px-3 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 size={16} />
              Delete
            </button> */}
          </div>

          <div className="flex items-center gap-3">
            {!notification.isRead && (
              <button
                onClick={() => onAction('read', notification.id)}
                className="px-4 py-2 text-blue-600 hover:text-blue-800 font-medium"
              >
                Mark as Read
              </button>
            )}
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