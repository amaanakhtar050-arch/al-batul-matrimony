'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
  variant?: 'icon' | 'full' | 'app-icon';
  className?: string;
  size?: number;
}

/**
 * Al Batul Matrimony Brand Logo
 * Features a golden crescent moon merged with a heart and a subtle ring element.
 * Emerald Green and Gold color palette for a premium matrimonial aesthetic.
 */
export function Logo({ variant = 'full', className, size = 40 }: LogoProps) {
  const emerald = '#064E3B';
  const gold = '#D4AF37';

  const svgIcon = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(variant === 'app-icon' ? '' : className)}
    >
      <defs>
        <linearGradient id="logo-gold-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#D4AF37" />
          <stop offset="50%" stopColor="#F9E27E" />
          <stop offset="100%" stopColor="#C5A028" />
        </linearGradient>
        <filter id="logo-glow-effect" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {variant === 'app-icon' && (
        <rect width="100" height="100" rx="24" fill={emerald} />
      )}

      {/* The Crescent Heart Base */}
      <path
        d="M50 82C50 82 22 62 22 38C22 24 32 14 42 14C48 14 53 18 55 24C57 18 62 14 68 14C78 14 88 24 88 38C88 62 60 82 60 82"
        stroke={variant === 'app-icon' ? 'white' : gold}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      
      {/* Crescent Moon Highlight */}
      <path
        d="M50 14C32 14 18 28 18 46C18 64 32 78 50 78C56 78 61 76 66 73"
        stroke={variant === 'app-icon' ? 'white' : "url(#logo-gold-gradient)"}
        strokeWidth="4"
        strokeLinecap="round"
        filter="url(#logo-glow-effect)"
      />

      {/* Central Ring Element */}
      <circle
        cx="50"
        cy="42"
        r="11"
        stroke={variant === 'app-icon' ? 'rgba(255,255,255,0.4)' : gold}
        strokeWidth="1.5"
        strokeDasharray="2 3"
      />

      {/* Sparkling Intention Symbol */}
      <path
        d="M50 30L52 35L57 37L52 39L50 44L48 39L43 37L48 35L50 30Z"
        fill={variant === 'app-icon' ? 'white' : gold}
      />
    </svg>
  );

  if (variant === 'icon' || variant === 'app-icon') {
    return (
      <div className={cn("inline-flex items-center justify-center", className)}>
        {svgIcon}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-3 shrink-0", className)}>
      {svgIcon}
      <div className="flex flex-col leading-tight select-none">
        <span className="font-headline font-bold text-primary" style={{ fontSize: size * 0.45 }}>
          Al Batul
        </span>
        <span className="font-body text-[9px] font-bold uppercase tracking-[0.4em] text-muted-foreground/80 -mt-0.5">
          Matrimony
        </span>
      </div>
    </div>
  );
}
