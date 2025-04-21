import React, { useState } from 'react';
import { Bell } from 'lucide-react';

const NotificationBell = ({ 
  count = 0,
  maxCount = 99,
  onClick = () => {},
  size = 24,
  color = "currentColor",
  badgeColor = "bg-red-500",
  ringColor = "bg-blue-500"
}) => {
  const [isRinging, setIsRinging] = useState(false);
  
  // Format count with "+" if exceeds maxCount
  const displayCount = count > maxCount ? `${maxCount}+` : count;
  
  // Ring the bell
  const handleClick = () => {
    setIsRinging(true);
    setTimeout(() => setIsRinging(false), 1000);
    onClick();
  };

  return (
    <div className="relative inline-block cursor-pointer" onClick={handleClick}>
      {/* Bell Icon with Animation */}
      <div className={`transform ${isRinging ? 'animate-[wiggle_1s_ease-in-out]' : ''}`}>
        <Bell size={size} color={color} />
      </div>
      
      {/* Notification Count Badge */}
      {count > 0 && (
        <div 
        style={{backgroundColor:"#007A49"}}
         className={`
          absolute -top-2 -right-2
          ${badgeColor} text-white
          rounded-full
          min-w-5 h-5
          text-xs font-bold
          flex items-center justify-center
          px-1
          text-white
        `}>
          {displayCount}
        </div>
      )}
      
      {/* Bell ring animation - briefly shows when clicked */}
      {isRinging && (
        <div className={`
          absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
          w-8 h-8 rounded-full ${ringColor} opacity-30
          animate-ping
        `} />
      )}
      
      <style jsx>{`
        @keyframes wiggle {
          0% { transform: rotate(0deg); }
          25% { transform: rotate(10deg); }
          50% { transform: rotate(0deg); }
          75% { transform: rotate(-10deg); }
          100% { transform: rotate(0deg); }
        }
      `}</style>
    </div>
  );
};



export default NotificationBell;