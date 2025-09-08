"use client";

import { useState, useEffect } from 'react';
import { Message } from '@/lib/api/messages';

interface MessageCardProps {
  message: Message;
  isCurrentUser: boolean;
  currentUserId?: string;
}

export default function MessageCard({ message, isCurrentUser, currentUserId }: MessageCardProps) {
  const [userData, setUserData] = useState<{ name?: string; avatarUrl?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!message.userId) {
      setLoading(false);
      return;
    }

    // Fetch user data
    fetch(`/api/users/${message.userId}`)
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        setUserData(data);
      })
      .catch(() => {
        setUserData(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [message.userId]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex items-start gap-3 max-w-[75%] ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div className="flex-shrink-0 flex items-start justify-center">
          {loading ? (
            <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
          ) : userData?.avatarUrl ? (
            <img
              src={userData.avatarUrl}
              alt={userData.name || 'User'}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs font-medium text-gray-600">
              {getInitials(userData?.name || message.userName)}
            </div>
          )}
        </div>

        {/* Message Content */}
        <div className="flex flex-col">
          {/* User Name */}
          {!isCurrentUser && (userData?.name || message.userName) && (
            <div className="text-xs text-gray-500 mb-2 px-1">
              {userData?.name || message.userName}
            </div>
          )}
          
          {/* Message Bubble */}
          <div
            className={`px-4 py-2 rounded-full text-sm ${
              isCurrentUser
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-900'
            }`}
          >
            {message.text}
          </div>
          
          {/* Timestamp */}
          <div className={`text-xs text-gray-400 mt-2 px-1 ${isCurrentUser ? 'text-right' : 'text-left'}`}>
            {formatTime(message.createdAt)}
          </div>
        </div>
      </div>
    </div>
  );
}
