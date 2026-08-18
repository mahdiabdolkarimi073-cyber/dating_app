'use client';

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { Heart, MessageCircle, Sparkles } from 'lucide-react';

interface AppNotification {
  type: 'message' | 'match' | 'like' | 'connected';
  matchId?: number;
  senderId?: number;
  senderName?: string | null;
  senderPhoto?: string | null;
  content?: string;
  createdAt?: string;
}

export function NotificationProvider() {
  const router = useRouter();
  const pathname = usePathname();
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let mounted = true;

    const connect = () => {
      if (!mounted) return;
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const eventSource = new EventSource('/api/notifications/stream');
      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        try {
          const data: AppNotification = JSON.parse(event.data);
          if (data.type === 'connected') return;

          // If user is currently in the chat for this matchId, skip the toast
          if (data.type === 'message' && data.matchId) {
            const currentChatPath = `/chat/${data.matchId}`;
            if (pathname === currentChatPath) return;
          }

          if (data.type === 'message' && data.senderName) {
            toast.custom(
              (t) => (
                <div
                  className="flex items-center gap-3 rounded-2xl bg-card border border-border/50 shadow-xl px-4 py-3 cursor-pointer hover:scale-[1.02] transition-transform"
                  onClick={() => {
                    toast.dismiss(t);
                    if (data.matchId) {
                      router.push(`/chat/${data.matchId}`);
                    }
                  }}
                >
                  <div className="relative h-10 w-10 rounded-full overflow-hidden flex-shrink-0">
                    {data.senderPhoto ? (
                      <img
                        src={data.senderPhoto}
                        alt={data.senderName || 'User'}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-gradient-romance">
                        <span className="text-sm font-bold text-white">
                          {data.senderName?.[0]?.toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-gradient-romance border-2 border-card">
                      <MessageCircle className="h-2 w-2 text-white" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-foreground">
                      New message from {data.senderName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {data.content}
                    </p>
                  </div>
                </div>
              ),
              { duration: 1500 }
            );
          } else if (data.type === 'match' && data.senderName) {
            toast.custom(
              (t) => (
                <div
                  className="flex items-center gap-3 rounded-2xl bg-card border border-border/50 shadow-xl px-4 py-3 cursor-pointer hover:scale-[1.02] transition-transform"
                  onClick={() => {
                    toast.dismiss(t);
                    if (data.matchId) {
                      router.push(`/chat/${data.matchId}`);
                    }
                  }}
                >
                  <div className="relative h-10 w-10 rounded-full overflow-hidden flex-shrink-0">
                    {data.senderPhoto ? (
                      <img
                        src={data.senderPhoto}
                        alt={data.senderName || 'User'}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-gradient-romance">
                        <span className="text-sm font-bold text-white">
                          {data.senderName?.[0]?.toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-green-500 border-2 border-card">
                      <Heart className="h-2 w-2 text-white fill-white" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-foreground">
                      It&apos;s a match!
                    </p>
                    <p className="text-xs text-muted-foreground">
                      You matched with {data.senderName}
                    </p>
                  </div>
                </div>
              ),
              { duration: 1500 }
            );
          } else if (data.type === 'like' && data.senderName) {
            toast.custom(
              (t) => (
                <div
                  className="flex items-center gap-3 rounded-2xl bg-card border border-border/50 shadow-xl px-4 py-3 cursor-pointer hover:scale-[1.02] transition-transform"
                  onClick={() => {
                    toast.dismiss(t);
                    router.push('/likes');
                  }}
                >
                  <div className="relative h-10 w-10 rounded-full overflow-hidden flex-shrink-0">
                    {data.senderPhoto ? (
                      <img
                        src={data.senderPhoto}
                        alt={data.senderName || 'User'}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-gradient-romance">
                        <span className="text-sm font-bold text-white">
                          {data.senderName?.[0]?.toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary border-2 border-card">
                      <Sparkles className="h-2 w-2 text-white" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-foreground">
                      {data.senderName} liked you
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Tap to see who&apos;s interested
                    </p>
                  </div>
                </div>
              ),
              { duration: 1500 }
            );
          }
        } catch {
          // ignore parse errors
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
        if (mounted) {
          if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
          reconnectTimeout.current = setTimeout(connect, 5000);
        }
      };
    };

    // Only connect if user is authenticated
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (data.user && data.user.termsAccepted && mounted) {
          connect();
        }
      })
      .catch(() => {});

    return () => {
      mounted = false;
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      if (eventSourceRef.current) eventSourceRef.current.close();
    };
  }, [router, pathname]);

  return null;
}
