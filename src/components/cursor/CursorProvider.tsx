"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import gsap from "gsap";

type CursorContextType = {
  cursorRef: React.RefObject<HTMLDivElement>;
  moveCursor: (x: number, y: number) => void;
  scaleCursor: (scale: number) => void;
  scaleRevertCursor: () => void;
};

const CursorContext = createContext<CursorContextType | undefined>(undefined);

export const CursorProvider = ({ children }: { children: React.ReactNode }) => {
  const cursorRef = useRef<any>(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;

    gsap.set(cursor, { opacity: 0 });

    const handleMouseMove = (e: MouseEvent) => {
      moveCursor(e.clientX, e.clientY);
      gsap.to(cursor, { opacity: 1, duration: 0.1, ease: "power2.out" });
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", () => gsap.to(cursor, { opacity: 0, duration: 0.3 }));

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  const moveCursor = (x: number, y: number) => {
    gsap.to(cursorRef.current, {
      x: x - 10,
      y: y - 10,
      duration: 0.5,
      ease: "power2.out",
    });
  };

  const scaleCursor = (scale: number) => {
    gsap.to(cursorRef.current, {
      scale: scale,
      duration: 0.1,
      ease: "power2.out",
    });
  };

  const scaleRevertCursor = () => {
    gsap.to(cursorRef.current, {
      scale: 1,
      duration: 0.1,
      ease: "power2.out",
    });
  };

  return (
    <CursorContext.Provider value={{ cursorRef, moveCursor, scaleCursor, scaleRevertCursor }}>
      {children}
      <div
        ref={cursorRef}
        className="fixed top-0 left-0 h-[20px] w-[20px] bg-gray-200 rounded-full z-50 pointer-events-none mix-blend-difference shadow"
      />
    </CursorContext.Provider>
  );
};

export const useCursor = () => {
  const context = useContext(CursorContext);
  if (!context) {
    throw new Error("useCursor must be used within a CursorProvider");
  }
  return context;
};
