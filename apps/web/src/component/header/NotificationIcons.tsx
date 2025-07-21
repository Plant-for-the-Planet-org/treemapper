import React from 'react';
import {
  Users,
  FileText,
  Ruler,
  CheckCircle,
  MapPin,
  UserPlus,
  Leaf,
  Image as ImageIcon,
  Trophy,
  CloudRain,
  Wrench,
  Settings,
  Mail,
  Bell,
  AlertTriangle,
  AlertCircle
} from 'lucide-react';

// Your existing enums
export enum NotificationType {
  PROJECT_INVITE = 'project_invite',
  PROJECT_UPDATE = 'project_update',
  TREE_MEASUREMENT_DUE = 'tree_measurement_due',
  INTERVENTION_COMPLETED = 'intervention_completed',
  SITE_STATUS_CHANGED = 'site_status_changed',
  NEW_MEMBER_JOINED = 'new_member_joined',
  SPECIES_ADDED = 'species_added',
  IMAGE_UPLOADED = 'image_uploaded',
  MILESTONE_REACHED = 'milestone_reached',
  WEATHER_ALERT = 'weather_alert',
  MAINTENANCE_REMINDER = 'maintenance_reminder',
  SYSTEM_UPDATE = 'system_update'
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

interface NotificationIconProps {
  type: NotificationType;
  priority?: NotificationPriority;
  image?: string | null;
  className?: string;
  size?: number;
}

const NotificationIcon: React.FC<NotificationIconProps> = ({
  type,
  priority = NotificationPriority.NORMAL,
  image,
  className = '',
  size = 24
}) => {
  // If image is present, render the image
  if (image) {
    return (
      <div className={`relative inline-flex items-center justify-center ${className}`}>
        <div 
          className="rounded-full bg-gradient-to-br from-blue-50 to-indigo-100 p-2"
          style={{ width: size + 16, height: size + 16 }}
        >
          <img
            src={image}
            alt="Notification"
            className="w-full h-full object-cover rounded-full"
            style={{ width: size, height: size }}
          />
        </div>
        {priority === NotificationPriority.URGENT && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
        )}
      </div>
    );
  }

  // Icon mapping based on notification type
  const getIconAndBackground = (notificationType: NotificationType) => {
    switch (notificationType) {
      case NotificationType.PROJECT_INVITE:
        return {
          icon: Mail,
          bgColor: 'bg-gradient-to-br from-blue-50 to-blue-100',
          iconColor: 'text-blue-600'
        };
      
      case NotificationType.PROJECT_UPDATE:
        return {
          icon: FileText,
          bgColor: 'bg-gradient-to-br from-indigo-50 to-indigo-100',
          iconColor: 'text-indigo-600'
        };
      
      case NotificationType.TREE_MEASUREMENT_DUE:
        return {
          icon: Ruler,
          bgColor: 'bg-gradient-to-br from-green-50 to-green-100',
          iconColor: 'text-green-600'
        };
      
      case NotificationType.INTERVENTION_COMPLETED:
        return {
          icon: CheckCircle,
          bgColor: 'bg-gradient-to-br from-emerald-50 to-emerald-100',
          iconColor: 'text-emerald-600'
        };
      
      case NotificationType.SITE_STATUS_CHANGED:
        return {
          icon: MapPin,
          bgColor: 'bg-gradient-to-br from-orange-50 to-orange-100',
          iconColor: 'text-orange-600'
        };
      
      case NotificationType.NEW_MEMBER_JOINED:
        return {
          icon: UserPlus,
          bgColor: 'bg-gradient-to-br from-purple-50 to-purple-100',
          iconColor: 'text-purple-600'
        };
      
      case NotificationType.SPECIES_ADDED:
        return {
          icon: Leaf,
          bgColor: 'bg-gradient-to-br from-lime-50 to-lime-100',
          iconColor: 'text-lime-600'
        };
      
      case NotificationType.IMAGE_UPLOADED:
        return {
          icon: ImageIcon,
          bgColor: 'bg-gradient-to-br from-pink-50 to-pink-100',
          iconColor: 'text-pink-600'
        };
      
      case NotificationType.MILESTONE_REACHED:
        return {
          icon: Trophy,
          bgColor: 'bg-gradient-to-br from-yellow-50 to-amber-100',
          iconColor: 'text-amber-600'
        };
      
      case NotificationType.WEATHER_ALERT:
        return {
          icon: CloudRain,
          bgColor: 'bg-gradient-to-br from-sky-50 to-sky-100',
          iconColor: 'text-sky-600'
        };
      
      case NotificationType.MAINTENANCE_REMINDER:
        return {
          icon: Wrench,
          bgColor: 'bg-gradient-to-br from-gray-50 to-gray-100',
          iconColor: 'text-gray-600'
        };
      
      case NotificationType.SYSTEM_UPDATE:
        return {
          icon: Settings,
          bgColor: 'bg-gradient-to-br from-slate-50 to-slate-100',
          iconColor: 'text-slate-600'
        };
      
      default:
        return {
          icon: Bell,
          bgColor: 'bg-gradient-to-br from-neutral-50 to-neutral-100',
          iconColor: 'text-neutral-600'
        };
    }
  };

  const { icon: IconComponent, bgColor, iconColor } = getIconAndBackground(type);

  // Priority indicator styles
  const getPriorityIndicator = () => {
    switch (priority) {
      case NotificationPriority.URGENT:
        return <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />;
      case NotificationPriority.HIGH:
        return <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full border-2 border-white" />;
      default:
        return null;
    }
  };

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <div 
        className={`${bgColor} rounded-full p-2 shadow-sm`}
        style={{ width: size + 16, height: size + 16 }}
      >
        <IconComponent 
          size={size} 
          className={iconColor}
        />
      </div>
      {getPriorityIndicator()}
    </div>
  );
};

export default NotificationIcon;