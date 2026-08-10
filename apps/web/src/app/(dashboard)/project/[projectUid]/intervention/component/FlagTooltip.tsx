'use client'

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { HoverCard } from 'radix-ui';
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

// The panel is rendered in a portal on purpose: the flag chip sits inside a
// Card, and Card is `overflow-hidden`, so an absolutely positioned panel gets
// clipped where it overlaps the map above it. A portal escapes that clip.
export const FlagTooltip = ({ flagReasons, children }: FlagTooltipProps) => {
  if (!flagReasons || flagReasons.length === 0) return <>{children}</>;

  return (
    <HoverCard.Root openDelay={100} closeDelay={100}>
      <HoverCard.Trigger asChild>
        <div className="inline-block cursor-help">{children}</div>
      </HoverCard.Trigger>
      <HoverCard.Portal>
        <HoverCard.Content
          side="top"
          align="start"
          sideOffset={8}
          collisionPadding={12}
          className="z-50 w-80 rounded-lg border border-gray-200 bg-white p-4 shadow-lg"
        >
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
        </HoverCard.Content>
      </HoverCard.Portal>
    </HoverCard.Root>
  );
};
