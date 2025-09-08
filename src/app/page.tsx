

"use client";

import { FlipText } from "@/components/animation";
import IconTransitionButton from "@/components/ui/IconTransitionButton";
import { Circle, ArrowRight } from 'lucide-react';
import Image from "next/image";

export default function Home() {
  return (
    <div className="h-[calc(100vh-80px)] w-full flex flex-col items-center justify-center text-center px-4">
      <div className="flex items-center gap-2">
        <Image src="/logos/mappl_logo.svg" alt="Mappl" width={42} height={42} />
        <FlipText 
          href="/" 
          className="font-semibold text-4xl cursor-pointer"
          as="a"
          duration={0.5}
          stagger={0.02}
        >
          Mappl
        </FlipText>
      </div>
      <p className="mt-3 max-w-xl text-balance text-gray-600">
        Create and discover events around you on an interactive map. Search a location, click to drop an event, and share it with others.
      </p>
      <IconTransitionButton
        href="/events"
        className="mt-6"
        defaultIcon={Circle}
        hoverIcon={ArrowRight}
        variant="primary"
        size="md"
      >
        Go to Events
      </IconTransitionButton>
    </div>
  );
}
