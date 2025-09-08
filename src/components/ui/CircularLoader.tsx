"use client";

import React from 'react';

interface CircularLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8'
};

export default function CircularLoader({ size = 'md', className = '' }: CircularLoaderProps) {
  return (
    <div className={`${sizes[size]} ${className}`}>
      <div className="h-full w-full animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
    </div>
  );
}
