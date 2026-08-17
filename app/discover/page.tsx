'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AuroraBackground } from '@/components/aurora-background';
import { Button } from '@/components/ui/button';
import { Heart, X, Loader2, LogOut, Sparkles, AtSign, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DiscoverUser {
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

const genderLabels: Record<string, string> = {
  male: 'Male',
  female: 'Female',
  other: 'Other',
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

export default function DiscoverPage() {
  const router = useRouter();
  const [users, setUsers] = useState<DiscoverUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [action, setAction] = useState<'like' | 'pass' | null>(null);
  const [isExiting, setIsExiting] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showInfo, setShowInfo] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
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
          if (!data.user.username) {
            router.push('/onboarding');
          } else if (!data.user.interests) {
            router.push('/onboarding/interests');
          } else if (!data.user.photos) {
            router.push('/onboarding/photos');
          } else {
            router.push('/onboarding/terms');
          }
          return;
        }
        loadUsers();
      });
  }, [router]);

  const loadUsers = async () => {
    try {
      const res = await fetch('/api/discover');
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users);
      }
    } catch {
      toast.error('Failed to load profiles');
    } finally {
      setLoading(false);
    }
  };

  const currentUser = users[currentIndex];

  const handleNextUser = useCallback(() => {
    setAction(null);
    setIsExiting(false);
    setDragOffset({ x: 0, y: 0 });
    setPhotoIndex(0);
    setShowInfo(false);
    setCurrentIndex((prev) => prev + 1);
  }, []);

  const handleLike = async (userId: number) => {
    if (isExiting) return;
    setAction('like');
    setIsExiting(true);

    try {
      const res = await fetch('/api/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toUserId: userId }),
      });
      const data = await res.json();
      if (data.matched) {
        toast.success("It's a match!", {
          description: 'You both liked each other',
        });
      } else if (res.ok) {
        toast.success('Like sent', { duration: 1500 });
      }
    } catch {
      toast.error('Failed to like');
    }

    setTimeout(handleNextUser, 400);
  };

  const handlePass = async (userId: number) => {
    if (isExiting) return;
    setAction('pass');
    setIsExiting(true);

    try {
      await fetch('/api/pass', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toUserId: userId }),
      });
    } catch {
      // silent fail
    }

    setTimeout(handleNextUser, 400);
  };

  // Mouse/touch drag handling
  const handlePointerDown = (e: React.PointerEvent) => {
    if (isExiting) return;
    setDragStart({ x: e.clientX, y: e.clientY });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragStart || isExiting) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    setDragOffset({ x: dx, y: dy });
  };

  const handlePointerUp = () => {
    if (!dragStart || isExiting) return;
    const threshold = 120;
    if (dragOffset.x > threshold) {
      handleLike(currentUser.id);
    } else if (dragOffset.x < -threshold) {
      handlePass(currentUser.id);
    } else {
      setDragOffset({ x: 0, y: 0 });
    }
    setDragStart(null);
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
            <p className="text-muted-foreground text-sm">Loading profiles...</p>
          </div>
        </div>
      </AuroraBackground>
    );
  }

  const noMoreUsers = currentIndex >= users.length;

  return (
    <AuroraBackground>
      <div className="min-h-screen flex flex-col px-4 py-6">
        {/* Header */}
        <div className="max-w-md mx-auto w-full flex items-center justify-between mb-4">
          <div className="inline-flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-romance shadow-lg shadow-primary/30">
              <Heart className="h-4 w-4 text-white fill-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">Amori</span>
          </div>
          <Button
            onClick={handleLogout}
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>

        {/* Card area */}
        <div className="flex-1 flex items-center justify-center">
          <div className="relative w-full max-w-sm h-[520px]">
            {/* Next card preview (stacked behind) */}
            {users[currentIndex + 1] && (
              <div className="absolute inset-0 scale-95 opacity-50 rounded-3xl overflow-hidden border border-border/50 bg-card shadow-xl">
                {users[currentIndex + 1].photos[0] && (
                  <img
                    src={users[currentIndex + 1].photos[0]}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
            )}

            {/* Current card */}
            {!noMoreUsers && currentUser && (
              <div
                ref={cardRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={() => { setDragStart(null); setDragOffset({ x: 0, y: 0 }); }}
                className={cn(
                  'absolute inset-0 rounded-3xl overflow-hidden border border-border/50 bg-card shadow-2xl shadow-primary/10 cursor-grab active:cursor-grabbing touch-none select-none transition-transform',
                  isExiting && 'transition-transform duration-400',
                  !isExiting && !dragStart && 'transition-transform duration-200 ease-out'
                )}
                style={{
                  transform: isExiting
                    ? action === 'like'
                      ? 'translateX(150%) rotate(20deg)'
                      : 'translateX(-150%) rotate(-20deg)'
                    : `translateX(${dragOffset.x}px) translateY(${dragOffset.y * 0.3}px) rotate(${dragOffset.x * 0.05}deg)`,
                  opacity: isExiting ? 0 : 1,
                }}
              >
                {/* Photo */}
                {currentUser.photos.length > 0 && (
                  <div className="relative h-full">
                    <img
                      src={currentUser.photos[photoIndex]}
                      alt={currentUser.name || 'User'}
                      className="h-full w-full object-cover pointer-events-none"
                      draggable={false}
                    />
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                    {/* Photo navigation dots */}
                    {currentUser.photos.length > 1 && (
                      <div className="absolute top-3 left-3 right-3 flex gap-1.5 pointer-events-none">
                        {currentUser.photos.map((_, i) => (
                          <div
                            key={i}
                            className={cn(
                              'h-1 rounded-full transition-all duration-300',
                              i === photoIndex ? 'bg-white flex-1' : 'bg-white/30 flex-1'
                            )}
                          />
                        ))}
                      </div>
                    )}

                    {/* Photo tap zones */}
                    {currentUser.photos.length > 1 && (
                      <>
                        <button
                          className="absolute left-0 top-0 h-full w-1/3 z-10"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPhotoIndex((prev) => (prev > 0 ? prev - 1 : currentUser.photos.length - 1));
                          }}
                        />
                        <button
                          className="absolute right-0 top-0 h-full w-1/3 z-10"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPhotoIndex((prev) => (prev < currentUser.photos.length - 1 ? prev + 1 : 0));
                          }}
                        />
                      </>
                    )}

                    {/* Like/Pass badges */}
                    {action === 'like' && (
                      <div className="absolute top-12 right-4 rotate-12 animate-scale-in z-20">
                        <div className="flex items-center gap-2 rounded-2xl border-4 border-green-500 bg-white/20 px-5 py-2 backdrop-blur-sm">
                          <Heart className="h-7 w-7 text-green-500 fill-green-500" />
                          <span className="text-2xl font-bold text-green-500">LIKE</span>
                        </div>
                      </div>
                    )}
                    {action === 'pass' && (
                      <div className="absolute top-12 left-4 -rotate-12 animate-scale-in z-20">
                        <div className="flex items-center gap-2 rounded-2xl border-4 border-red-500 bg-white/20 px-5 py-2 backdrop-blur-sm">
                          <X className="h-7 w-7 text-red-500" />
                          <span className="text-2xl font-bold text-red-500">NOPE</span>
                        </div>
                      </div>
                    )}

                    {/* Drag hint */}
                    {Math.abs(dragOffset.x) > 30 && !isExiting && (
                      <div
                        className={cn(
                          'absolute top-1/2 -translate-y-1/2 z-20 pointer-events-none transition-opacity',
                          dragOffset.x > 0 ? 'right-6' : 'left-6'
                        )}
                      >
                        {dragOffset.x > 0 ? (
                          <Heart className="h-16 w-16 text-green-500 fill-green-500/30" />
                        ) : (
                          <X className="h-16 w-16 text-red-500/70" />
                        )}
                      </div>
                    )}

                    {/* Info section */}
                    <div className="absolute bottom-0 left-0 right-0 p-5 text-white pointer-events-none">
                      <div className="flex items-end justify-between mb-2">
                        <div>
                          <h2 className="text-2xl font-bold flex items-center gap-2">
                            {currentUser.name}
                            {calculateAge(currentUser.birthDate) && (
                              <span className="text-lg font-medium text-white/80">
                                {calculateAge(currentUser.birthDate)}
                              </span>
                            )}
                          </h2>
                          <div className="flex items-center gap-2 text-sm text-white/70">
                            <AtSign className="h-3.5 w-3.5" />
                            {currentUser.username}
                          </div>
                        </div>
                        {currentUser.bio && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setShowInfo(!showInfo); }}
                            className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors"
                          >
                            <Info className="h-4 w-4 text-white" />
                          </button>
                        )}
                      </div>

                      {/* Interests */}
                      {currentUser.interests.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {currentUser.interests.slice(0, showInfo ? 5 : 3).map((id: string) => {
                            const interest = INTEREST_EMOJIS[id];
                            if (!interest) return null;
                            return (
                              <span
                                key={id}
                                className="inline-flex items-center gap-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 px-2.5 py-1 text-xs font-medium"
                              >
                                <span>{interest.emoji}</span>
                                {interest.label}
                              </span>
                            );
                          })}
                        </div>
                      )}

                      {/* Bio (expanded) */}
                      {showInfo && currentUser.bio && (
                        <div className="mt-3 animate-fade-in">
                          <p className="text-sm text-white/85 leading-relaxed line-clamp-3">
                            {currentUser.bio}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* No photo fallback */}
                {currentUser.photos.length === 0 && (
                  <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-romance">
                      <span className="text-3xl font-bold text-white">
                        {currentUser.name?.[0]?.toUpperCase() || '?'}
                      </span>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">{currentUser.name}</h2>
                      <p className="text-sm text-muted-foreground">@{currentUser.username}</p>
                    </div>
                    {currentUser.bio && (
                      <p className="text-sm text-muted-foreground max-w-xs">{currentUser.bio}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* No more users */}
            {noMoreUsers && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center gap-4 rounded-3xl border border-border/50 glass">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-1">You're all caught up!</h3>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    You've seen everyone for now. Check back later for new profiles.
                  </p>
                </div>
                <Button
                  onClick={loadUsers}
                  variant="outline"
                  className="hover:bg-secondary/50 transition-all"
                >
                  <Loader2 className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        {!noMoreUsers && currentUser && (
          <div className="flex items-center justify-center gap-4 mt-6">
            <Button
              onClick={() => handlePass(currentUser.id)}
              variant="outline"
              size="icon"
              className="h-14 w-14 rounded-full border-2 border-destructive/30 hover:border-destructive hover:bg-destructive/10 hover:scale-110 active:scale-95 transition-all duration-300 shadow-lg"
              disabled={isExiting}
            >
              <X className="h-7 w-7 text-destructive" />
            </Button>

            <Button
              onClick={() => handleLike(currentUser.id)}
              size="icon"
              className="h-16 w-16 rounded-full bg-gradient-romance shadow-xl shadow-primary/40 hover:scale-110 active:scale-95 transition-all duration-300 border-0"
              disabled={isExiting}
            >
              <Heart className="h-8 w-8 text-white fill-white" />
            </Button>
          </div>
        )}

        {/* Hint text */}
        {!noMoreUsers && users.length > 0 && currentIndex === 0 && !dragStart && (
          <p className="text-center text-xs text-muted-foreground mt-4 animate-fade-in">
            Swipe right to like, left to pass, or tap the buttons below
          </p>
        )}
      </div>
    </AuroraBackground>
  );
}
