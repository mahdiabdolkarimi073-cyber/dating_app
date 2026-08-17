'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AuroraBackground } from '@/components/aurora-background';
import { OnboardingStepper } from '@/components/onboarding-stepper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Heart, Loader2, ArrowRight, ArrowLeft, ShieldCheck, FileText, ExternalLink } from 'lucide-react';

export default function TermsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [user, setUser] = useState<{ name: string | null; username: string | null; interests: string | null; photos: string | null } | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (!data.user) {
          router.push('/auth');
        } else if (!data.user.username) {
          router.push('/onboarding');
        } else if (!data.user.interests) {
          router.push('/onboarding/interests');
        } else if (!data.user.photos) {
          router.push('/onboarding/photos');
        } else {
          setUser(data.user);
          if (data.user.termsAccepted) {
            router.push('/discover');
          }
        }
      });
  }, [router]);

  const handleSubmit = async () => {
    if (!accepted) {
      toast.error('Please accept the terms to continue');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/user/terms', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accepted: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to accept terms');
        return;
      }
      toast.success('Welcome to Amori! Your profile is ready');
      router.push('/discover');
    } catch {
      toast.error('Connection error');
    } finally {
      setLoading(false);
    }
  };

  const parsedInterests = user?.interests ? JSON.parse(user.interests) : [];
  const photoCount = user?.photos ? JSON.parse(user.photos).length : 0;

  return (
    <AuroraBackground>
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
        <div className="mb-6 text-center animate-fade-in-up">
          <div className="mb-2 inline-flex items-center justify-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-romance shadow-lg shadow-primary/30">
              <Heart className="h-5 w-5 text-white fill-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight">Amori</span>
          </div>
        </div>

        <OnboardingStepper currentStep={3} />

        <Card className="w-full max-w-lg glass border-border/50 shadow-2xl shadow-primary/10 animate-scale-in">
          <CardHeader className="space-y-1 text-center pb-4">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-2xl">Almost There!</CardTitle>
            <CardDescription>Review your profile and accept our terms to finish</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Profile summary */}
            <div className="rounded-xl bg-secondary/50 border border-border/50 p-4 mb-5 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Name</span>
                <span className="font-medium">{user?.name || '—'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Username</span>
                <span className="font-medium">@{user?.username || '—'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Interests</span>
                <span className="font-medium">{parsedInterests.length} selected</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Photos</span>
                <span className="font-medium">{photoCount} uploaded</span>
              </div>
            </div>

            {/* Terms checkbox */}
            <div className="rounded-xl border-2 border-border p-4 mb-5 hover:border-primary/30 transition-colors">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="terms"
                  checked={accepted}
                  onCheckedChange={(v) => setAccepted(v === true)}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <label htmlFor="terms" className="text-sm font-medium cursor-pointer leading-relaxed">
                    I agree to Amori&apos;s{' '}
                    <a
                      href="/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary font-semibold hover:underline inline-flex items-center gap-0.5"
                    >
                      Terms of Service
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    , Privacy Policy, and Community Guidelines. I confirm that I am at least 18 years old.
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/onboarding/photos')}
                className="h-12 px-6 hover:bg-secondary/50 transition-all duration-300"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={loading || !accepted}
                className="flex-1 bg-gradient-romance text-white shadow-lg shadow-primary/30 hover:shadow-primary/40 hover:scale-[1.02] transition-all duration-300 h-12 text-base font-semibold disabled:opacity-50 disabled:hover:scale-100"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Heart className="h-4 w-4 mr-2 fill-white" />
                    Enter Amori
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
