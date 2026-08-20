'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuroraBackground } from '@/components/aurora-background';
import { AppHeader } from '@/components/app-header';
import { Loader2, Heart, MessageSquare, Eye, Sparkles, Star, Zap } from 'lucide-react';

interface Stats {
  likesGiven: number;
  matches: number;
  messages: number;
  profileViews: number;
  stories: number;
  superLikesGiven: number;
  recentViews: number;
  recentLikes: number;
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (!data.user) { router.push('/auth'); return; }
        loadStats();
      });
  }, [router]);

  const loadStats = async () => {
    try {
      const res = await fetch('/api/analytics');
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
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

  const cards = [
    { label: 'Likes Sent', value: stats?.likesGiven || 0, icon: Heart, color: 'text-rose-500 bg-rose-500/10' },
    { label: 'Matches', value: stats?.matches || 0, icon: Sparkles, color: 'text-green-500 bg-green-500/10' },
    { label: 'Messages', value: stats?.messages || 0, icon: MessageSquare, color: 'text-blue-500 bg-blue-500/10' },
    { label: 'Profile Views', value: stats?.profileViews || 0, icon: Eye, color: 'text-amber-500 bg-amber-500/10' },
    { label: 'Super Likes', value: stats?.superLikesGiven || 0, icon: Star, color: 'text-purple-500 bg-purple-500/10' },
    { label: 'Stories', value: stats?.stories || 0, icon: Zap, color: 'text-cyan-500 bg-cyan-500/10' },
  ];

  return (
    <AuroraBackground>
      <div className="min-h-screen flex flex-col px-4 py-5">
        <div className="max-w-3xl mx-auto w-full">
          <AppHeader title="Your Activity" showBack backHref="/settings" onLogout={handleLogout} />
        </div>

        <div className="max-w-3xl mx-auto w-full flex-1">
          {/* Weekly summary */}
          <div className="rounded-2xl border border-border/50 glass p-5 mb-4 animate-fade-in-up">
            <h2 className="text-sm font-semibold text-muted-foreground mb-3">This Week</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-secondary/50 p-4 text-center">
                <p className="text-2xl font-bold text-primary">{stats?.recentLikes || 0}</p>
                <p className="text-xs text-muted-foreground">New Likes Received</p>
              </div>
              <div className="rounded-xl bg-secondary/50 p-4 text-center">
                <p className="text-2xl font-bold text-primary">{stats?.recentViews || 0}</p>
                <p className="text-xs text-muted-foreground">Profile Views</p>
              </div>
            </div>
          </div>

          {/* All-time stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {cards.map((card, i) => (
              <div
                key={card.label}
                className="rounded-2xl border border-border/50 glass p-5 animate-fade-in-up"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.color} mb-3`}>
                  <card.icon className="h-5 w-5" />
                </div>
                <p className="text-2xl font-bold">{card.value}</p>
                <p className="text-xs text-muted-foreground">{card.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AuroraBackground>
  );
}
