'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuroraBackground } from '@/components/aurora-background';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Heart, LogOut, User as UserIcon, Calendar, Users, AtSign, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface UserProfile {
  id: number;
  email: string;
  name: string | null;
  username: string | null;
  birthDate: string | null;
  gender: string | null;
  bio: string | null;
  interests: string | null;
  photos: string | null;
  termsAccepted: boolean;
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

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (!data.user) {
          router.push('/auth');
          return;
        }
        if (!data.user.username) {
          router.push('/onboarding');
          return;
        }
        if (!data.user.interests) {
          router.push('/onboarding/interests');
          return;
        }
        if (!data.user.photos) {
          router.push('/onboarding/photos');
          return;
        }
        if (!data.user.termsAccepted) {
          router.push('/onboarding/terms');
          return;
        }
        setUser(data.user);
        setLoading(false);
        router.push('/discover');
      });
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    toast.success('Logged out successfully');
    router.push('/auth');
  };

  if (loading) {
    return (
      <AuroraBackground>
        <div className="flex min-h-screen items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </AuroraBackground>
    );
  }

  const genderLabels: Record<string, string> = {
    male: 'Male',
    female: 'Female',
    other: 'Other',
  };

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  const photos = user?.photos ? JSON.parse(user.photos) : [];
  const interests = user?.interests ? JSON.parse(user.interests) : [];

  return (
    <AuroraBackground>
      <div className="min-h-screen px-4 py-10">
        {/* Header */}
        <div className="max-w-3xl mx-auto mb-8 flex items-center justify-between">
          <div className="inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-romance shadow-lg shadow-primary/30">
              <Heart className="h-5 w-5 text-white fill-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight">Amori</span>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            size="sm"
            className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Log Out
          </Button>
        </div>

        {/* Profile Card */}
        <Card className="max-w-3xl mx-auto glass border-border/50 shadow-2xl shadow-primary/10 animate-scale-in overflow-hidden">
          {/* Banner */}
          <div className="h-32 bg-gradient-romance animate-gradient-x relative">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-4 right-8 text-3xl animate-float">❤</div>
              <div className="absolute top-8 left-12 text-2xl animate-float-slow">♥</div>
              <div className="absolute bottom-4 left-1/3 text-4xl animate-float">❤</div>
            </div>
          </div>

          <CardContent className="pt-0 -mt-16 relative">
            {/* Avatar / Main Photo */}
            <div className="flex flex-col items-center mb-4">
              {photos.length > 0 ? (
                <div className="h-32 w-32 rounded-full border-4 border-card shadow-xl overflow-hidden">
                  <img src={photos[0]} alt={user?.name || 'Profile'} className="h-full w-full object-cover" />
                </div>
              ) : (
                <Avatar className="h-32 w-32 border-4 border-card shadow-xl">
                  <AvatarFallback className="bg-gradient-romance text-white text-4xl font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>

            {/* Name & Username */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-1">{user?.name}</h2>
              <div className="inline-flex items-center gap-1.5 text-muted-foreground">
                <AtSign className="h-4 w-4" />
                <span className="text-sm">{user?.username}</span>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="flex items-center gap-3 rounded-xl bg-secondary/50 p-4 border border-border/50">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <UserIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium truncate max-w-[180px]">{user?.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl bg-secondary/50 p-4 border border-border/50">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Date of Birth</p>
                  <p className="text-sm font-medium">{user?.birthDate || '—'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl bg-secondary/50 p-4 border border-border/50">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Gender</p>
                  <p className="text-sm font-medium">
                    {user?.gender ? genderLabels[user.gender] : '—'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl bg-secondary/50 p-4 border border-border/50">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className="text-sm font-medium text-green-500">Profile Complete</p>
                </div>
              </div>
            </div>

            {/* Bio */}
            {user?.bio && (
              <div className="rounded-xl bg-secondary/50 p-4 border border-border/50 mb-6">
                <p className="text-xs text-muted-foreground mb-2">Bio</p>
                <p className="text-sm leading-relaxed">{user.bio}</p>
              </div>
            )}

            {/* Interests */}
            {interests.length > 0 && (
              <div className="mb-6">
                <p className="text-xs text-muted-foreground mb-3">Interests</p>
                <div className="flex flex-wrap gap-2">
                  {interests.map((id: string) => {
                    const interest = INTEREST_EMOJIS[id];
                    if (!interest) return null;
                    return (
                      <span
                        key={id}
                        className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1.5 text-sm font-medium text-primary"
                      >
                        <span>{interest.emoji}</span>
                        {interest.label}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Photo Gallery */}
            {photos.length > 0 && (
              <div className="mb-6">
                <p className="text-xs text-muted-foreground mb-3">Photos</p>
                <div className="grid grid-cols-3 gap-2">
                  {photos.map((photo: string, i: number) => (
                    <div key={i} className="aspect-square rounded-lg overflow-hidden border border-border/50">
                      <img src={photo} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Welcome message */}
            <div className="text-center py-4 border-t border-border/50">
              <p className="text-muted-foreground text-sm">
                Welcome to Amori! More features coming soon.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuroraBackground>
  );
}
