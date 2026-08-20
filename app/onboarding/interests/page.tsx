'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AuroraBackground } from '@/components/aurora-background';
import { OnboardingStepper } from '@/components/onboarding-stepper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Heart, Loader2, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const INTERESTS = [
  { id: 'travel', label: 'Travel', emoji: '✈️' },
  { id: 'music', label: 'Music', emoji: '🎵' },
  { id: 'foodie', label: 'Foodie', emoji: '🍽️' },
  { id: 'fitness', label: 'Fitness', emoji: '💪' },
  { id: 'movies', label: 'Movies', emoji: '🎬' },
  { id: 'gaming', label: 'Gaming', emoji: '🎮' },
  { id: 'photography', label: 'Photography', emoji: '📷' },
  { id: 'reading', label: 'Reading', emoji: '📚' },
  { id: 'art', label: 'Art', emoji: '🎨' },
  { id: 'coffee', label: 'Coffee', emoji: '☕' },
  { id: 'hiking', label: 'Hiking', emoji: '🥾' },
  { id: 'dancing', label: 'Dancing', emoji: '💃' },
  { id: 'cooking', label: 'Cooking', emoji: '👨‍🍳' },
  { id: 'tech', label: 'Tech', emoji: '💻' },
  { id: 'fashion', label: 'Fashion', emoji: '👗' },
  { id: 'yoga', label: 'Yoga', emoji: '🧘' },
  { id: 'pets', label: 'Pets', emoji: '🐾' },
  { id: 'nature', label: 'Nature', emoji: '🌿' },
  { id: 'sports', label: 'Sports', emoji: '⚽' },
  { id: 'nightlife', label: 'Nightlife', emoji: '🌙' },
  { id: 'writing', label: 'Writing', emoji: '✍️' },
  { id: 'languages', label: 'Languages', emoji: '🌍' },
  { id: 'volunteering', label: 'Volunteering', emoji: '🤝' },
  { id: 'spirituality', label: 'Spirituality', emoji: '🕊️' },
];

const MIN_SELECTIONS = 1;
const MAX_SELECTIONS = 5;

export default function InterestsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (!data.user) {
          router.push('/auth');
        } else if (!data.user.username) {
          router.push('/onboarding');
        } else if (data.user.interests) {
          try {
            setSelected(JSON.parse(data.user.interests));
          } catch { /* ignore */ }
        }
      });
  }, [router]);

  const toggleInterest = (id: string) => {
    if (selected.includes(id)) {
      setSelected(selected.filter((i) => i !== id));
    } else if (selected.length < MAX_SELECTIONS) {
      setSelected([...selected, id]);
    } else {
      toast.warning(`You can select up to ${MAX_SELECTIONS} interests`);
    }
  };

  const handleSubmit = async () => {
    if (selected.length < MIN_SELECTIONS) {
      toast.error(`Please select at least ${MIN_SELECTIONS} interest`);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/user/interests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interests: selected }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to save interests');
        return;
      }
      toast.success('Interests saved! Now add your photos');
      router.push('/onboarding/photos');
    } catch {
      toast.error('Connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuroraBackground>
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
        <div className="mb-6 text-center animate-fade-in-up">
          <div className="mb-2 inline-flex items-center justify-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-warm shadow-lg shadow-primary/30">
              <Heart className="h-5 w-5 text-white fill-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight">Amori</span>
          </div>
        </div>

        <OnboardingStepper currentStep={1} />

        <Card className="w-full max-w-2xl glass border-border/50 shadow-2xl shadow-primary/10 animate-scale-in">
          <CardHeader className="space-y-1 text-center pb-4">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Heart className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-2xl">What Are You Into?</CardTitle>
            <CardDescription>
              Pick {MIN_SELECTIONS}–{MAX_SELECTIONS} interests that define you. We'll match you with like-minded people.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Counter */}
            <div className="flex items-center justify-center gap-2 mb-5">
              <div className="flex gap-1.5">
                {Array.from({ length: MAX_SELECTIONS }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'h-2.5 rounded-full transition-all duration-300',
                      i < selected.length ? 'bg-primary w-8' : 'bg-border w-2.5'
                    )}
                  />
                ))}
              </div>
              <span className="text-sm font-medium text-muted-foreground ml-2">
                {selected.length}/{MAX_SELECTIONS}
              </span>
            </div>

            {/* Interest grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6">
              {INTERESTS.map((interest) => {
                const isSelected = selected.includes(interest.id);
                return (
                  <button
                    key={interest.id}
                    type="button"
                    onClick={() => toggleInterest(interest.id)}
                    className={cn(
                      'relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 p-4 transition-all duration-300 group hover:scale-105',
                      isSelected
                        ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
                        : 'border-border hover:border-primary/40 hover:bg-secondary/50'
                    )}
                  >
                    <span className={cn(
                      'text-3xl transition-transform duration-300',
                      isSelected ? 'scale-125' : 'group-hover:scale-110'
                    )}>
                      {interest.emoji}
                    </span>
                    <span className={cn(
                      'text-sm font-medium transition-colors',
                      isSelected ? 'text-primary' : 'text-foreground'
                    )}>
                      {interest.label}
                    </span>
                    {isSelected && (
                      <div className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary animate-scale-in">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/onboarding')}
                className="h-12 px-6 hover:bg-secondary/50 transition-all duration-300"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={loading || selected.length < MIN_SELECTIONS}
                className="flex-1 bg-gradient-warm text-white shadow-lg shadow-primary/30 hover:shadow-primary/40 hover:scale-[1.02] transition-all duration-300 h-12 text-base font-semibold disabled:opacity-50 disabled:hover:scale-100"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    Continue
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuroraBackground>
  );
}
