'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AuroraBackground } from '@/components/aurora-background';
import { Button } from '@/components/ui/button';
import { Loader2, Shield, Users, Heart, MessageSquare, Flag, BarChart3, Crown, LogOut, ArrowLeft, CheckCircle2, TrendingUp } from 'lucide-react';
import { AppHeader } from '@/components/app-header';

interface Stats {
  users: number;
  activeUsers: number;
  matches: number;
  messages: number;
  likes: number;
  reports: number;
  newAccounts: number;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);

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
        loadStats();
      });
  }, [router]);

  const loadStats = async () => {
    try {
      const res = await fetch('/api/admin?section=dashboard');
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      }
    } catch {
      toast.error('Failed to load stats');
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

  if (!isAdmin) return null;

  const cards = [
    { label: 'Total Users', value: stats?.users ?? 0, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Active Users', value: stats?.activeUsers ?? 0, icon: Shield, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: 'Matches', value: stats?.matches ?? 0, icon: Heart, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Messages', value: stats?.messages ?? 0, icon: MessageSquare, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'Likes', value: stats?.likes ?? 0, icon: Heart, color: 'text-rose-500', bg: 'bg-rose-500/10' },
    { label: 'Pending Reports', value: stats?.reports ?? 0, icon: Flag, color: 'text-destructive', bg: 'bg-destructive/10' },
    { label: 'New (7 days)', value: stats?.newAccounts ?? 0, icon: BarChart3, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  ];

  const navItems = [
    { label: 'Users', href: '/admin/users', icon: Users },
    { label: 'Reports', href: '/admin/reports', icon: Flag },
    { label: 'Stories', href: '/admin/stories', icon: Crown },
    { label: 'Moderation', href: '/admin/moderation', icon: Shield },
    { label: 'Verifications', href: '/admin/verifications', icon: CheckCircle2 },
    { label: 'Analytics', href: '/admin/analytics', icon: TrendingUp },
  ];

  return (
    <AuroraBackground>
      <div className="min-h-screen flex flex-col px-4 py-5">
        <div className="max-w-5xl mx-auto w-full">
          <AppHeader title="Admin Panel" showBack backHref="/discover" onLogout={handleLogout} />
        </div>

        <div className="max-w-5xl mx-auto w-full flex-1">
          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
            {cards.map((card, i) => (
              <div
                key={i}
                className="rounded-2xl border border-border/50 glass p-4 animate-fade-in-up"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.bg} mb-3`}>
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </div>
                <p className="text-2xl font-bold">{card.value}</p>
                <p className="text-xs text-muted-foreground">{card.label}</p>
              </div>
            ))}
          </div>

          {/* Navigation */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {navItems.map((item, i) => (
              <button
                key={i}
                onClick={() => router.push(item.href)}
                className="rounded-2xl border border-border/50 glass p-5 hover:border-primary/30 hover:shadow-lg transition-all animate-fade-in-up text-left"
                style={{ animationDelay: `${300 + i * 50}ms` }}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 mb-3">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <p className="text-sm font-semibold">{item.label}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </AuroraBackground>
  );
}
