'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import { AuroraBackground } from '@/components/aurora-background';
import { Button } from '@/components/ui/button';
import {
  Heart,
  X,
  Loader2,
  LogOut,
  ArrowLeft,
  AtSign,
  Calendar,
  Users,
  Sparkles,
  Star,
  Info,
  CheckCircle2,
  MessagesSquare,
  Shield,
  Ban,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserProfile {
  id: number;
  name: string | null;
  username: string | null;
  birthDate: string | null;
  gender: string | null;
  bio: string | null;
  interests: string[];
  photos: string[];
  relationship: {
    iLiked: boolean;
    theyLiked: boolean;
    iPassed: boolean;
    isMatch: boolean;
    matchId: number | null;
  };
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

export default function UserProfilePage() {
  const router = useRouter();
  const params = useParams();
  const userId = Number(params.id);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [activePhoto, setActivePhoto] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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
        loadProfile();
      });
  }, [router]);

  const loadProfile = async () => {
    try {
      const res = await fetch(`/api/user/${userId}`);
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        // Track profile view
        fetch('/api/profile-view', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ viewedId: userId }),
        }).catch(() => {});
      } else {
        toast.error(data.error || 'User not found');
        router.push('/discover');
      }
    } catch {
      toast.error('Failed to load profile');
      router.push('/discover');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!user || actionLoading) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toUserId: user.id }),
      });
      const data = await res.json();
      if (data.matched) {
        toast.success("It's a match!", {
          description: 'You both liked each other',
        });
      } else if (res.ok) {
        toast.success('Like sent');
      } else {
        toast.error(data.error || 'Failed to like');
        return;
      }
      setUser((prev) => prev ? {
        ...prev,
        relationship: { ...prev.relationship, iLiked: true, isMatch: data.matched || prev.relationship.theyLiked, matchId: data.matchId ?? prev.relationship.matchId },
      } : null);
    } catch {
      toast.error('Something went wrong');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePass = async () => {
    if (!user || actionLoading) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/pass', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toUserId: user.id }),
      });
      if (res.ok) {
        toast.success('Passed', { duration: 1500 });
        setUser((prev) => prev ? {
          ...prev,
          relationship: { ...prev.relationship, iPassed: true },
        } : null);
      } else {
        toast.error('Failed to pass');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/auth');
  };

  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState('');

  const handleBlock = async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      if (res.ok) {
        toast.success('User blocked', { duration: 2000 });
        setShowBlockDialog(false);
        router.push('/discover');
      } else {
        toast.error('Failed to block');
      }
    } catch {
      toast.error('Failed to block');
    }
  };

  const handleReport = async () => {
    if (!user) return;
    if (!reportReason) {
      toast.error('Please select a reason');
      return;
    }
    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportedId: user.id, reason: reportReason, targetType: 'user' }),
      });
      if (res.ok) {
        setShowReportDialog(false);
        setReportReason('');
        toast.success('Report submitted. Thank you.', { duration: 2000 });
      } else {
        toast.error('Failed to submit report');
      }
    } catch {
      toast.error('Failed to submit report');
    }
  };

  if (!authChecked || loading) {
    return (
      <AuroraBackground>
        <div className="flex min-h-screen items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground text-sm">Loading profile...</p>
          </div>
        </div>
      </AuroraBackground>
    );
  }

  if (!user) return null;

  const age = calculateAge(user.birthDate);

  return (
    <AuroraBackground>
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <div className="px-4 py-5">
          <div className="max-w-2xl mx-auto w-full flex items-center justify-between">
            <Button
              onClick={() => router.back()}
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
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
          <div className="flex items-center gap-1">
            <Button
              onClick={() => setShowReportDialog(true)}
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-destructive transition-colors"
              title="Report"
            >
              <Shield className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => setShowBlockDialog(true)}
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-destructive transition-colors"
              title="Block"
            >
              <Ban className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Scrollable content */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 pb-32">
          <div className="max-w-2xl mx-auto w-full">
            {/* Hero photo carousel */}
            <div className="relative rounded-[2rem] overflow-hidden border border-border/50 shadow-2xl shadow-primary/10 animate-scale-in">
              {user.photos.length > 0 ? (
                <div className="relative aspect-[3/4] sm:aspect-[4/3]">
                  <img
                    src={user.photos[activePhoto]}
                    alt={user.name || 'User'}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

                  {/* Photo dots */}
                  {user.photos.length > 1 && (
                    <div className="absolute top-4 left-4 right-4 flex gap-1.5">
                      {user.photos.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setActivePhoto(i)}
                          className={cn(
                            'h-1.5 rounded-full transition-all duration-300',
                            i === activePhoto ? 'bg-white flex-1' : 'bg-white/30 w-6'
                          )}
                        />
                      ))}
                    </div>
                  )}

                  {/* Photo nav arrows */}
                  {user.photos.length > 1 && (
                    <>
                      <button
                        onClick={() => setActivePhoto((prev) => (prev > 0 ? prev - 1 : user.photos.length - 1))}
                        className="absolute left-0 top-0 h-full w-1/4"
                      />
                      <button
                        onClick={() => setActivePhoto((prev) => (prev < user.photos.length - 1 ? prev + 1 : 0))}
                        className="absolute right-0 top-0 h-full w-1/4"
                      />
                    </>
                  )}

                  {/* Name & basic info */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                      {user.name}
                      {age != null && <span className="text-xl font-medium text-white/80">{age}</span>}
                    </h1>
                    <div className="flex items-center gap-4 mt-1.5 text-sm text-white/80">
                      <span className="flex items-center gap-1.5">
                        <AtSign className="h-4 w-4" />
                        {user.username}
                      </span>
                      {user.gender && (
                        <span className="flex items-center gap-1.5">
                          <Users className="h-4 w-4" />
                          {genderLabels[user.gender] || user.gender}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Match badge */}
                  {user.relationship.isMatch && (
                    <div className="absolute top-4 right-4 flex items-center gap-1.5 rounded-full bg-green-500/90 backdrop-blur-sm px-3 py-1.5 shadow-lg animate-scale-in">
                      <CheckCircle2 className="h-4 w-4 text-white" />
                      <span className="text-xs font-bold text-white">Matched!</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="aspect-[4/3] flex flex-col items-center justify-center bg-gradient-warm">
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                    <span className="text-4xl font-bold text-white">
                      {user.name?.[0]?.toUpperCase() || '?'}
                    </span>
                  </div>
                  <h1 className="text-2xl font-bold text-white mt-4">{user.name}</h1>
                  <p className="text-white/80">@{user.username}</p>
                </div>
              )}
            </div>

            {/* Photo thumbnails */}
            {user.photos.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                {user.photos.map((photo, i) => (
                  <button
                    key={i}
                    onClick={() => setActivePhoto(i)}
                    className={cn(
                      'h-16 w-16 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0',
                      i === activePhoto ? 'border-primary scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                    )}
                  >
                    <img src={photo} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Bio section */}
            {user.bio && (
              <div className="mt-5 rounded-2xl border border-border/50 glass p-5 animate-fade-in-up">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <Info className="h-4 w-4 text-primary" />
                  </div>
                  <h2 className="text-sm font-semibold text-muted-foreground">About</h2>
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{user.bio}</p>
              </div>
            )}

            {/* Info grid */}
            <div className="mt-4 grid grid-cols-2 gap-3 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              {age != null && (
                <div className="flex items-center gap-3 rounded-xl bg-secondary/50 p-4 border border-border/50">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Age</p>
                    <p className="text-sm font-medium">{age} years</p>
                  </div>
                </div>
              )}
              {user.gender && (
                <div className="flex items-center gap-3 rounded-xl bg-secondary/50 p-4 border border-border/50">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Gender</p>
                    <p className="text-sm font-medium">{genderLabels[user.gender] || user.gender}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Interests */}
            {user.interests.length > 0 && (
              <div className="mt-5 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                  <h2 className="text-sm font-semibold text-muted-foreground">Interests</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {user.interests.map((id: string) => {
                    const interest = INTEREST_EMOJIS[id];
                    if (!interest) return null;
                    return (
                      <span
                        key={id}
                        className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-2 text-sm font-medium text-primary"
                      >
                        <span>{interest.emoji}</span>
                        {interest.label}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* All photos gallery */}
            {user.photos.length > 1 && (
              <div className="mt-6 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <Star className="h-4 w-4 text-primary" />
                  </div>
                  <h2 className="text-sm font-semibold text-muted-foreground">Photos ({user.photos.length})</h2>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {user.photos.map((photo, i) => (
                    <button
                      key={i}
                      onClick={() => setActivePhoto(i)}
                      className={cn(
                        'aspect-square rounded-xl overflow-hidden border-2 transition-all',
                        i === activePhoto ? 'border-primary' : 'border-transparent hover:border-primary/40'
                      )}
                    >
                      <img src={photo} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sticky action bar */}
        <div className="fixed bottom-0 left-0 right-0 z-30">
          <div className="max-w-2xl mx-auto px-4 pb-5 pt-3">
            <div className="glass-strong rounded-2xl border border-border/50 shadow-2xl shadow-primary/10 p-3">
              {user.relationship.isMatch ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 flex-1 justify-center py-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span className="text-sm font-medium text-green-600">Matched!</span>
                  </div>
                  {user.relationship.matchId && (
                    <Button
                      onClick={() => router.push(`/chat/${user.relationship.matchId}`)}
                      className="rounded-xl bg-gradient-warm text-white shadow-lg shadow-primary/30 hover:scale-[1.02] transition-all"
                    >
                      <MessagesSquare className="h-5 w-5" />
                      Chat
                    </Button>
                  )}
                </div>
              ) : user.relationship.iLiked ? (
                <div className="flex items-center justify-center gap-2 py-2">
                  <Heart className="h-5 w-5 text-primary fill-primary" />
                  <span className="text-sm font-medium text-muted-foreground">
                    {user.relationship.theyLiked ? 'Waiting for your response' : 'You liked this person'}
                  </span>
                </div>
              ) : user.relationship.iPassed ? (
                <div className="flex items-center justify-center gap-2 py-2">
                  <X className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">You passed on this person</span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Button
                    onClick={handlePass}
                    variant="outline"
                    className="flex-1 rounded-xl border-destructive/30 hover:border-destructive hover:bg-destructive/10 transition-all"
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <X className="h-5 w-5 text-destructive" />
                        Pass
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleLike}
                    className="flex-1 rounded-xl bg-gradient-warm text-white shadow-lg shadow-primary/30 hover:scale-[1.02] transition-all"
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <Heart className="h-5 w-5 fill-white" />
                        Like
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Block dialog */}
        {showBlockDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in" onClick={() => setShowBlockDialog(false)}>
            <div className="glass-strong rounded-2xl border border-border/50 shadow-2xl p-6 max-w-sm mx-4 animate-scale-in" onClick={(e) => e.stopPropagation()}>
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 mx-auto mb-4">
                <Ban className="h-7 w-7 text-destructive" />
              </div>
              <h3 className="text-lg font-bold text-center mb-2">Block {user.name}?</h3>
              <p className="text-sm text-muted-foreground text-center mb-6">
                They won't be able to see your profile or contact you. Any existing match will be removed.
              </p>
              <div className="flex flex-col gap-2">
                <Button onClick={handleBlock} className="rounded-xl bg-destructive text-white hover:bg-destructive/90">
                  Block
                </Button>
                <Button onClick={() => setShowBlockDialog(false)} variant="ghost" className="rounded-xl">
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Report dialog */}
        {showReportDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in" onClick={() => setShowReportDialog(false)}>
            <div className="glass-strong rounded-2xl border border-border/50 shadow-2xl p-6 max-w-sm mx-4 animate-scale-in" onClick={(e) => e.stopPropagation()}>
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 mx-auto mb-4">
                <Shield className="h-7 w-7 text-destructive" />
              </div>
              <h3 className="text-lg font-bold text-center mb-2">Report {user.name}</h3>
              <p className="text-sm text-muted-foreground text-center mb-4">Why are you reporting this user?</p>
              <div className="space-y-2 mb-4">
                {[
                  { value: 'harassment', label: 'Harassment' },
                  { value: 'fake_profile', label: 'Fake Profile' },
                  { value: 'inappropriate_content', label: 'Inappropriate Content' },
                  { value: 'scam', label: 'Scam' },
                  { value: 'spam', label: 'Spam' },
                  { value: 'other', label: 'Other' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setReportReason(opt.value)}
                    className={cn(
                      'w-full flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-sm transition-all',
                      reportReason === opt.value ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40'
                    )}
                  >
                    <div className={cn(
                      'flex h-5 w-5 items-center justify-center rounded-full border-2',
                      reportReason === opt.value ? 'border-primary bg-primary' : 'border-border'
                    )}>
                      {reportReason === opt.value && <CheckCircle2 className="h-3 w-3 text-white" />}
                    </div>
                    {opt.label}
                  </button>
                ))}
              </div>
              <div className="flex flex-col gap-2">
                <Button onClick={handleReport} disabled={!reportReason} className="rounded-xl bg-destructive text-white hover:bg-destructive/90">
                  Submit Report
                </Button>
                <Button onClick={() => setShowReportDialog(false)} variant="ghost" className="rounded-xl">
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
