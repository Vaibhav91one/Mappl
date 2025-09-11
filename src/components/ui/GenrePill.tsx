"use client";

import { FlipText } from '@/components/animation';

interface GenrePillProps {
  genre: string;
  index?: number;
  className?: string;
  onRemove?: (genre: string) => void;
  removable?: boolean;
  size?: 'sm' | 'md';
}

export default function GenrePill({ 
  genre, 
  index, 
  className = "", 
  onRemove,
  removable = false,
  size = 'sm'
}: GenrePillProps) {
  const sizeClasses = size === 'sm' ? 'px-3 py-2 text-xs' : 'px-4 py-2 text-sm ';
  
  return (
    <span 
      className={`inline-flex items-center gap-1 ${sizeClasses} bg-blue-100 text-blue-800 rounded-full transition-all duration-200 hover:scale-105 ${className}`}
    >
      <FlipText
        className="inline-block"
        duration={0.3}
        stagger={0.02}
      >
        {genre}
      </FlipText>
      {removable && onRemove && (
        <button
          type="button"
          onClick={() => onRemove(genre)}
          className="ml-1 hover:text-blue-300 font-semibold transition-colors duration-200"
        >
          ×
        </button>
      )}
    </span>
  );
}
