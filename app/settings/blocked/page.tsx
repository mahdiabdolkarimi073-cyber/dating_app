'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AuroraBackground } from '@/components/aurora-background';
import { Button } from '@/components/ui/button';
import { Loader2, Ban, ArrowLeft, LogOut, Unlock } from 'lucide-react';
import { AppHeader } from '@/components/app-header';

interface BlockedUser {
  id: number;
  name: string | null;
  username: string | null;
  photo: string | null;
  blockedAt: string;
}

export default function BlockedUsersPage() {
  const router = useRouter();
  const [blocked, setBlocked] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [unblocking, setUnblocking] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        setAuthChecked(true);
        if (!data.user) {
          router.push('/auth');
          return;
        }
        loadBlocked();
      });
  }, [router]);

  const loadBlocked = async () => {
    try {
      const res = await fetch('/api/block');
      if (res.ok) {
        const data = await res.json();
        setBlocked(data.blocked || []);
      }
    } catch {
      toast.error('Failed to load blocked users');
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async (userId: number) => {
    setUnblocking(userId);
    try {
      const res = await fetch(`/api/block?userId=${userId}`, { method: 'DELETE' });
      if (res.ok) {
        setBlocked((prev) => prev.filter((u) => u.id !== userId));
        toast.success('User unblocked', { duration: 1500 });
      } else {
        toast.error('Failed to unblock');
      }
    } catch {
      toast.error('Failed to unblock');
    } finally {
      setUnblocking(null);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/auth');
  };

  if (!authChecked || loading) {
    return (
      <AuroraBackground>
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AuroraBackground>
    );
  }

  return (
    <AuroraBackground>
      <div className="min-h-screen flex flex-col px-4 py-5">
        <div className="max-w-3xl mx-auto w-full">
          <AppHeader title="Blocked Users" showBack backHref="/settings" onLogout={handleLogout} />
        </div>

        <div className="max-w-3xl mx-auto w-full flex-1">
          {blocked.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center gap-4 py-20">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 animate-pulse-glow">
                <Ban className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-1">No blocked users</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  When you block someone, they'll appear here. You can unblock them anytime.
                </p>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4 animate-fade-in">
                {blocked.length} blocked {blocked.length === 1 ? 'user' : 'users'}
              </p>
              <div className="space-y-2">
                {blocked.map((user, i) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-4 rounded-2xl border border-border/50 bg-card p-3 shadow-lg shadow-primary/5 animate-fade-in-up"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <div className="relative h-12 w-12 rounded-full overflow-hidden border-2 border-border/30 flex-shrink-0">
                      {user.photo ? (
                        <img src={user.photo} alt={user.name || 'User'} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-gradient-warm">
                          <span className="text-sm font-bold text-white">
                            {user.name?.[0]?.toUpperCase() || '?'}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{user.name}</h3>
                      <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                    </div>
                    <Button
                      onClick={() => handleUnblock(user.id)}
                      variant="outline"
                      size="sm"
                      className="rounded-xl border-primary/30 hover:border-primary hover:bg-primary/10 transition-all"
                      disabled={unblocking === user.id}
                    >
                      {unblocking === user.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Unlock className="h-4 w-4 text-primary" />
                          Unblock
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </AuroraBackground>
  );
}
