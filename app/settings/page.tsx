'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AuroraBackground } from '@/components/aurora-background';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Loader2, Shield, Eye, Clock, Ban, ArrowLeft, LogOut, User, Bell, Globe, Trash2, Crown, CheckCircle2, AlertTriangle, Pencil, BarChart3 } from 'lucide-react';
import { AppHeader } from '@/components/app-header';

export default function SettingsPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);
  const [showLastSeen, setShowLastSeen] = useState(true);
  const [showInDiscovery, setShowInDiscovery] = useState(true);
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [verification, setVerification] = useState('none');
  const [saving, setSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        setAuthChecked(true);
        if (!data.user) {
          router.push('/auth');
          return;
        }
        if (!data.user.termsAccepted) {
          router.push('/onboarding');
          return;
        }
        loadSettings();
      });
  }, [router]);

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/privacy');
      if (res.ok) {
        const data = await res.json();
        setShowOnlineStatus(data.showOnlineStatus);
        setShowLastSeen(data.showLastSeen);
        setShowInDiscovery(data.showInDiscovery);
        setOnlyVerified(data.onlyVerified);
        setVerification(data.verification);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (field: string, value: boolean) => {
    setSaving(true);
    try {
      const res = await fetch('/api/privacy', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });
      if (res.ok) {
        if (field === 'showOnlineStatus') setShowOnlineStatus(value);
        if (field === 'showLastSeen') setShowLastSeen(value);
        if (field === 'showInDiscovery') setShowInDiscovery(value);
        if (field === 'onlyVerified') setOnlyVerified(value);
      } else {
        toast.error('Failed to update setting');
      }
    } catch {
      toast.error('Failed to update setting');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/auth');
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch('/api/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: deletePassword, confirm: true }),
      });
      if (res.ok) {
        toast.success('Account scheduled for deletion. You have 30 days to cancel.');
        router.push('/auth');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed');
      }
    } catch {
      toast.error('Failed');
    } finally {
      setDeleting(false);
    }
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
          <AppHeader title="Settings" showBack backHref="/discover" onLogout={handleLogout} />
        </div>

        <div className="max-w-3xl mx-auto w-full flex-1">
          <div className="space-y-4">
            {/* Account section */}
            <div className="rounded-2xl border border-border/50 glass p-5 animate-fade-in-up">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <h2 className="text-sm font-semibold text-muted-foreground">Account</h2>
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => router.push('/settings/edit')}
                  className="w-full flex items-center gap-3 rounded-xl p-3 hover:bg-secondary/50 transition-colors text-left"
                >
                  <Pencil className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Edit Profile</p>
                    <p className="text-xs text-muted-foreground">Name, bio, photos, interests</p>
                  </div>
                  <ArrowLeft className="h-4 w-4 text-muted-foreground rotate-180" />
                </button>
                <button
                  onClick={() => router.push('/settings/verify')}
                  className="w-full flex items-center gap-3 rounded-xl p-3 hover:bg-secondary/50 transition-colors text-left"
                >
                  <CheckCircle2 className={`h-4 w-4 ${verification === 'verified' ? 'text-green-500' : 'text-muted-foreground'}`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium flex items-center gap-2">
                      Verification
                      {verification === 'verified' && <span className="text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">Verified</span>}
                      {verification === 'pending' && <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">Pending</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">Get a verified badge</p>
                  </div>
                  <ArrowLeft className="h-4 w-4 text-muted-foreground rotate-180" />
                </button>
                <button
                  onClick={() => router.push('/settings/analytics')}
                  className="w-full flex items-center gap-3 rounded-xl p-3 hover:bg-secondary/50 transition-colors text-left"
                >
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Your Activity</p>
                    <p className="text-xs text-muted-foreground">Likes, matches, views</p>
                  </div>
                  <ArrowLeft className="h-4 w-4 text-muted-foreground rotate-180" />
                </button>
                <button
                  onClick={() => router.push('/premium')}
                  className="w-full flex items-center gap-3 rounded-xl p-3 hover:bg-secondary/50 transition-colors text-left"
                >
                  <Crown className="h-4 w-4 text-amber-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Premium</p>
                    <p className="text-xs text-muted-foreground">Upgrade your experience</p>
                  </div>
                  <ArrowLeft className="h-4 w-4 text-muted-foreground rotate-180" />
                </button>
              </div>
            </div>

            {/* Privacy & Discovery section */}
            <div className="rounded-2xl border border-border/50 glass p-5 animate-fade-in-up" style={{ animationDelay: '50ms' }}>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <Shield className="h-4 w-4 text-primary" />
                </div>
                <h2 className="text-sm font-semibold text-muted-foreground">Privacy & Discovery</h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                      <Eye className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Online Status</p>
                      <p className="text-xs text-muted-foreground">Show when you're active</p>
                    </div>
                  </div>
                  <Switch checked={showOnlineStatus} onCheckedChange={(v) => handleToggle('showOnlineStatus', v)} disabled={saving} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Last Seen</p>
                      <p className="text-xs text-muted-foreground">Show when you were last active</p>
                    </div>
                  </div>
                  <Switch checked={showLastSeen} onCheckedChange={(v) => handleToggle('showLastSeen', v)} disabled={saving} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Show me in Discovery</p>
                      <p className="text-xs text-muted-foreground">Pause to hide from new suggestions</p>
                    </div>
                  </div>
                  <Switch checked={showInDiscovery} onCheckedChange={(v) => handleToggle('showInDiscovery', v)} disabled={saving} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Only show verified users</p>
                      <p className="text-xs text-muted-foreground">See verified profiles only</p>
                    </div>
                  </div>
                  <Switch checked={onlyVerified} onCheckedChange={(v) => handleToggle('onlyVerified', v)} disabled={saving} />
                </div>
              </div>
            </div>

            {/* Blocked users */}
            <button
              onClick={() => router.push('/settings/blocked')}
              className="w-full rounded-2xl border border-border/50 glass p-5 hover:border-primary/30 transition-all animate-fade-in-up text-left"
              style={{ animationDelay: '100ms' }}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10">
                  <Ban className="h-5 w-5 text-destructive" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Blocked Users</p>
                  <p className="text-xs text-muted-foreground">Manage your blocked list</p>
                </div>
                <ArrowLeft className="h-4 w-4 text-muted-foreground rotate-180" />
              </div>
            </button>

            {/* Danger zone */}
            <div className="rounded-2xl border border-destructive/30 glass p-5 animate-fade-in-up" style={{ animationDelay: '150ms' }}>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                </div>
                <h2 className="text-sm font-semibold text-destructive">Danger Zone</h2>
              </div>
              <Button
                onClick={() => setShowDeleteDialog(true)}
                variant="outline"
                className="w-full rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
                Delete Account
              </Button>
            </div>
          </div>
        </div>

        {/* Delete dialog */}
        {showDeleteDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in" onClick={() => setShowDeleteDialog(false)}>
            <div className="glass-strong rounded-2xl border border-border/50 shadow-2xl p-6 max-w-sm mx-4 animate-scale-in" onClick={(e) => e.stopPropagation()}>
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 mx-auto mb-4">
                <Trash2 className="h-7 w-7 text-destructive" />
              </div>
              <h3 className="text-lg font-bold text-center mb-2">Delete Account?</h3>
              <p className="text-sm text-muted-foreground text-center mb-4">
                Your account will be deactivated for 30 days, then permanently deleted. Enter your password to confirm.
              </p>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Password"
                className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm mb-4 outline-none focus:border-primary"
              />
              <div className="flex flex-col gap-2">
                <Button onClick={handleDelete} disabled={deleting} className="rounded-xl bg-destructive text-white hover:bg-destructive/90">
                  {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete Account'}
                </Button>
                <Button onClick={() => setShowDeleteDialog(false)} variant="ghost" className="rounded-xl">
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuroraBackground>
  );
}
