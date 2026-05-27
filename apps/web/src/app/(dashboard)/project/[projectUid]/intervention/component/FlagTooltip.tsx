'use client'

import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Badge } from './ui';

interface FlagReason {
  title: string;
  level: string;
  message: string;
  createdAt: string;
}

interface FlagTooltipProps {
  flagReasons?: FlagReason[];
  children: React.ReactNode;
}

export const FlagTooltip = ({ flagReasons, children }: FlagTooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);

  if (!flagReasons || flagReasons.length === 0) return <>{children}</>;

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="cursor-help"
      >
        {children}
      </div>
      {isVisible && (
        <div className="absolute z-50 bottom-full left-0 mb-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
          <h4 className="font-medium text-red-700 mb-2 flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Data Issues Found
          </h4>
          <div className="space-y-2">
            {flagReasons.map((reason, index) => (
              <div key={index} className="bg-red-50 border border-red-200 rounded p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-red-800 text-sm">{reason.title}</span>
                  <Badge variant="error" className="text-xs">
                    {reason.level}
                  </Badge>
                </div>
                <p className="text-sm text-red-700">{reason.message}</p>
                <p className="text-xs text-red-500 mt-1">
                  {new Date(reason.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
