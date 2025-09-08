"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';

interface User {
  userId: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

interface StackedAvatarsProps {
  userIds: string[];
  maxVisible?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8', 
  lg: 'w-10 h-10'
};

const textSizes = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base'
};

export default function StackedAvatars({ 
  userIds, 
  maxVisible = 3, 
  size = 'md',
  className = '' 
}: StackedAvatarsProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      if (userIds.length === 0) {
        setLoading(false);
        return;
      }

      try {
        const userPromises = userIds.slice(0, maxVisible).map(async (userId) => {
          const response = await fetch(`/api/users/${userId}`);
          if (response.ok) {
            return await response.json();
          }
          return null;
        });

        const userResults = await Promise.all(userPromises);
        const validUsers = userResults.filter(Boolean);
        setUsers(validUsers);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [userIds, maxVisible]);

  if (loading) {
    return (
      <div className={`flex items-center ${className}`}>
        <div className={`${sizes[size]} bg-gray-200 rounded-full animate-pulse`} />
      </div>
    );
  }

  if (users.length === 0) {
    return null;
  }

  const visibleUsers = users.slice(0, maxVisible);
  const remainingCount = userIds.length - maxVisible;

  return (
    <div className={`flex items-center ${className}`}>
      <div className="flex -space-x-2">
        {visibleUsers.map((user, index) => (
          <div
            key={user.userId}
            className={`${sizes[size]} rounded-full border-2 border-white bg-gray-100 flex items-center justify-center overflow-hidden`}
            style={{ zIndex: visibleUsers.length - index }}
            title={user.name || user.email}
          >
            {user.avatarUrl ? (
              <Image
                src={user.avatarUrl}
                alt={user.name || user.email}
                width={size === 'sm' ? 24 : size === 'md' ? 32 : 40}
                height={size === 'sm' ? 24 : size === 'md' ? 32 : 40}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to initials if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = `<span class="${textSizes[size]} font-medium text-gray-600">${getInitials(user.name || user.email)}</span>`;
                  }
                }}
              />
            ) : (
              <span className={`${textSizes[size]} font-medium text-gray-600`}>
                {getInitials(user.name || user.email)}
              </span>
            )}
          </div>
        ))}
        
        {remainingCount > 0 && (
          <div
            className={`${sizes[size]} rounded-full border-2 border-white bg-gray-200 flex items-center justify-center`}
            style={{ zIndex: 0 }}
            title={`+${remainingCount} more`}
          >
            <span className={`${textSizes[size]} font-medium text-gray-600`}>
              +{remainingCount}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
