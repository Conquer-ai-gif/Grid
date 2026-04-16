'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, X, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';

export function NotificationBell() {
  const { notifications, unreadCount, markRead, loading } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleOpen = () => {
    setOpen((v) => !v);
  };

  const handleMarkAllRead = async () => {
    await markRead();
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleOpen}
        className="relative flex size-9 items-center justify-center rounded-xl border border-border-1 bg-surface-1 text-text-2 hover:border-amber-1 hover:text-amber-1 transition-all"
        aria-label="Notifications"
      >
        <Bell size={17} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-amber-1 text-[10px] font-bold text-black">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 rounded-2xl border border-border-1 bg-surface-1 shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between border-b border-border-1 px-4 py-3">
            <span className="text-sm font-semibold text-text-1">Notifications</span>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-amber-1 hover:underline"
                >
                  Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-text-3 hover:text-text-1">
                <X size={15} />
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-border-1">
            {loading ? (
              <p className="px-4 py-6 text-center text-sm text-text-3">Loading…</p>
            ) : notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-text-3">No notifications yet</p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`flex gap-3 px-4 py-3 hover:bg-surface-2 transition-colors cursor-pointer ${!n.read ? 'bg-amber-5' : ''}`}
                  onClick={() => markRead(n.id)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-1 line-clamp-1">{n.title}</p>
                    <p className="mt-0.5 text-xs text-text-3 line-clamp-2">{n.body}</p>
                    <p className="mt-1 text-xs text-text-3 opacity-60">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  {n.lecture_id && (
                    <Link
                      href={`/meeting/${n.lecture_id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex shrink-0 items-start pt-0.5 text-amber-1 hover:text-amber-400"
                    >
                      <ExternalLink size={13} />
                    </Link>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
