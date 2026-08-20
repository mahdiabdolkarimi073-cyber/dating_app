'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AuroraBackground } from '@/components/aurora-background';
import { Button } from '@/components/ui/button';
import { Loader2, Shield, ArrowLeft, LogOut, AlertTriangle, CheckCircle2, Flag } from 'lucide-react';
import { AppHeader } from '@/components/app-header';
import { cn } from '@/lib/utils';

interface FlaggedUser {
  id: number;
  name: string | null;
  username: string | null;
  moderationFlag: string | null;
  flaggedAt: string | null;
}

interface ModLog {
  id: number;
  userId: number;
  field: string;
  reason: string;
  details: string | null;
  status: string;
  createdAt: string;
  user: { id: number; name: string | null; username: string | null };
}

export default function AdminModerationPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [flaggedUsers, setFlaggedUsers] = useState<FlaggedUser[]>([]);
  const [logs, setLogs] = useState<ModLog[]>([]);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        setAuthChecked(true);
        if (!data.user) {
          router.push('/auth');
          return;
        }
        if (!['admin', 'super_admin', 'moderator'].includes(data.user.role)) {
          toast.error('Access denied');
          router.push('/discover');
          return;
        }
        setIsAdmin(true);
        loadData();
      });
  }, [router]);

  const loadData = async () => {
    try {
      const res = await fetch('/api/admin?section=moderation');
      if (res.ok) {
        const data = await res.json();
        setFlaggedUsers(data.flaggedUsers || []);
        setLogs(data.logs || []);
      }
    } catch {
      toast.error('Failed to load moderation data');
    } finally {
      setLoading(false);
    }
  };

  const handleClearFlag = async (userId: number) => {
    setActionLoading(userId);
    try {
      const res = await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'clearFlag' }),
      });
      if (res.ok) {
        toast.success('Flag cleared', { duration: 1500 });
        loadData();
      } else {
        toast.error('Failed');
      }
    } catch {
      toast.error('Failed');
    } finally {
      setActionLoading(null);
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

  if (!isAdmin) return null;

  const flagColors: Record<string, string> = {
    spam: 'text-amber-500 bg-amber-500/10',
    suspicious: 'text-blue-500 bg-blue-500/10',
    fake: 'text-destructive bg-destructive/10',
    inappropriate: 'text-destructive bg-destructive/10',
  };

  return (
    <AuroraBackground>
      <div className="min-h-screen flex flex-col px-4 py-5">
        <div className="max-w-5xl mx-auto w-full">
          <AppHeader title="Moderation" showBack backHref="/admin" onLogout={handleLogout} />
        </div>

        <div className="max-w-5xl mx-auto w-full flex-1 space-y-6">
          {/* Flagged users */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <h2 className="text-sm font-semibold">Flagged Users ({flaggedUsers.length})</h2>
            </div>
            {flaggedUsers.length === 0 ? (
              <div className="rounded-2xl border border-border/50 glass p-6 text-center">
                <CheckCircle2 className="h-8 w-8 text-green-500/50 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No flagged users. All clear!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {flaggedUsers.map((user, i) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 rounded-2xl border border-border/50 bg-card p-3 shadow-sm animate-fade-in-up"
                    style={{ animationDelay: `${i * 30}ms` }}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-romance flex-shrink-0">
                      <span className="text-sm font-bold text-white">
                        {user.name?.[0]?.toUpperCase() || '?'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate text-sm">{user.name || 'Unknown'}</h3>
                      <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                    </div>
                    {user.moderationFlag && (
                      <span className={cn('text-[10px] font-medium px-2 py-1 rounded-full', flagColors[user.moderationFlag])}>
                        {user.moderationFlag}
                      </span>
                    )}
                    <Button
                      onClick={() => handleClearFlag(user.id)}
                      variant="outline"
                      size="sm"
                      className="rounded-xl"
                      disabled={actionLoading === user.id}
                    >
                      {actionLoading === user.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Clear flag'}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Moderation logs */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Shield className="h-5 w-5 text-primary" />
              <h2 className="text-sm font-semibold">Activity Log ({logs.length})</h2>
            </div>
            {logs.length === 0 ? (
              <div className="rounded-2xl border border-border/50 glass p-6 text-center">
                <p className="text-sm text-muted-foreground">No moderation activity yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {logs.slice(0, 30).map((log, i) => (
                  <div
                    key={log.id}
                    className="flex items-center gap-3 rounded-xl border border-border/30 bg-card/50 p-3 animate-fade-in-up"
                    style={{ animationDelay: `${i * 20}ms` }}
                  >
                    <Flag className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">
                        <span className="font-medium">{log.user.name || 'Unknown'}</span>
                        <span className="text-muted-foreground"> · {log.field} · {log.reason}</span>
                      </p>
                      {log.details && (
                        <p className="text-xs text-muted-foreground truncate">{log.details}</p>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground flex-shrink-0">
                      {new Date(log.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AuroraBackground>
  );
}
