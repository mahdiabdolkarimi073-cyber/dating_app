'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Heart,
  X,
  LogOut,
  Sparkles,
  AtSign,
  Star,
  MessagesSquare,
  Crown,
  Bot,
  Bell,
  ArrowLeft,
  Settings,
  Shield,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AppNotification {
  id: number;
  type: string;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

interface AppHeaderProps {
  title?: string;
  showBack?: boolean;
  backHref?: string;
  likeCount?: number;
  onLogout?: () => void;
  isAdmin?: boolean;
}

const notifIcons: Record<string, { icon: typeof Heart; color: string }> = {
  like: { icon: Heart, color: 'text-primary' },
  like_request: { icon: Heart, color: 'text-primary' },
  match: { icon: Heart, color: 'text-success' },
  message: { icon: MessagesSquare, color: 'text-accent' },
  story: { icon: Star, color: 'text-warning' },
  premium: { icon: Crown, color: 'text-warning' },
  system: { icon: Bell, color: 'text-muted-foreground' },
  report: { icon: Shield, color: 'text-destructive' },
};

function formatNotifTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  if (diffMin < 1) return 'now';
  if (diffMin < 60) return `${diffMin}m`;
  if (diffHr < 24) return `${diffHr}h`;
  if (diffDay < 7) return `${diffDay}d`;
  return date.toLocaleDateString();
}

export function AppHeader({ title, showBack, backHref, likeCount = 0, onLogout, isAdmin }: AppHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifPanel(false);
      }
    };
    if (showNotifPanel) {
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }
  }, [showNotifPanel]);

  const loadNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {
      // silent
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // silent
    }
  };

  const handleNotifClick = async (notif: AppNotification) => {
    if (!notif.read) {
      try {
        await fetch('/api/notifications', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: notif.id }),
        });
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch {
        // silent
      }
    }
    if (notif.link) {
      router.push(notif.link);
      setShowNotifPanel(false);
    }
  };

  const handleLogout = async () => {
    if (onLogout) {
      onLogout();
      return;
    }
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/auth');
  };

  return (
    <div className="w-full flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        {showBack && (
          <Button
            onClick={() => (backHref ? router.push(backHref) : router.back())}
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <div className="inline-flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-warm shadow-lg shadow-primary/25">
            {title === 'Premium' ? (
              <Crown className="h-4 w-4 text-white" />
            ) : title === 'Matches' ? (
              <MessagesSquare className="h-4 w-4 text-white" />
            ) : title === 'Likes' ? (
              <Heart className="h-4 w-4 text-white" />
            ) : (
              <Heart className="h-4 w-4 text-white fill-white" />
            )}
          </div>
          <span className="text-xl font-bold tracking-tight">{title || 'Amori'}</span>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {/* Notification Center */}
        <div ref={notifRef} className="relative">
          <Button
            onClick={() => setShowNotifPanel(!showNotifPanel)}
            variant="ghost"
            size="sm"
            className="relative text-muted-foreground hover:text-primary transition-colors"
            title="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white animate-scale-in">
                {unreadCount}
              </span>
            )}
          </Button>

          {showNotifPanel && (
            <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl border border-border/50 glass-strong shadow-2xl shadow-primary/10 z-50 animate-scale-in overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
                <h3 className="text-sm font-semibold">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    <Check className="h-3 w-3" />
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-12 text-center">
                    <Bell className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((notif) => {
                    const cfg = notifIcons[notif.type] || notifIcons.system;
                    const Icon = cfg.icon;
                    return (
                      <button
                        key={notif.id}
                        onClick={() => handleNotifClick(notif)}
                        className={cn(
                          'w-full flex items-start gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors text-left border-b border-border/30 last:border-0',
                          !notif.read && 'bg-primary/5'
                        )}
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 flex-shrink-0 mt-0.5">
                          <Icon className={cn('h-4 w-4', cfg.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{notif.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">{notif.body}</p>
                          <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                            {formatNotifTime(notif.createdAt)}
                          </p>
                        </div>
                        {!notif.read && (
                          <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Navigation icons */}
        {pathname !== '/discover' && (
          <Button
            onClick={() => router.push('/discover')}
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-primary transition-colors"
            title="Discover"
          >
            <Heart className="h-5 w-5" />
          </Button>
        )}
        {pathname !== '/matchmaker' && (
          <Button
            onClick={() => router.push('/matchmaker')}
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-primary transition-colors"
            title="AI Matchmaker"
          >
            <Bot className="h-5 w-5" />
          </Button>
        )}
        {pathname !== '/likes' && (
          <Button
            onClick={() => router.push('/likes')}
            variant="ghost"
            size="sm"
            className="relative text-muted-foreground hover:text-primary transition-colors"
            title="Likes"
          >
            <Heart className="h-5 w-5" />
            {likeCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white animate-scale-in">
                {likeCount}
              </span>
            )}
          </Button>
        )}
        {pathname !== '/matches' && (
          <Button
            onClick={() => router.push('/matches')}
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-primary transition-colors"
            title="Matches"
          >
            <MessagesSquare className="h-5 w-5" />
          </Button>
        )}
        {pathname !== '/premium' && (
          <Button
            onClick={() => router.push('/premium')}
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-warning transition-colors"
            title="Premium"
          >
            <Crown className="h-5 w-5" />
          </Button>
        )}
        {isAdmin && pathname !== '/admin' && (
          <Button
            onClick={() => router.push('/admin')}
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-primary transition-colors"
            title="Admin Panel"
          >
            <Shield className="h-5 w-5" />
          </Button>
        )}
        <Button
          onClick={() => router.push('/settings')}
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground transition-colors"
          title="Settings"
        >
          <Settings className="h-5 w-5" />
        </Button>
        <Button
          onClick={handleLogout}
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-destructive transition-colors"
          title="Logout"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
