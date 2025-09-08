"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface IconTransitionButtonProps {
  children: React.ReactNode;
  href?: string;
  onClick?: (event?: React.MouseEvent) => void;
  className?: string;
  disabled?: boolean;
  // Icon customization
  defaultIcon: LucideIcon;
  hoverIcon: LucideIcon;
  iconSize?: number;
  hoverIconSize?: number;
  fillDefaultIcon?: boolean;
  // Button styling
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

const variants = {
  primary: 'bg-black text-white hover:bg-black/80',
  secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
  outline: 'border-2 border-black text-black hover:bg-black hover:text-white',
  ghost: 'text-gray-600 hover:text-black hover:bg-gray-100'
};

const sizes = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg'
};

export default function IconTransitionButton({ 
  children, 
  href, 
  onClick, 
  className = "",
  disabled = false,
  defaultIcon: DefaultIcon,
  hoverIcon: HoverIcon,
  iconSize = 14,
  hoverIconSize = 16,
  fillDefaultIcon = true,
  variant = 'primary',
  size = 'md'
}: IconTransitionButtonProps) {
  const Component = href ? 'a' : 'button';
  
  return (
    <motion.div
      className={`group inline-block ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Component
        href={href}
        onClick={onClick}
        disabled={disabled}
        className={`
          inline-flex items-center gap-3 rounded-full font-medium 
          transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed
          ${variants[variant]} ${sizes[size]}
        `}
      >
        <div className="relative flex items-center justify-center" style={{ width: iconSize + 8, height: iconSize + 8 }}>
          <div className="absolute transition-all duration-200 group-hover:scale-0 group-hover:opacity-0">
            <DefaultIcon size={iconSize} fill={fillDefaultIcon ? "currentColor" : "none"} />
          </div>
          <div className="absolute transition-all duration-200 scale-0 opacity-0 group-hover:scale-100 group-hover:opacity-100">
            <HoverIcon size={hoverIconSize} />
          </div>
        </div>
        <span>{children}</span>
      </Component>
    </motion.div>
  );
}
