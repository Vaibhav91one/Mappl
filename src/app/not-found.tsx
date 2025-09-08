"use client";

import Link from 'next/link';
import { ArrowLeft, Home } from 'lucide-react';
import IconTransitionButton from '@/components/ui/IconTransitionButton';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-gray-200">404</h1>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Page Not Found</h2>
          <p className="text-gray-600 mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        
        <div className="space-y-4">
          <IconTransitionButton
            href="/"
            defaultIcon={Home}
            hoverIcon={Home}
            variant="primary"
            size="lg"
            className="w-full"
          >
            Go Home
          </IconTransitionButton>
          
          <IconTransitionButton
            href="/events"
            defaultIcon={ArrowLeft}
            hoverIcon={ArrowLeft}
            variant="outline"
            size="lg"
            className="w-full"
          >
            Browse Events
          </IconTransitionButton>
        </div>
      </div>
    </div>
  );
}
