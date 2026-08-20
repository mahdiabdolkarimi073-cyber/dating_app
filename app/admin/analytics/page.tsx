'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AuroraBackground } from '@/components/aurora-background';
import { AppHeader } from '@/components/app-header';
import { Loader2, Users, Crown, Heart, MessageSquare, Sparkles, TrendingUp, BarChart3, CheckCircle2 } from 'lucide-react';

interface AdminStats {
  overview: {
    totalUsers: number;
    activeUsers: number;
    premiumUsers: number;
    verifiedUsers: number;
    totalLikes: number;
    totalMatches: number;
    totalMessages: number;
    totalStories: number;
    activeBoosts: number;
    pendingReports: number;
    pendingVerifications: number;
  };
  retention: { dau: number; wau: number; mau: number };
  rates: {
    newUsersThisWeek: number;
    profileCompletionRate: number;
    likeToMatchRate: number;
    matchToMessageRate: number;
    premiumConversionRate: number;
  };
  chart: { dailyRegistrations: { date: string; count: number }[] };
}

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AdminStats | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => {
        setAuthChecked(true);
        if (!d.user) { router.push('/auth'); return; }
        if (!['admin', 'super_admin', 'moderator'].includes(d.user.role)) {
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
      const res = await fetch('/api/admin/analytics');
      if (res.ok) {
        setData(await res.json());
      }
    } catch {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
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

  if (!isAdmin || !data) return null;

  const overviewCards = [
    { label: 'Total Users', value: data.overview.totalUsers, icon: Users, color: 'text-blue-500 bg-blue-500/10' },
    { label: 'Active Users', value: data.overview.activeUsers, icon: CheckCircle2, color: 'text-green-500 bg-green-500/10' },
    { label: 'Premium', value: data.overview.premiumUsers, icon: Crown, color: 'text-amber-500 bg-amber-500/10' },
    { label: 'Verified', value: data.overview.verifiedUsers, icon: CheckCircle2, color: 'text-primary bg-primary/10' },
    { label: 'Total Likes', value: data.overview.totalLikes, icon: Heart, color: 'text-rose-500 bg-rose-500/10' },
    { label: 'Matches', value: data.overview.totalMatches, icon: Sparkles, color: 'text-green-500 bg-green-500/10' },
    { label: 'Messages', value: data.overview.totalMessages, icon: MessageSquare, color: 'text-cyan-500 bg-cyan-500/10' },
    { label: 'Stories', value: data.overview.totalStories, icon: BarChart3, color: 'text-purple-500 bg-purple-500/10' },
    { label: 'Active Boosts', value: data.overview.activeBoosts, icon: TrendingUp, color: 'text-orange-500 bg-orange-500/10' },
    { label: 'Pending Reports', value: data.overview.pendingReports, icon: BarChart3, color: 'text-destructive bg-destructive/10' },
    { label: 'Pending Verifications', value: data.overview.pendingVerifications, icon: CheckCircle2, color: 'text-amber-500 bg-amber-500/10' },
  ];

  const rateCards = [
    { label: 'New Users (7d)', value: data.rates.newUsersThisWeek, suffix: '' },
    { label: 'Profile Completion', value: data.rates.profileCompletionRate.toFixed(1), suffix: '%' },
    { label: 'Like to Match', value: data.rates.likeToMatchRate.toFixed(1), suffix: '%' },
    { label: 'Match to Message', value: data.rates.matchToMessageRate.toFixed(1), suffix: '%' },
    { label: 'Premium Conversion', value: data.rates.premiumConversionRate.toFixed(1), suffix: '%' },
  ];

  const maxReg = Math.max(...data.chart.dailyRegistrations.map((d) => d.count), 1);

  return (
    <AuroraBackground>
      <div className="min-h-screen flex flex-col px-4 py-5">
        <div className="max-w-5xl mx-auto w-full">
          <AppHeader title="Analytics" showBack backHref="/admin" onLogout={handleLogout} />
        </div>

        <div className="max-w-5xl mx-auto w-full flex-1 space-y-6">
          {/* Overview cards */}
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground mb-3">Overview</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {overviewCards.map((card, i) => (
                <div key={card.label} className="rounded-2xl border border-border/50 glass p-4 animate-fade-in-up" style={{ animationDelay: `${i * 30}ms` }}>
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${card.color} mb-2`}>
                    <card.icon className="h-4 w-4" />
                  </div>
                  <p className="text-xl font-bold">{card.value}</p>
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Retention */}
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground mb-3">User Retention</h2>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-border/50 glass p-5 text-center animate-fade-in-up">
                <p className="text-3xl font-bold text-primary">{data.retention.dau}</p>
                <p className="text-xs text-muted-foreground mt-1">Daily Active</p>
              </div>
              <div className="rounded-2xl border border-border/50 glass p-5 text-center animate-fade-in-up" style={{ animationDelay: '50ms' }}>
                <p className="text-3xl font-bold text-primary">{data.retention.wau}</p>
                <p className="text-xs text-muted-foreground mt-1">Weekly Active</p>
              </div>
              <div className="rounded-2xl border border-border/50 glass p-5 text-center animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                <p className="text-3xl font-bold text-primary">{data.retention.mau}</p>
                <p className="text-xs text-muted-foreground mt-1">Monthly Active</p>
              </div>
            </div>
          </div>

          {/* Conversion rates */}
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground mb-3">Conversion Rates</h2>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {rateCards.map((card, i) => (
                <div key={card.label} className="rounded-2xl border border-border/50 glass p-4 text-center animate-fade-in-up" style={{ animationDelay: `${i * 30}ms` }}>
                  <p className="text-xl font-bold">{card.value}{card.suffix}</p>
                  <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Registration chart */}
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground mb-3">Registrations (Last 7 Days)</h2>
            <div className="rounded-2xl border border-border/50 glass p-5">
              <div className="flex items-end justify-between gap-2 h-40">
                {data.chart.dailyRegistrations.map((day, i) => (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-2 animate-fade-in-up" style={{ animationDelay: `${i * 50}ms` }}>
                    <span className="text-xs font-medium">{day.count}</span>
                    <div
                      className="w-full rounded-t-lg bg-gradient-romance transition-all"
                      style={{ height: `${(day.count / maxReg) * 100}%`, minHeight: '4px' }}
                    />
                    <span className="text-[10px] text-muted-foreground">{new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuroraBackground>
  );
}
