'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AuroraBackground } from '@/components/aurora-background';
import { Button } from '@/components/ui/button';
import { Heart, X, Loader2, LogOut, ArrowLeft, MessagesSquare, Sparkles, AtSign, Crown } from 'lucide-react';
import { AppHeader } from '@/components/app-header';

interface LikeUser {
  id: number;
  name: string | null;
  username: string | null;
  birthDate: string | null;
  gender: string | null;
  bio: string | null;
  interests: string[];
  photos: string[];
}

const INTEREST_EMOJIS: Record<string, { label: string; emoji: string }> = {
  travel: { label: 'Travel', emoji: '✈️' },
  music: { label: 'Music', emoji: '🎵' },
  foodie: { label: 'Foodie', emoji: '🍽️' },
  fitness: { label: 'Fitness', emoji: '💪' },
  movies: { label: 'Movies', emoji: '🎬' },
  gaming: { label: 'Gaming', emoji: '🎮' },
  photography: { label: 'Photography', emoji: '📷' },
  reading: { label: 'Reading', emoji: '📚' },
  art: { label: 'Art', emoji: '🎨' },
  coffee: { label: 'Coffee', emoji: '☕' },
  hiking: { label: 'Hiking', emoji: '🥾' },
  dancing: { label: 'Dancing', emoji: '💃' },
  cooking: { label: 'Cooking', emoji: '👨‍🍳' },
  tech: { label: 'Tech', emoji: '💻' },
  fashion: { label: 'Fashion', emoji: '👗' },
  yoga: { label: 'Yoga', emoji: '🧘' },
  pets: { label: 'Pets', emoji: '🐾' },
  nature: { label: 'Nature', emoji: '🌿' },
  sports: { label: 'Sports', emoji: '⚽' },
  nightlife: { label: 'Nightlife', emoji: '🌙' },
  writing: { label: 'Writing', emoji: '✍️' },
  languages: { label: 'Languages', emoji: '🌍' },
  volunteering: { label: 'Volunteering', emoji: '🤝' },
  spirituality: { label: 'Spirituality', emoji: '🕊️' },
};

function calculateAge(birthDate: string | null): number | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age >= 0 ? age : null;
}

export default function LikesPage() {
  const router = useRouter();
  const [likes, setLikes] = useState<LikeUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
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
        if (!data.user.termsAccepted) {
          router.push('/onboarding');
          return;
        }
        loadLikes();
      });
  }, [router]);

  const loadLikes = async () => {
    try {
      const res = await fetch('/api/likes');
      const data = await res.json();
      if (res.ok) {
        setLikes(data.likes);
      }
    } catch {
      toast.error('Failed to load likes');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (userId: number) => {
    setActionLoading(userId);
    try {
      const res = await fetch('/api/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toUserId: userId }),
      });
      const data = await res.json();
      if (data.matched) {
        toast.success("It's a match!", {
          description: 'You can now start chatting',
        });
      } else if (res.ok) {
        toast.success('Like sent');
      } else {
        toast.error(data.error || 'Failed to accept');
      }
      setLikes((prev) => prev.filter((u) => u.id !== userId));
    } catch {
      toast.error('Something went wrong');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (userId: number) => {
    setActionLoading(userId);
    try {
      const res = await fetch('/api/pass', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toUserId: userId }),
      });
      if (res.ok) {
        toast.success('Request dismissed', { duration: 1500 });
        setLikes((prev) => prev.filter((u) => u.id !== userId));
      } else {
        toast.error('Failed to dismiss');
      }
    } catch {
      toast.error('Something went wrong');
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
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground text-sm">Loading likes...</p>
          </div>
        </div>
      </AuroraBackground>
    );
  }

  return (
    <AuroraBackground>
      <div className="min-h-screen flex flex-col px-4 py-5">
        {/* Header */}
        <div className="max-w-5xl mx-auto w-full">
          <AppHeader title="Likes" showBack backHref="/discover" onLogout={handleLogout} />
        </div>

        {/* Content */}
        <div className="max-w-5xl mx-auto w-full flex-1">
          {likes.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center gap-4 py-20">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 animate-pulse-glow">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-1">No pending likes</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  When someone likes you, they'll appear here. Keep swiping to find more connections!
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
                {likes.length} {likes.length === 1 ? 'person likes' : 'people like'} you — tap to view their full profile
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {likes.map((user, i) => (
                  <div
                    key={user.id}
                    className="group relative rounded-2xl overflow-hidden border border-border/50 bg-card shadow-xl shadow-primary/5 animate-scale-in"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    {/* Photo */}
                    <div
                      className="relative h-56 cursor-pointer"
                      onClick={() => router.push(`/profile/${user.id}`)}
                    >
                      {user.photos.length > 0 ? (
                        <img
                          src={user.photos[0]}
                          alt={user.name || 'User'}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-gradient-romance">
                          <span className="text-4xl font-bold text-white">
                            {user.name?.[0]?.toUpperCase() || '?'}
                          </span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />

                      {/* Like badge */}
                      <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-primary/90 backdrop-blur-sm px-3 py-1 shadow-lg">
                        <Heart className="h-3.5 w-3.5 text-white fill-white" />
                        <span className="text-xs font-semibold text-white">Likes you</span>
                      </div>

                      {/* Info overlay */}
                      <div className="absolute bottom-0 left-0 right-0 p-4 text-white pointer-events-none">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                          {user.name}
                          {calculateAge(user.birthDate) != null && (
                            <span className="text-sm font-medium text-white/80">
                              {calculateAge(user.birthDate)}
                            </span>
                          )}
                        </h3>
                        <div className="flex items-center gap-1 text-xs text-white/70">
                          <AtSign className="h-3 w-3" />
                          {user.username}
                        </div>
                      </div>
                    </div>

                    {/* Interests preview */}
                    {user.interests.length > 0 && (
                      <div className="px-4 pt-3 pb-1">
                        <div className="flex flex-wrap gap-1.5">
                          {user.interests.slice(0, 3).map((id: string) => {
                            const interest = INTEREST_EMOJIS[id];
                            if (!interest) return null;
                            return (
                              <span
                                key={id}
                                className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-xs font-medium text-primary"
                              >
                                <span>{interest.emoji}</span>
                                {interest.label}
                              </span>
                            );
                          })}
                          {user.interests.length > 3 && (
                            <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
                              +{user.interests.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 p-4">
                      <Button
                        onClick={() => handleReject(user.id)}
                        variant="outline"
                        size="sm"
                        className="flex-1 rounded-xl border-destructive/30 hover:border-destructive hover:bg-destructive/10 transition-all"
                        disabled={actionLoading === user.id}
                      >
                        {actionLoading === user.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <X className="h-4 w-4 text-destructive" />
                            Decline
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => handleAccept(user.id)}
                        size="sm"
                        className="flex-1 rounded-xl bg-gradient-romance text-white shadow-md shadow-primary/20 hover:scale-[1.02] transition-all"
                        disabled={actionLoading === user.id}
                      >
                        {actionLoading === user.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Heart className="h-4 w-4 fill-white" />
                            Accept
                          </>
                        )}
                      </Button>
                    </div>
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
