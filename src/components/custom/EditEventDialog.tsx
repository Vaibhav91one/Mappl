"use client";

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import IconTransitionButton from '@/components/ui/IconTransitionButton';
import { Calendar, Clock, X, Save, Trash2 } from 'lucide-react';

type EditEventDialogProps = {
  open: boolean;
  eventDoc: any | null;
  onOpenChange: (open: boolean) => void;
  onSave: (payload: { title: string; description: string; file?: File | null; removeImage?: boolean }) => Promise<void> | void;
};

export default function EditEventDialog({ open, eventDoc, onOpenChange, onSave }: EditEventDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [when, setWhen] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState('10:30:00');

  useEffect(() => {
    if (!open) return;
    setTitle(eventDoc?.title || '');
    setDescription(eventDoc?.description || '');
    setFile(null);
    setRemoveImage(false);
    
    // Initialize date/time
    if (eventDoc?.date) {
      const d = new Date(eventDoc.date);
      if (!isNaN(d.getTime())) {
        setWhen(d);
        const hh = `${d.getHours()}`.padStart(2, '0');
        const mm = `${d.getMinutes()}`.padStart(2, '0');
        const ss = `${d.getSeconds()}`.padStart(2, '0');
        setTime(`${hh}:${mm}:${ss}`);
      } else {
        setWhen(undefined);
        setTime('10:30:00');
      }
    } else {
      setWhen(undefined);
      setTime('10:30:00');
    }
  }, [open, eventDoc]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit event</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="py-2" htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="py-2" htmlFor="desc">Description</Label>
            <Textarea id="desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          
          {/* Date and Time - Centered like create event dialog */}
          <div className="space-y-1">
            <Label className="py-2 px-1">Date & Time</Label>
            <div className="flex gap-4 justify-center">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-gray-500" />
                <Input
                  type="date"
                  value={when ? when.toISOString().split('T')[0] : ''}
                  onChange={(e) => setWhen(e.target.value ? new Date(e.target.value) : undefined)}
                  className="w-40"
                />
              </div>
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-gray-500" />
                <Input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-32"
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-1">
            <Label className="py-2" htmlFor="file">Image</Label>
            <div className="space-y-3">
              <Input id="file" type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              {eventDoc?.imageUrl && !removeImage ? (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <img src={eventDoc.imageUrl} alt="current" className="h-16 w-16 rounded object-cover" />
                    <div className="text-sm text-gray-600">Current image</div>
                  </div>
                  <IconTransitionButton
                    size="sm"
                    variant="secondary"
                    defaultIcon={Trash2}
                    hoverIcon={X}
                    onClick={() => setRemoveImage(true)}
                    className="bg-red-500/90 text-white hover:bg-red-600"
                  >
                    Remove
                  </IconTransitionButton>
                </div>
              ) : null}
              {removeImage && (
                <div className="text-xs text-gray-600 p-2 bg-yellow-50 rounded">Current image will be removed when you save.</div>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <IconTransitionButton
            variant="ghost"
            defaultIcon={X}
            hoverIcon={X}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </IconTransitionButton>
          <IconTransitionButton
            variant="primary"
            defaultIcon={Save}
            hoverIcon={Save}
            onClick={() => onSave({ title, description, file, removeImage })}
          >
            Save
          </IconTransitionButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


