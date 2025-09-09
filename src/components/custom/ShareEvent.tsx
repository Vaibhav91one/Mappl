"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Share2, Copy, Check, Facebook, Twitter, Linkedin, Mail, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import IconTransitionButton from '@/components/ui/IconTransitionButton';

type EventData = {
  id?: string;
  code?: string;
  title?: string;
  description?: string;
  date?: string;
  location?: { lat: number; lng: number };
  placeName?: string;
  imageUrl?: string;
};

type ShareEventProps = {
  event: EventData;
  children?: React.ReactNode;
  variant?: 'default' | 'outline' | 'ghost' | 'link' | 'destructive' | 'secondary';
  size?: 'default' | 'sm' | 'md' | 'lg' | 'icon';
  className?: string;
};

export default function ShareEvent({ 
  event, 
  children, 
  variant = 'outline', 
  size = 'sm',
  className = ''
}: ShareEventProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Generate share URLs using event code
  const eventCode = event.code || event.id;
  const eventUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/events${eventCode ? `?event=${eventCode}` : ''}`;
  const shareText = `Check out this event: ${event.title || 'Untitled Event'}${event.date ? ` on ${new Date(event.date).toLocaleDateString()}` : ''}${event.placeName ? ` at ${event.placeName}` : ''}`;
  
  const shareUrls = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(eventUrl)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(eventUrl)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(eventUrl)}`,
    email: `mailto:?subject=${encodeURIComponent(shareText)}&body=${encodeURIComponent(`${shareText}\n\n${eventUrl}`)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${shareText}\n\n${eventUrl}`)}`
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(eventUrl);
      setCopied(true);
      toast.success('Event link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  const handleShare = (platform: keyof typeof shareUrls) => {
    const url = shareUrls[platform];
    if (platform === 'email') {
      window.location.href = url;
    } else {
      window.open(url, '_blank', 'width=600,height=400');
    }
  };

  const defaultTrigger = (
    <IconTransitionButton
      variant={variant === 'default' ? 'primary' : variant === 'link' ? 'ghost' : variant === 'destructive' ? 'primary' : variant}
      size={size === 'md' ? 'lg' : size === 'default' ? 'lg' : size === 'icon' ? 'sm' : size}
      defaultIcon={Share2}
      hoverIcon={Share2}
      className={className}
    >
      Share Event
    </IconTransitionButton>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Event
          </DialogTitle>
          <DialogDescription>
            Share "{event.title || 'this event'}" with your friends and family
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Event Preview */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="flex gap-3">
              {event.imageUrl && (
                <img 
                  src={event.imageUrl} 
                  alt={event.title}
                  className="w-16 h-16 object-cover rounded"
                />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm truncate">{event.title || 'Untitled Event'}</h3>
                {event.description && (
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                    {event.description}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                  {event.date && (
                    <span>{new Date(event.date).toLocaleDateString()}</span>
                  )}
                  {event.placeName && (
                    <span>• {event.placeName}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Copy Link */}
          <div className="space-y-2">
            <Label htmlFor="event-link">Event Link</Label>
            <div className="flex gap-2">
              <Input
                id="event-link"
                value={eventUrl}
                readOnly
                className="flex-1"
              />
              <Button
                onClick={handleCopyLink}
                variant="outline"
                size="sm"
                className="px-3"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Social Sharing Buttons */}
          <div className="space-y-3">
            <Label>Share on Social Media</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => handleShare('facebook')}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Facebook className="h-4 w-4 text-blue-600" />
                Facebook
              </Button>
              <Button
                onClick={() => handleShare('twitter')}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Twitter className="h-4 w-4 text-blue-400" />
                Twitter
              </Button>
              <Button
                onClick={() => handleShare('linkedin')}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Linkedin className="h-4 w-4 text-blue-700" />
                LinkedIn
              </Button>
              <Button
                onClick={() => handleShare('whatsapp')}
                variant="outline"
                className="flex items-center gap-2"
              >
                <MessageCircle className="h-4 w-4 text-green-600" />
                WhatsApp
              </Button>
            </div>
          </div>

          {/* Email Share */}
          <div className="space-y-2">
            <Label>Email</Label>
            <Button
              onClick={() => handleShare('email')}
              variant="outline"
              className="w-full flex items-center gap-2"
            >
              <Mail className="h-4 w-4" />
              Send via Email
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
