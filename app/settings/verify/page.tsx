'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AuroraBackground } from '@/components/aurora-background';
import { AppHeader } from '@/components/app-header';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, Clock, XCircle, Camera, Upload } from 'lucide-react';

export default function VerifyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('none');
  const [request, setRequest] = useState<{ id: number; status: string; submittedAt: string; reviewedAt: string | null } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [photoUrl, setPhotoUrl] = useState('');

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (!data.user) { router.push('/auth'); return; }
        loadStatus();
      });
  }, [router]);

  const loadStatus = async () => {
    try {
      const res = await fetch('/api/verify');
      if (res.ok) {
        const data = await res.json();
        setStatus(data.status);
        setRequest(data.request);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!photoUrl) {
      toast.error('Please provide a photo URL');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoUrl }),
      });
      if (res.ok) {
        toast.success('Verification submitted! We will review it shortly.');
        loadStatus();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed');
      }
    } catch {
      toast.error('Failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/auth');
  };

  if (loading) {
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
        <div className="max-w-2xl mx-auto w-full">
          <AppHeader title="Verification" showBack backHref="/settings" onLogout={handleLogout} />
        </div>

        <div className="max-w-2xl mx-auto w-full flex-1">
          {status === 'verified' && (
            <div className="rounded-2xl border border-green-500/30 glass p-8 text-center animate-scale-in">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
              <h2 className="text-lg font-bold mb-2">Verified!</h2>
              <p className="text-sm text-muted-foreground">Your profile has a verified badge. Other users can trust your identity.</p>
            </div>
          )}

          {status === 'pending' && (
            <div className="rounded-2xl border border-amber-500/30 glass p-8 text-center animate-scale-in">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 mx-auto mb-4">
                <Clock className="h-8 w-8 text-amber-500" />
              </div>
              <h2 className="text-lg font-bold mb-2">Under Review</h2>
              <p className="text-sm text-muted-foreground">Your verification request is being reviewed. This usually takes 1-2 business days.</p>
              {request && (
                <p className="text-xs text-muted-foreground mt-3">Submitted on {new Date(request.submittedAt).toLocaleDateString()}</p>
              )}
            </div>
          )}

          {status === 'rejected' && (
            <div className="rounded-2xl border border-destructive/30 glass p-8 text-center animate-scale-in">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 mx-auto mb-4">
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
              <h2 className="text-lg font-bold mb-2">Verification Rejected</h2>
              <p className="text-sm text-muted-foreground mb-4">Your verification was not approved. Please try again with a clearer photo.</p>
            </div>
          )}

          {(status === 'none' || status === 'rejected') && (
            <div className="rounded-2xl border border-border/50 glass p-6 animate-fade-in-up">
              <h2 className="text-base font-semibold mb-2">Get Verified</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Submit a clear selfie photo. Our team will review it and add a verified badge to your profile. Verified users get more matches and trust.
              </p>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Photo URL</label>
                  <input
                    type="text"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    placeholder="Paste a photo URL..."
                    className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm outline-none focus:border-primary"
                  />
                </div>
                <Button
                  onClick={handleSubmit}
                  disabled={submitting || !photoUrl}
                  className="w-full rounded-xl bg-gradient-romance text-white"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  Submit for Review
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AuroraBackground>
  );
}
