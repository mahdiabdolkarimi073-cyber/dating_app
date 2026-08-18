'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AuroraBackground } from '@/components/aurora-background';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import {
  Heart,
  Loader2,
  LogOut,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Bot,
  MapPin,
  Users,
  Calendar,
  Check,
  X,
  Info,
  AtSign,
  ChevronUp,
  Crown,
  MessagesSquare,
  Zap,
  Trophy,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Step = 'welcome' | 'gender' | 'age' | 'distance' | 'interests' | 'results';

interface ScoredMatch {
  id: number;
  name: string | null;
  username: string | null;
  birthDate: string | null;
  gender: string | null;
  bio: string | null;
  interests: string[];
  photos: string[];
  compatibilityScore: number;
  distanceKm: number | null;
  sharedInterests: string[];
  matchReasons: string[];
  isTopMatch: boolean;
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

const distanceOptions = [
  { value: 5, label: '5 km' },
  { value: 10, label: '10 km' },
  { value: 25, label: '25 km' },
  { value: 50, label: '50 km' },
  { value: null, label: 'No limit' },
];

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

function getScoreColor(score: number): string {
  if (score >= 90) return 'text-green-500';
  if (score >= 75) return 'text-primary';
  if (score >= 60) return 'text-amber-500';
  return 'text-muted-foreground';
}

function getScoreGradient(score: number): string {
  if (score >= 90) return 'from-green-500 to-emerald-500';
  if (score >= 75) return 'from-primary to-accent';
  if (score >= 60) return 'from-amber-500 to-orange-500';
  return 'from-muted-foreground to-muted-foreground';
}

export default function MatchmakerPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [step, setStep] = useState<Step>('welcome');
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState<ScoredMatch[]>([]);
  const [myInterests, setMyInterests] = useState<string[]>([]);

  // Criteria state
  const [targetGender, setTargetGender] = useState<'male' | 'female' | 'both' | ''>('');
  const [ageRange, setAgeRange] = useState<[number, number]>([20, 35]);
  const [maxDistance, setMaxDistance] = useState<number | null>(25);
  const [priorityInterests, setPriorityInterests] = useState<string[]>([]);

  // Match card UI state
  const [expandedMatch, setExpandedMatch] = useState<number | null>(null);
  const [likeCount, setLikeCount] = useState(0);

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
        if (data.user.interests) {
          try {
            setMyInterests(JSON.parse(data.user.interests));
          } catch {
            // ignore
          }
        }
        loadLikeCount();
      });
  }, [router]);

  const loadLikeCount = async () => {
    try {
      const res = await fetch('/api/likes');
      if (res.ok) {
        const data = await res.json();
        setLikeCount(data.likes?.length || 0);
      }
    } catch {
      // silent
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/auth');
  };

  const togglePriorityInterest = (interest: string) => {
    setPriorityInterests((prev) => {
      if (prev.includes(interest)) {
        return prev.filter((i) => i !== interest);
      }
      if (prev.length >= 5) {
        toast.error('You can select up to 5 priority interests');
        return prev;
      }
      return [...prev, interest];
    });
  };

  const handleFindMatches = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/matchmaker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetGender: targetGender || null,
          minAge: ageRange[0],
          maxAge: ageRange[1],
          maxDistanceKm: maxDistance,
          priorityInterests,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMatches(data.matches || []);
        setStep('results');
      } else {
        toast.error(data.error || 'Failed to find matches');
      }
    } catch {
      toast.error('Connection error');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (userId: number) => {
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
      setMatches((prev) => prev.filter((m) => m.id !== userId));
    } catch {
      toast.error('Failed to like');
    }
  };

  const handlePass = async (userId: number) => {
    try {
      await fetch('/api/pass', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toUserId: userId }),
      });
      setMatches((prev) => prev.filter((m) => m.id !== userId));
    } catch {
      // silent
    }
  };

  const stepOrder: Step[] = ['welcome', 'gender', 'age', 'distance', 'interests', 'results'];
  const currentStepIndex = stepOrder.indexOf(step);
  const topMatch = matches.find((m) => m.isTopMatch);
  const otherMatches = matches.filter((m) => !m.isTopMatch);

  if (!authChecked) {
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
        {/* Header */}
        <div className="max-w-2xl mx-auto w-full flex items-center justify-between mb-4">
          <div className="inline-flex items-center gap-2">
            {step !== 'welcome' && step !== 'results' && (
              <Button
                onClick={() => setStep(stepOrder[currentStepIndex - 1])}
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-primary"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-romance shadow-lg shadow-primary/30">
              <Heart className="h-4 w-4 text-white fill-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">Amori</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              onClick={() => router.push('/discover')}
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <Users className="h-5 w-5" />
            </Button>
            <Button
              onClick={() => router.push('/likes')}
              variant="ghost"
              size="sm"
              className="relative text-muted-foreground hover:text-primary transition-colors"
            >
              <Heart className="h-5 w-5" />
              {likeCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white animate-scale-in">
                  {likeCount}
                </span>
              )}
            </Button>
            <Button
              onClick={() => router.push('/matches')}
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <MessagesSquare className="h-5 w-5" />
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

        {/* Progress bar for setup steps */}
        {step !== 'welcome' && step !== 'results' && (
          <div className="max-w-2xl mx-auto w-full mb-6">
            <div className="flex items-center gap-2">
              {stepOrder.slice(1, 5).map((s, i) => {
                const stepIdx = stepOrder.indexOf(step);
                const isActive = i + 1 === stepIdx;
                const isDone = i + 1 < stepIdx;
                return (
                  <div
                    key={s}
                    className={cn(
                      'h-1.5 flex-1 rounded-full transition-all duration-500',
                      isDone ? 'bg-primary' : isActive ? 'bg-gradient-romance' : 'bg-secondary'
                    )}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 flex items-start justify-center">
          <div className="w-full max-w-2xl">

            {/* WELCOME STEP */}
            {step === 'welcome' && (
              <div className="flex flex-col items-center text-center animate-fade-in-up">
                {/* Bot avatar */}
                <div className="relative mb-6">
                  <div className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-romance shadow-2xl shadow-primary/30 animate-float">
                    <Bot className="h-14 w-14 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-card border-2 border-primary/30 shadow-lg">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                </div>

                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 mb-4">
                  <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs font-medium text-primary">AI Matchmaker</span>
                </div>

                <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3 text-balance">
                  Let me find your{' '}
                  <span className="text-gradient">perfect match</span>
                </h1>
                <p className="text-base md:text-lg text-muted-foreground max-w-md mb-8 text-balance">
                  Instead of swiping endlessly, I'll analyze your profile, interests, and preferences to find the most compatible people for you.
                </p>

                {/* Feature pills */}
                <div className="flex flex-wrap justify-center gap-3 mb-8">
                  {[
                    { icon: Zap, label: 'Smart Scoring' },
                    { icon: Users, label: 'Personality Match' },
                    { icon: Sparkles, label: 'Compatibility Score' },
                  ].map((f, i) => (
                    <div
                      key={i}
                      className="glass rounded-full border border-border/50 px-4 py-2 flex items-center gap-2 animate-fade-in-up"
                      style={{ animationDelay: `${0.1 * i}s` }}
                    >
                      <f.icon className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">{f.label}</span>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={() => setStep('gender')}
                  size="lg"
                  className="bg-gradient-romance text-white shadow-xl shadow-primary/30 hover:shadow-primary/50 hover:scale-105 transition-all duration-300 h-14 px-10 text-base font-semibold animate-fade-in-up"
                  style={{ animationDelay: '0.3s' }}
                >
                  <Sparkles className="h-5 w-5 mr-2 fill-white" />
                  Find My Matches
                </Button>

                <p className="text-xs text-muted-foreground mt-4 animate-fade-in" style={{ animationDelay: '0.5s' }}>
                  Takes less than a minute to set up
                </p>
              </div>
            )}

            {/* GENDER STEP */}
            {step === 'gender' && (
              <Card className="glass border-border/50 shadow-2xl shadow-primary/10 animate-scale-in">
                <CardContent className="pt-8 pb-6 px-6">
                  <div className="text-center mb-6">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <Bot className="h-6 w-6 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold mb-1">Who should I look for?</h2>
                    <p className="text-sm text-muted-foreground">This only affects Matchmaker, not your profile settings.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { value: 'male', label: 'Male', emoji: '👨' },
                      { value: 'female', label: 'Female', emoji: '👩' },
                      { value: 'both', label: 'Both', emoji: '💜' },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setTargetGender(opt.value as 'male' | 'female' | 'both')}
                        className={cn(
                          'relative flex flex-col items-center justify-center gap-2 rounded-2xl border-2 p-6 transition-all duration-300',
                          targetGender === opt.value
                            ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20 scale-[1.02]'
                            : 'border-border hover:border-primary/40 hover:bg-secondary/50'
                        )}
                      >
                        <span className={cn('text-4xl transition-transform', targetGender === opt.value && 'scale-110')}>
                          {opt.emoji}
                        </span>
                        <span className={cn('text-sm font-semibold', targetGender === opt.value && 'text-primary')}>
                          {opt.label}
                        </span>
                        {targetGender === opt.value && (
                          <div className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  <Button
                    onClick={() => setStep('age')}
                    disabled={!targetGender}
                    className="w-full mt-6 bg-gradient-romance text-white shadow-lg shadow-primary/30 hover:scale-[1.02] transition-all duration-300 h-12 font-semibold disabled:opacity-50 disabled:hover:scale-100"
                  >
                    Continue
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* AGE STEP */}
            {step === 'age' && (
              <Card className="glass border-border/50 shadow-2xl shadow-primary/10 animate-scale-in">
                <CardContent className="pt-8 pb-6 px-6">
                  <div className="text-center mb-6">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <Calendar className="h-6 w-6 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold mb-1">Age range</h2>
                    <p className="text-sm text-muted-foreground">I'll only suggest people within this range.</p>
                  </div>

                  <div className="px-4 py-8">
                    <div className="text-center mb-6">
                      <span className="text-4xl font-bold text-gradient">
                        {ageRange[0]}
                      </span>
                      <span className="text-2xl text-muted-foreground mx-2">—</span>
                      <span className="text-4xl font-bold text-gradient">
                        {ageRange[1]}
                      </span>
                      <span className="text-lg text-muted-foreground ml-2">years</span>
                    </div>

                    <Slider
                      min={18}
                      max={80}
                      step={1}
                      value={ageRange}
                      onValueChange={(v) => setAgeRange([v[0], v[1]] as [number, number])}
                      className="py-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-2">
                      <span>18</span>
                      <span>80</span>
                    </div>
                  </div>

                  <Button
                    onClick={() => setStep('distance')}
                    className="w-full mt-2 bg-gradient-romance text-white shadow-lg shadow-primary/30 hover:scale-[1.02] transition-all duration-300 h-12 font-semibold"
                  >
                    Continue
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* DISTANCE STEP */}
            {step === 'distance' && (
              <Card className="glass border-border/50 shadow-2xl shadow-primary/10 animate-scale-in">
                <CardContent className="pt-8 pb-6 px-6">
                  <div className="text-center mb-6">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <MapPin className="h-6 w-6 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold mb-1">How far is too far?</h2>
                    <p className="text-sm text-muted-foreground">Set the maximum distance for your matches.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {distanceOptions.map((opt) => (
                      <button
                        key={String(opt.value)}
                        onClick={() => setMaxDistance(opt.value)}
                        className={cn(
                          'relative flex flex-col items-center justify-center gap-1.5 rounded-2xl border-2 p-5 transition-all duration-300',
                          maxDistance === opt.value
                            ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20 scale-[1.02]'
                            : 'border-border hover:border-primary/40 hover:bg-secondary/50'
                        )}
                      >
                        <MapPin className={cn('h-5 w-5', maxDistance === opt.value ? 'text-primary' : 'text-muted-foreground')} />
                        <span className={cn('text-sm font-semibold', maxDistance === opt.value && 'text-primary')}>
                          {opt.label}
                        </span>
                        {maxDistance === opt.value && (
                          <div className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  <Button
                    onClick={() => setStep('interests')}
                    className="w-full mt-6 bg-gradient-romance text-white shadow-lg shadow-primary/30 hover:scale-[1.02] transition-all duration-300 h-12 font-semibold"
                  >
                    Continue
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* INTERESTS STEP */}
            {step === 'interests' && (
              <Card className="glass border-border/50 shadow-2xl shadow-primary/10 animate-scale-in">
                <CardContent className="pt-8 pb-6 px-6">
                  <div className="text-center mb-6">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <Sparkles className="h-6 w-6 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold mb-1">What matters most?</h2>
                    <p className="text-sm text-muted-foreground">
                      Pick up to 5 interests that are most important to you.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 justify-center mb-2">
                    {myInterests.length > 0 ? (
                      myInterests.map((id) => {
                        const interest = INTEREST_EMOJIS[id];
                        if (!interest) return null;
                        const selected = priorityInterests.includes(id);
                        return (
                          <button
                            key={id}
                            onClick={() => togglePriorityInterest(id)}
                            className={cn(
                              'inline-flex items-center gap-1.5 rounded-full border-2 px-3.5 py-2 text-sm font-medium transition-all duration-300',
                              selected
                                ? 'border-primary bg-primary/10 text-primary shadow-md shadow-primary/20 scale-105'
                                : 'border-border hover:border-primary/40 hover:bg-secondary/50'
                            )}
                          >
                            <span>{interest.emoji}</span>
                            {interest.label}
                            {selected && <Check className="h-3.5 w-3.5 ml-0.5" />}
                          </button>
                        );
                      })
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Add interests to your profile first to use this feature.
                      </p>
                    )}
                  </div>

                  <div className="text-center text-xs text-muted-foreground mb-4">
                    {priorityInterests.length}/5 selected
                  </div>

                  <Button
                    onClick={handleFindMatches}
                    disabled={loading}
                    className="w-full bg-gradient-romance text-white shadow-xl shadow-primary/30 hover:scale-[1.02] transition-all duration-300 h-12 font-semibold disabled:opacity-50 disabled:hover:scale-100"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        Finding matches...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5 mr-2 fill-white" />
                        Find My Matches
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* RESULTS STEP */}
            {step === 'results' && (
              <div className="animate-fade-in">
                {/* Results header */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                      <Bot className="h-6 w-6 text-primary" />
                      Your Matches
                    </h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {matches.length > 0
                        ? `${matches.length} compatible ${matches.length === 1 ? 'person' : 'people'} found`
                        : 'No matches found yet'}
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      setStep('welcome');
                      setMatches([]);
                    }}
                    variant="outline"
                    size="sm"
                    className="hover:bg-secondary/50 transition-all"
                  >
                    <Sparkles className="h-4 w-4 mr-1.5" />
                    New Search
                  </Button>
                </div>

                {/* No matches */}
                {matches.length === 0 && !loading && (
                  <Card className="glass border-border/50 shadow-xl">
                    <CardContent className="pt-8 pb-8 px-6 text-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mx-auto mb-4 animate-pulse-glow">
                        <Bot className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="text-xl font-bold mb-2">No matches found</h3>
                      <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-4">
                        I couldn't find anyone matching your criteria. Try adjusting your filters or check back later for new members.
                      </p>
                      <Button
                        onClick={() => setStep('gender')}
                        className="bg-gradient-romance text-white shadow-lg shadow-primary/30 hover:scale-105 transition-all"
                      >
                        Adjust Filters
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* TOP MATCH */}
                {topMatch && (
                  <div className="mb-6 animate-fade-in-up">
                    <div className="text-center mb-3">
                      <div className="inline-flex items-center gap-2 rounded-full bg-gradient-romance px-4 py-1.5 shadow-lg shadow-primary/30">
                        <Trophy className="h-4 w-4 text-white fill-white" />
                        <span className="text-sm font-bold text-white">Your Top Match</span>
                      </div>
                    </div>
                    <Card className="glass border-2 border-primary/30 shadow-2xl shadow-primary/20 overflow-hidden animate-scale-in">
                      {/* Photo */}
                      {topMatch.photos.length > 0 && (
                        <div className="relative h-72 overflow-hidden">
                          <img
                            src={topMatch.photos[0]}
                            alt={topMatch.name || 'Top Match'}
                            className="h-full w-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />

                          {/* Trophy badge */}
                          <div className="absolute top-4 left-4">
                            <div className="flex items-center gap-1.5 rounded-full bg-gradient-romance px-3 py-1.5 shadow-lg backdrop-blur-sm">
                              <Trophy className="h-4 w-4 text-white fill-white" />
                              <span className="text-sm font-bold text-white">Top Match</span>
                            </div>
                          </div>

                          {/* Compatibility score */}
                          <div className="absolute top-4 right-4">
                            <div className={cn(
                              'flex items-center gap-1.5 rounded-full bg-gradient-to-r px-3 py-1.5 shadow-lg backdrop-blur-sm',
                              getScoreGradient(topMatch.compatibilityScore)
                            )}>
                              <Sparkles className="h-3.5 w-3.5 text-white fill-white" />
                              <span className="text-sm font-bold text-white">
                                {topMatch.compatibilityScore}% Match
                              </span>
                            </div>
                          </div>

                          {/* Name & info */}
                          <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                            <h3 className="text-2xl font-bold flex items-center gap-2">
                              {topMatch.name}
                              {calculateAge(topMatch.birthDate) != null && (
                                <span className="text-lg font-medium text-white/80">
                                  {calculateAge(topMatch.birthDate)}
                                </span>
                              )}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-white/70 mt-0.5">
                              <span className="flex items-center gap-1">
                                <AtSign className="h-3 w-3" />
                                {topMatch.username}
                              </span>
                              {topMatch.gender && (
                                <span className="capitalize">• {genderLabels[topMatch.gender] || topMatch.gender}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      <CardContent className="pt-4 pb-4 px-5">
                        {/* AI message */}
                        <div className="flex items-start gap-2.5 mb-4 rounded-xl bg-primary/5 border border-primary/10 p-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-romance">
                            <Bot className="h-4 w-4 text-white" />
                          </div>
                          <p className="text-sm text-foreground leading-relaxed">
                            It seems like{' '}
                            <span className="font-semibold text-primary">{topMatch.name}</span>{' '}
                            has the highest compatibility with your current preferences.
                          </p>
                        </div>

                        {/* Match reasons */}
                        {topMatch.matchReasons.length > 0 && (
                          <div className="mb-4">
                            <p className="text-xs font-semibold text-muted-foreground mb-2">Why I picked this match:</p>
                            <div className="flex flex-wrap gap-1.5">
                              {topMatch.matchReasons.map((reason, i) => (
                                <span
                                  key={i}
                                  className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2.5 py-1 text-xs font-medium text-primary"
                                >
                                  {reason}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Shared interests */}
                        {topMatch.sharedInterests.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-4">
                            {topMatch.sharedInterests.slice(0, 6).map((id) => {
                              const interest = INTEREST_EMOJIS[id];
                              if (!interest) return null;
                              return (
                                <span
                                  key={id}
                                  className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium"
                                >
                                  <span>{interest.emoji}</span>
                                  {interest.label}
                                </span>
                              );
                            })}
                          </div>
                        )}

                        {/* Distance */}
                        {topMatch.distanceKm != null && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
                            <MapPin className="h-3.5 w-3.5" />
                            {topMatch.distanceKm < 1
                              ? 'Less than 1 km away'
                              : `${Math.round(topMatch.distanceKm)} km away`}
                          </div>
                        )}

                        {/* Expandable bio */}
                        {topMatch.bio && (
                          <div className="mb-4">
                            <button
                              onClick={() => setExpandedMatch(expandedMatch === topMatch.id ? null : topMatch.id)}
                              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                            >
                              <ChevronUp className={cn('h-3.5 w-3.5 transition-transform', expandedMatch === topMatch.id && 'rotate-180')} />
                              {expandedMatch === topMatch.id ? 'Hide bio' : 'Show bio'}
                            </button>
                            {expandedMatch === topMatch.id && (
                              <p className="text-sm text-muted-foreground mt-2 animate-fade-in leading-relaxed line-clamp-4">
                                {topMatch.bio}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => handlePass(topMatch.id)}
                            variant="outline"
                            size="sm"
                            className="flex-1 border-destructive/30 hover:border-destructive hover:bg-destructive/10 hover:text-destructive transition-all duration-300"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Pass
                          </Button>
                          <Button
                            onClick={() => router.push(`/profile/${topMatch.id}`)}
                            variant="outline"
                            size="sm"
                            className="border-primary/30 hover:border-primary hover:bg-primary/10 hover:text-primary transition-all duration-300"
                          >
                            <Info className="h-4 w-4 mr-1" />
                            Profile
                          </Button>
                          <Button
                            onClick={() => handleLike(topMatch.id)}
                            size="sm"
                            className="flex-1 bg-gradient-romance text-white shadow-lg shadow-primary/30 hover:scale-105 transition-all duration-300 border-0"
                          >
                            <Heart className="h-4 w-4 mr-1 fill-white" />
                            Like
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* OTHER MATCHES */}
                {otherMatches.length > 0 && (
                  <div>
                    {topMatch && (
                      <div className="flex items-center gap-2 mb-3">
                        <div className="h-px flex-1 bg-border/50" />
                        <span className="text-xs font-medium text-muted-foreground">More Matches</span>
                        <div className="h-px flex-1 bg-border/50" />
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {otherMatches.map((match, idx) => (
                        <Card
                          key={match.id}
                          className="glass border-border/50 shadow-xl shadow-primary/5 overflow-hidden animate-scale-in hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 hover:scale-[1.01]"
                          style={{ animationDelay: `${idx * 0.05}s` }}
                        >
                          {/* Photo */}
                          {match.photos.length > 0 && (
                            <div className="relative h-56 overflow-hidden">
                              <img
                                src={match.photos[0]}
                                alt={match.name || 'Match'}
                                className="h-full w-full object-cover"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

                              {/* Compatibility score badge */}
                              <div className="absolute top-3 right-3">
                                <div className={cn(
                                  'flex items-center gap-1.5 rounded-full bg-gradient-to-r px-3 py-1.5 shadow-lg backdrop-blur-sm',
                                  getScoreGradient(match.compatibilityScore)
                                )}>
                                  <Sparkles className="h-3.5 w-3.5 text-white fill-white" />
                                  <span className="text-sm font-bold text-white">
                                    {match.compatibilityScore}%
                                  </span>
                                </div>
                              </div>

                              {/* Name & info */}
                              <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                  {match.name}
                                  {calculateAge(match.birthDate) != null && (
                                    <span className="text-base font-medium text-white/80">
                                      {calculateAge(match.birthDate)}
                                    </span>
                                  )}
                                </h3>
                                <div className="flex items-center gap-2 text-sm text-white/70 mt-0.5">
                                  <span className="flex items-center gap-1">
                                    <AtSign className="h-3 w-3" />
                                    {match.username}
                                  </span>
                                  {match.gender && (
                                    <span className="capitalize">• {genderLabels[match.gender] || match.gender}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          <CardContent className="pt-4 pb-4 px-4">
                            {/* Match reasons */}
                            {match.matchReasons.length > 0 && (
                              <div className="mb-3">
                                <p className="text-xs font-semibold text-muted-foreground mb-2">Why this match:</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {match.matchReasons.slice(0, 4).map((reason, i) => (
                                    <span
                                      key={i}
                                      className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2.5 py-1 text-xs font-medium text-primary"
                                    >
                                      {reason}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Shared interests */}
                            {match.sharedInterests.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mb-3">
                                {match.sharedInterests.slice(0, 5).map((id) => {
                                  const interest = INTEREST_EMOJIS[id];
                                  if (!interest) return null;
                                  return (
                                    <span
                                      key={id}
                                      className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium"
                                    >
                                      <span>{interest.emoji}</span>
                                      {interest.label}
                                    </span>
                                  );
                                })}
                              </div>
                            )}

                            {/* Distance */}
                            {match.distanceKm != null && (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
                                <MapPin className="h-3.5 w-3.5" />
                                {match.distanceKm < 1
                                  ? 'Less than 1 km away'
                                  : `${Math.round(match.distanceKm)} km away`}
                              </div>
                            )}

                            {/* Expandable bio */}
                            {match.bio && (
                              <div className="mb-3">
                                <button
                                  onClick={() => setExpandedMatch(expandedMatch === match.id ? null : match.id)}
                                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                                >
                                  <ChevronUp className={cn('h-3.5 w-3.5 transition-transform', expandedMatch === match.id && 'rotate-180')} />
                                  {expandedMatch === match.id ? 'Hide bio' : 'Show bio'}
                                </button>
                                {expandedMatch === match.id && (
                                  <p className="text-sm text-muted-foreground mt-2 animate-fade-in leading-relaxed line-clamp-4">
                                    {match.bio}
                                  </p>
                                )}
                              </div>
                            )}

                            {/* Action buttons */}
                            <div className="flex items-center gap-2 mt-3">
                              <Button
                                onClick={() => handlePass(match.id)}
                                variant="outline"
                                size="sm"
                                className="flex-1 border-destructive/30 hover:border-destructive hover:bg-destructive/10 hover:text-destructive transition-all duration-300"
                              >
                                <X className="h-4 w-4 mr-1" />
                                Pass
                              </Button>
                              <Button
                                onClick={() => router.push(`/profile/${match.id}`)}
                                variant="outline"
                                size="sm"
                                className="border-primary/30 hover:border-primary hover:bg-primary/10 hover:text-primary transition-all duration-300"
                              >
                                <Info className="h-4 w-4" />
                              </Button>
                              <Button
                                onClick={() => handleLike(match.id)}
                                size="sm"
                                className="flex-1 bg-gradient-romance text-white shadow-lg shadow-primary/30 hover:scale-105 transition-all duration-300 border-0"
                              >
                                <Heart className="h-4 w-4 mr-1 fill-white" />
                                Like
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </AuroraBackground>
  );
}
