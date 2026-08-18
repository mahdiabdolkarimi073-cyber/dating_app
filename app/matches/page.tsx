'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AuroraBackground } from '@/components/aurora-background';
import { Button } from '@/components/ui/button';
import { Heart, Loader2, LogOut, ArrowLeft, MessagesSquare, Sparkles, Send, Crown } from 'lucide-react';

interface MatchItem {
  matchId: number;
  createdAt: string;
  user: {
    id: number;
    name: string | null;
    username: string | null;
    photo: string | null;
  };
  lastMessage: {
    content: string;
    senderId: number;
    createdAt: string;
    isMine: boolean;
    read: boolean;
  } | null;
}

function formatTimeAgo(dateString: string): string {
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

export default function MatchesPage() {
  const router = useRouter();
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

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
        loadMatches();
      });
  }, [router]);

  const loadMatches = async () => {
    try {
      const res = await fetch('/api/matches');
      const data = await res.json();
      if (res.ok) {
        setMatches(data.matches);
      }
    } catch {
      toast.error('Failed to load matches');
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
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground text-sm">Loading matches...</p>
          </div>
        </div>
      </AuroraBackground>
    );
  }

  return (
    <AuroraBackground>
      <div className="min-h-screen flex flex-col px-4 py-5">
        {/* Header */}
        <div className="max-w-2xl mx-auto w-full flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <Button
              onClick={() => router.push('/discover')}
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="inline-flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-romance shadow-lg shadow-primary/30">
                <MessagesSquare className="h-4 w-4 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight">Matches</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              onClick={() => router.push('/discover')}
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <Heart className="h-5 w-5" />
            </Button>
            <Button
              onClick={() => router.push('/premium')}
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-amber-500 transition-colors"
            >
              <Crown className="h-5 w-5" />
            </Button>
            <Button
              onClick={handleLogout}
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-destructive transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-2xl mx-auto w-full flex-1">
          {matches.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center gap-4 py-20">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 animate-pulse-glow">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-1">No matches yet</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  When you and another user like each other, you'll match and be able to chat right here.
                </p>
              </div>
              <Button
                onClick={() => router.push('/discover')}
                className="bg-gradient-romance text-white shadow-lg shadow-primary/30 hover:scale-[1.02] transition-all"
              >
                Start Swiping
              </Button>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4 animate-fade-in">
                {matches.length} {matches.length === 1 ? 'match' : 'matches'} — tap to start chatting
              </p>
              <div className="space-y-2">
                {matches.map((match, i) => (
                  <button
                    key={match.matchId}
                    onClick={() => router.push(`/chat/${match.matchId}`)}
                    className="group w-full flex items-center gap-4 rounded-2xl border border-border/50 bg-card p-3 shadow-lg shadow-primary/5 hover:shadow-xl hover:shadow-primary/10 hover:border-primary/30 transition-all duration-300 animate-fade-in-up text-left"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    {/* Avatar */}
                    <div className="relative h-14 w-14 rounded-full overflow-hidden border-2 border-primary/20 group-hover:border-primary/40 transition-colors flex-shrink-0">
                      {match.user.photo ? (
                        <img
                          src={match.user.photo}
                          alt={match.user.name || 'User'}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-gradient-romance">
                          <span className="text-lg font-bold text-white">
                            {match.user.name?.[0]?.toUpperCase() || '?'}
                          </span>
                        </div>
                      )}
                      {/* Match badge */}
                      <div className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-romance border-2 border-card">
                        <Heart className="h-2.5 w-2.5 text-white fill-white" />
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-semibold truncate">{match.user.name}</h3>
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          {match.lastMessage ? formatTimeAgo(match.lastMessage.createdAt) : formatTimeAgo(match.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate mt-0.5">
                        {match.lastMessage ? (
                          <>
                            {match.lastMessage.isMine && 'You: '}
                            {match.lastMessage.content}
                          </>
                        ) : (
                          <span className="text-primary/70 italic">Say hello!</span>
                        )}
                      </p>
                    </div>

                    {/* Unread indicator */}
                    {match.lastMessage && !match.lastMessage.isMine && !match.lastMessage.read && (
                      <div className="flex h-3 w-3 rounded-full bg-primary animate-pulse flex-shrink-0" />
                    )}
                    <Send className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </AuroraBackground>
  );
}
