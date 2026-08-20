'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AuroraBackground } from '@/components/aurora-background';
import { AppHeader } from '@/components/app-header';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';

interface VerifRequest {
  id: number;
  userId: number;
  status: string;
  photoUrl: string;
  submittedAt: string;
  user: { id: number; name: string | null; username: string | null; email: string; photos: string | null };
}

export default function AdminVerificationsPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<VerifRequest[]>([]);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        setAuthChecked(true);
        if (!data.user) { router.push('/auth'); return; }
        if (!['admin', 'super_admin', 'moderator'].includes(data.user.role)) {
          toast.error('Access denied');
          router.push('/discover');
          return;
        }
        setIsAdmin(true);
        loadRequests();
      });
  }, [router]);

  const loadRequests = async () => {
    try {
      const res = await fetch('/api/admin?section=verifications');
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      }
    } catch {
      toast.error('Failed to load');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (userId: number, action: string) => {
    setActionLoading(userId);
    try {
      const res = await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verUserId: userId, action }),
      });
      if (res.ok) {
        toast.success(action === 'approve_verification' ? 'User verified!' : 'Verification rejected', { duration: 2000 });
        loadRequests();
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

  return (
    <AuroraBackground>
      <div className="min-h-screen flex flex-col px-4 py-5">
        <div className="max-w-5xl mx-auto w-full">
          <AppHeader title="Verifications" showBack backHref="/admin" onLogout={handleLogout} />
        </div>

        <div className="max-w-5xl mx-auto w-full flex-1">
          {requests.length === 0 ? (
            <div className="text-center py-20">
              <CheckCircle2 className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No pending verifications</p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((req, i) => {
                const userPhotos = req.user.photos ? JSON.parse(req.user.photos) : [];
                return (
                  <div key={req.id} className="rounded-2xl border border-border/50 bg-card p-4 shadow-sm animate-fade-in-up" style={{ animationDelay: `${i * 30}ms` }}>
                    <div className="flex gap-4">
                      {/* Verification photo */}
                      <div className="h-32 w-32 rounded-xl overflow-hidden border border-border/30 flex-shrink-0">
                        <img src={req.photoUrl} alt="Verification" className="h-full w-full object-cover" />
                      </div>
                      {/* Profile photos */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm">{req.user.name || 'Unknown'}</h3>
                        <p className="text-xs text-muted-foreground">@{req.user.username} · {req.user.email}</p>
                        <p className="text-xs text-muted-foreground mt-1">Submitted {new Date(req.submittedAt).toLocaleDateString()}</p>
                        {userPhotos.length > 0 && (
                          <div className="flex gap-1.5 mt-2">
                            {userPhotos.slice(0, 4).map((p: string, idx: number) => (
                              <div key={idx} className="h-12 w-12 rounded-lg overflow-hidden border border-border/30">
                                <img src={p} alt="" className="h-full w-full object-cover" />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/30">
                      <Button
                        onClick={() => handleAction(req.userId, 'approve_verification')}
                        className="rounded-xl bg-green-500 text-white hover:bg-green-600"
                        disabled={actionLoading === req.userId}
                      >
                        {actionLoading === req.userId ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                        Approve
                      </Button>
                      <Button
                        onClick={() => handleAction(req.userId, 'reject_verification')}
                        variant="outline"
                        className="rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10"
                        disabled={actionLoading === req.userId}
                      >
                        <XCircle className="h-4 w-4" />
                        Reject
                      </Button>
                    </div>
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
