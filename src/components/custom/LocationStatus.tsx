"use client";

import { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import CircularLoader from '@/components/ui/CircularLoader';

interface LocationStatusProps {
  className?: string;
}

export default function LocationStatus({ className = "" }: LocationStatusProps) {
  const [isUsingLocation, setIsUsingLocation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if geolocation is supported
    const geolocationSupported = typeof navigator !== 'undefined' && 'geolocation' in navigator;
    
    if (geolocationSupported) {
      // Check permission status
      if ('permissions' in navigator) {
        navigator.permissions.query({ name: 'geolocation' as PermissionName }).then((result) => {
          setIsUsingLocation(result.state === 'granted');
        });
      }
    }
  }, []);

  const handleLocationClick = async () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }

    setIsLoading(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsUsingLocation(true);
        setIsLoading(false);
        // You can emit an event or use a callback to notify parent components
        window.dispatchEvent(new CustomEvent('locationUpdated', { 
          detail: { 
            lat: position.coords.latitude, 
            lng: position.coords.longitude 
          } 
        }));
      },
      (error) => {
        setIsUsingLocation(false);
        setIsLoading(false);
        console.error('Error getting location:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  return (
    <button
      onClick={isUsingLocation ? undefined : handleLocationClick}
      disabled={isLoading || isUsingLocation}
      className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all duration-200 ${
        isUsingLocation 
          ? 'bg-green-100 text-green-800' 
          : 'bg-red-100 text-red-800 hover:bg-red-200'
      } ${isLoading ? 'opacity-50 cursor-not-allowed' : isUsingLocation ? 'cursor-default' : 'cursor-pointer'} ${className}`}
    >
      {/* Blinking indicator or loader */}
      <div className="relative">
        {isLoading ? (
          <CircularLoader size="sm" />
        ) : (
          <>
            <div 
              className={`w-2 h-2 rounded-full ${
                isUsingLocation ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            {isUsingLocation && (
              <div className="absolute inset-0 w-2 h-2 rounded-full bg-green-500 animate-ping opacity-75" />
            )}
          </>
        )}
      </div>
      
      
      <span>
        {isLoading ? 'Getting location...' : isUsingLocation ? 'Using location' : 'Enable location'}
      </span>
    </button>
  );
}
