"use client";

import IconTransitionButton from '@/components/ui/IconTransitionButton';
import CircularLoader from '@/components/ui/CircularLoader';
import { Circle, MessageCircle, Eye, MapPin } from 'lucide-react';
import { useState, useEffect } from 'react';

interface EventCardProps {
  event: {
    id: string;
    title: string;
    description?: string;
    code?: string;
    location: { lat: number; lng: number };
    date?: string; // This contains the ISO string with both date and time
    time?: string;
    placeName?: string;
    imageUrl?: string;
    joiners?: string[];
    genre?: string[];
  };
  userLoc?: { lat: number; lng: number };
  onJoin: (event: any) => void;
  onChat: (event: any) => void;
  onView: (event: any) => void;
}

// Helper function to format date and time
function formatDateTime(dateStr?: string, timeStr?: string): string {
  
  if (!dateStr && !timeStr) return '';
  
  try {
    let date;
    
    // If we have an ISO string with both date and time, use it directly
    if (dateStr && dateStr.includes('T')) {
      date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const day = date.getDate();
        const month = date.toLocaleDateString('en-US', { month: 'short' });
        const time = date.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        });
        const result = `${dayName}, ${day} ${month} ${time}`;
        return result;
      }
    }
    
    // Fallback to separate date and time handling
    let formattedDate = '';
    let formattedTime = '';
    
    // Handle date
    if (dateStr) {
      if (dateStr.includes('T')) {
        date = new Date(dateStr);
      } else if (dateStr.includes('-')) {
        date = new Date(dateStr);
      } else {
        date = new Date(dateStr);
      }
      
      if (!isNaN(date.getTime())) {
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const day = date.getDate();
        const month = date.toLocaleDateString('en-US', { month: 'short' });
        formattedDate = `${dayName}, ${day} ${month}`;
      } else {
        formattedDate = dateStr;
      }
    }
    
    // Handle time
    if (timeStr) {
      let timeObj;
      
      if (timeStr.includes('T')) {
        const timePart = timeStr.split('T')[1];
        timeObj = new Date(`2000-01-01T${timePart}`);
      } else if (timeStr.includes(':')) {
        timeObj = new Date(`2000-01-01T${timeStr}`);
      } else {
        timeObj = new Date(`2000-01-01T${timeStr}`);
      }
      
      if (!isNaN(timeObj.getTime())) {
        formattedTime = timeObj.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        });
      } else {
        formattedTime = timeStr;
      }
    }
    
    // Combine date and time
    const result = formattedDate && formattedTime ? `${formattedDate} ${formattedTime}` : (formattedDate || formattedTime || dateStr || timeStr || '');
    return result;
  } catch (error) {
    console.error('Date formatting error:', error);
    return dateStr || timeStr || '';
  }
}

export default function EventCard({ 
  event, 
  userLoc, 
  onJoin, 
  onChat, 
  onView 
}: EventCardProps) {
  const [resolvedLocation, setResolvedLocation] = useState<string>('');
  const [isResolvingLocation, setIsResolvingLocation] = useState(false);

  // Resolve location to readable place name
  useEffect(() => {
    const resolveLocation = async () => {
      if (event.placeName) {
        setResolvedLocation(event.placeName);
        return;
      }

      if (event.location) {
        setIsResolvingLocation(true);
        try {
          const response = await fetch(
            `/api/geocode/reverse?lat=${event.location.lat}&lon=${event.location.lng}`
          );
          const data = await response.json();
          
          if (data.display_name) {
            // Extract more specific location details
            const address = data.address || {};
            const parts = [];
            
            // Try to get the most specific location first
            if (address.amenity || address.building || address.road) {
              parts.push(address.amenity || address.building || address.road);
            }
            if (address.suburb || address.neighbourhood) {
              parts.push(address.suburb || address.neighbourhood);
            }
            if (address.city || address.town || address.village) {
              parts.push(address.city || address.town || address.village);
            }
            if (address.state || address.region) {
              parts.push(address.state || address.region);
            }
            if (address.country) {
              parts.push(address.country);
            }
            
            // If we have specific parts, use them; otherwise use display_name
            const location = parts.length > 0 ? parts.join(', ') : data.display_name;
            setResolvedLocation(location);
          } else {
            setResolvedLocation(`${event.location.lat.toFixed(4)}, ${event.location.lng.toFixed(4)}`);
          }
        } catch (error) {
          console.error('Location resolution error:', error);
          setResolvedLocation(`${event.location.lat.toFixed(4)}, ${event.location.lng.toFixed(4)}`);
        } finally {
          setIsResolvingLocation(false);
        }
      }
    };

    resolveLocation();
  }, [event.location, event.placeName]);


  return (
    <div 
      className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200 cursor-pointer"
      onClick={() => onView(event)}
    >
      {/* Event Image - increased height */}
      {event.imageUrl && (
        <div className="w-full h-64 overflow-hidden">
          <img 
            src={event.imageUrl} 
            alt={event.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <div className="p-5 min-h-[180px] flex flex-col justify-between">
        <div>
          {/* Date and Time - formatted as "Fri, 26 Sep, 6:00 PM" */}
          {formatDateTime(event.date, event.time) && (
            <p className="text-sm text-gray-500 mb-1 font-medium">
              {formatDateTime(event.date, event.time)}
            </p>
          )}
          
          {/* Event Title */}
          <h3 className="text-lg font-bold text-black mb-1 line-clamp-2">
            {event.title}
          </h3>
          
          {/* Location with Map Icon */}
          {(resolvedLocation || event.location || isResolvingLocation) && (
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-gray-500 flex-shrink-0" />
              <div className="flex items-center gap-2 flex-1">
                {isResolvingLocation && <CircularLoader size="sm" />}
                <p className="text-sm text-gray-700 line-clamp-1 flex-1">
                  {isResolvingLocation ? 'Resolving location...' : (resolvedLocation || `${event.location.lat.toFixed(4)}, ${event.location.lng.toFixed(4)}`)}
                </p>
              </div>
            </div>
          )}

          {/* Genre Tags */}
          {event.genre && event.genre.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {event.genre.slice(0, 3).map((g, index) => (
                <span 
                  key={index}
                  className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                >
                  {g}
                </span>
              ))}
              {event.genre.length > 3 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                  +{event.genre.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>
        
        {/* Chat button - positioned at bottom right */}
        <div className=" flex justify-end">
          <IconTransitionButton
            size="sm"
            variant="primary"
            defaultIcon={Circle}
            hoverIcon={MessageCircle}
            onClick={(evn) => { evn?.stopPropagation(); onChat(event); }}
          >
            Chat
          </IconTransitionButton>
        </div>
      </div>
    </div>
  );
}
