'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { differenceInMinutes, differenceInHours, differenceInDays } from 'date-fns';

interface ActivityStatusProps {
  lastActiveAt?: any; // Firestore Timestamp or ISO string
  className?: string;
  showIcon?: boolean;
}

/**
 * PRODUCTION READY: Prevents hydration mismatch by calculating status only after mount.
 */
export function ActivityStatus({ lastActiveAt, className, showIcon = true }: ActivityStatusProps) {
  const [status, setStatus] = useState<{ text: string; color: string } | null>(null);

  useEffect(() => {
    if (!lastActiveAt) return;

    const date = lastActiveAt?.toDate ? lastActiveAt.toDate() : new Date(lastActiveAt);
    const now = new Date();

    const diffMinutes = differenceInMinutes(now, date);
    const diffHours = differenceInHours(now, date);
    const diffDays = differenceInDays(now, date);

    let text = '';
    let color = 'bg-muted-foreground/30';

    if (diffMinutes < 5) {
      text = 'Online now';
      color = 'bg-green-500';
    } else if (diffMinutes < 60) {
      text = `Active ${diffMinutes}m ago`;
      color = 'bg-green-400';
    } else if (diffHours < 24) {
      text = 'Active today';
      color = 'bg-blue-400';
    } else if (diffDays < 7) {
      text = 'Active this week';
      color = 'bg-muted-foreground/40';
    } else {
      text = 'Active recently';
      color = 'bg-muted-foreground/20';
    }

    setStatus({ text, color });
  }, [lastActiveAt]);

  if (!status) return null;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {showIcon && (
        <div className={cn("h-2 w-2 rounded-full", status.color)} />
      )}
      <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/80">
        {status.text}
      </span>
    </div>
  );
}
