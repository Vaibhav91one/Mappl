"use client";

import React from "react";
import { motion } from "framer-motion";

interface FlipTextProps {
  children: React.ReactNode;
  href?: string;
  className?: string;
  duration?: number;
  stagger?: number;
  as?: "a" | "div" | "span" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p";
  onClick?: () => void;
}

const FlipText = ({ 
  children, 
  href, 
  className = "", 
  duration = 0.25, 
  stagger = 0.025,
  as = "div",
  onClick 
}: FlipTextProps) => {
  const text = typeof children === "string" ? children : "";
  
  if (!text) {
    return <>{children}</>;
  }

  const Component = motion[as] as any;

  return (
    <Component
      initial="initial"
      whileHover="hovered"
      href={href}
      onClick={onClick}
      className={`relative block overflow-hidden whitespace-nowrap ${className}`}
      style={{
        lineHeight: 1.3,
      }}
    >
      <div className="">
        {text.split("").map((letter, i) => (
          <motion.span
            variants={{
              initial: {
                y: 0,
              },
              hovered: {
                y: "-100%",
              },
            }}
            transition={{
              duration,
              ease: "easeInOut",
              delay: stagger * i,
            }}
            className="inline-block"
            key={i}
          >
            {letter}
          </motion.span>
        ))}
      </div>
      <div className="absolute inset-0">
        {text.split("").map((letter, i) => (
          <motion.span
            variants={{
              initial: {
                y: "100%",
              },
              hovered: {
                y: 0,
              },
            }}
            transition={{
              duration,
              ease: "easeInOut",
              delay: stagger * i,
            }}
            className="inline-block"
            key={i}
          >
            {letter}
          </motion.span>
        ))}
      </div>
    </Component>
  );
};

export default FlipText;
