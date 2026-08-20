'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AuroraBackground } from '@/components/aurora-background';
import { Button } from '@/components/ui/button';
import { Loader2, Flag, ArrowLeft, LogOut, Check, X, Ban, Shield } from 'lucide-react';
import { AppHeader } from '@/components/app-header';
import { cn } from '@/lib/utils';

interface AdminReport {
  id: number;
  reporterId: number;
  reportedId: number;
  targetType: string;
  targetMessageId: number | null;
  reason: string;
  description: string | null;
  status: string;
  createdAt: string;
  reporter: { id: number; name: string | null; username: string | null };
  reported: { id: number; name: string | null; username: string | null; photos: string | null };
}

export default function AdminReportsPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<AdminReport[]>([]);
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
        loadReports();
      });
  }, [router]);

  const loadReports = async () => {
    try {
      const res = await fetch('/api/admin?section=reports');
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
      }
    } catch {
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (reportId: number, reportedId: number, action: string) => {
    setActionLoading(reportId);
    try {
      if (action === 'ban' || action === 'suspend') {
        await fetch('/api/admin', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: reportedId, action }),
        });
      }
      // Mark report as reviewed
      await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId, action: 'reviewReport' }),
      }).catch(() => {});
      toast.success(`Report ${action === 'ban' ? 'actioned (user banned)' : action === 'suspend' ? 'actioned (user suspended)' : 'dismissed'}`, { duration: 2000 });
      loadReports();
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

  const reasonLabels: Record<string, string> = {
    harassment: 'Harassment',
    fake_profile: 'Fake Profile',
    inappropriate_content: 'Inappropriate Content',
    scam: 'Scam',
    spam: 'Spam',
    other: 'Other',
  };

  const statusColors: Record<string, string> = {
    pending: 'text-amber-500 bg-amber-500/10',
    reviewed: 'text-blue-500 bg-blue-500/10',
    dismissed: 'text-muted-foreground bg-secondary',
    actioned: 'text-green-500 bg-green-500/10',
  };

  return (
    <AuroraBackground>
      <div className="min-h-screen flex flex-col px-4 py-5">
        <div className="max-w-5xl mx-auto w-full">
          <AppHeader title="Reports" showBack backHref="/admin" onLogout={handleLogout} />
        </div>

        <div className="max-w-5xl mx-auto w-full flex-1">
          {reports.length === 0 ? (
            <div className="text-center py-20">
              <Flag className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No reports</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((report, i) => {
                const photos = report.reported.photos ? JSON.parse(report.reported.photos) : [];
                return (
                  <div
                    key={report.id}
                    className="rounded-2xl border border-border/50 bg-card p-4 shadow-sm animate-fade-in-up"
                    style={{ animationDelay: `${i * 30}ms` }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 rounded-full overflow-hidden border-2 border-border/30 flex-shrink-0">
                        {photos[0] ? (
                          <img src={photos[0]} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-gradient-romance">
                            <span className="text-xs font-bold text-white">
                              {report.reported.name?.[0]?.toUpperCase() || '?'}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-sm">{report.reported.name || 'Unknown'}</h3>
                          <span className="text-xs text-muted-foreground">@{report.reported.username}</span>
                          <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full', statusColors[report.status])}>
                            {report.status}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Reported by <span className="font-medium">{report.reporter.name || 'Unknown'}</span> (@{report.reporter.username})
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs font-medium px-2 py-1 rounded-lg bg-destructive/10 text-destructive">
                            {reasonLabels[report.reason] || report.reason}
                          </span>
                          {report.description && (
                            <p className="text-xs text-muted-foreground truncate">"{report.description}"</p>
                          )}
                        </div>
                      </div>
                    </div>
                    {report.status === 'pending' && (
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/30">
                        <Button
                          onClick={() => handleAction(report.id, report.reportedId, 'ban')}
                          variant="outline"
                          size="sm"
                          className="text-destructive border-destructive/30 hover:bg-destructive/10"
                          disabled={actionLoading === report.id}
                        >
                          {actionLoading === report.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
                          Ban user
                        </Button>
                        <Button
                          onClick={() => handleAction(report.id, report.reportedId, 'suspend')}
                          variant="outline"
                          size="sm"
                          className="text-amber-500 border-amber-500/30 hover:bg-amber-500/10"
                          disabled={actionLoading === report.id}
                        >
                          <Shield className="h-4 w-4" />
                          Suspend
                        </Button>
                        <Button
                          onClick={() => handleAction(report.id, report.reportedId, 'dismiss')}
                          variant="ghost"
                          size="sm"
                          disabled={actionLoading === report.id}
                        >
                          <X className="h-4 w-4" />
                          Dismiss
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AuroraBackground>
  );
}
