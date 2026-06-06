'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { differenceInMinutes, differenceInHours, differenceInDays } from 'date-fns';

interface ActivityStatusProps {
  lastActiveAt?: any; // Firestore Timestamp or ISO string
  className?: string;
  showIcon?: boolean;
}

export function ActivityStatus({ lastActiveAt, className, showIcon = true }: ActivityStatusProps) {
  if (!lastActiveAt) return null;

  const date = lastActiveAt?.toDate ? lastActiveAt.toDate() : new Date(lastActiveAt);
  const now = new Date();

  const diffMinutes = differenceInMinutes(now, date);
  const diffHours = differenceInHours(now, date);
  const diffDays = differenceInDays(now, date);

  let statusText = '';
  let statusColor = 'bg-muted-foreground/30';

  if (diffMinutes < 5) {
    statusText = 'Online now';
    statusColor = 'bg-green-500';
  } else if (diffMinutes < 60) {
    statusText = `Active ${diffMinutes} minutes ago`;
    statusColor = 'bg-green-400';
  } else if (diffHours < 24) {
    statusText = 'Active today';
    statusColor = 'bg-blue-400';
  } else if (diffDays < 7) {
    statusText = 'Active this week';
    statusColor = 'bg-muted-foreground/40';
  } else {
    statusText = 'Active recently';
    statusColor = 'bg-muted-foreground/20';
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {showIcon && (
        <div className={cn("h-2 w-2 rounded-full", statusColor)} />
      )}
      <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/80">
        {statusText}
      </span>
    </div>
  );
}
