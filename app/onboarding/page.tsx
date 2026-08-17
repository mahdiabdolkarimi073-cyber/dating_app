'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AuroraBackground } from '@/components/aurora-background';
import { OnboardingStepper } from '@/components/onboarding-stepper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Heart, User, AtSign, Calendar, Users, Loader2, Check, X, PenLine, ArrowRight } from 'lucide-react';

type Gender = 'male' | 'female' | 'other';

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<Gender | ''>('');
  const [bio, setBio] = useState('');

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (!data.user) {
          router.push('/auth');
        } else if (data.user.name) {
          setName(data.user.name);
        }
      });
  }, [router]);

  useEffect(() => {
    if (username.length < 3) {
      setUsernameAvailable(null);
      return;
    }
    const timer = setTimeout(async () => {
      setCheckingUsername(true);
      try {
        const res = await fetch('/api/user/check-username', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username }),
        });
        const data = await res.json();
        setUsernameAvailable(data.available);
      } catch {
        setUsernameAvailable(null);
      } finally {
        setCheckingUsername(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [username]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !username || !birthDate || !gender) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (!usernameAvailable) {
      toast.error('Username is not available');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, username, birthDate, gender, bio }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to save profile');
        return;
      }
      toast.success('Profile saved! Now pick your interests');
      router.push('/onboarding/interests');
    } catch {
      toast.error('Connection error');
    } finally {
      setLoading(false);
    }
  };

  const genderOptions: { value: Gender; label: string; emoji: string }[] = [
    { value: 'male', label: 'Male', emoji: '♂' },
    { value: 'female', label: 'Female', emoji: '♀' },
    { value: 'other', label: 'Other', emoji: '⚧' },
  ];

  return (
    <AuroraBackground>
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
        {/* Logo */}
        <div className="mb-6 text-center animate-fade-in-up">
          <div className="mb-2 inline-flex items-center justify-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-romance shadow-lg shadow-primary/30">
              <Heart className="h-5 w-5 text-white fill-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight">Amori</span>
          </div>
        </div>

        <OnboardingStepper currentStep={0} />

        <Card className="w-full max-w-lg glass border-border/50 shadow-2xl shadow-primary/10 animate-scale-in">
          <CardHeader className="space-y-1 text-center pb-4">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <PenLine className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-2xl">Build Your Profile</CardTitle>
            <CardDescription>Enter your details to find the best matches</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  Name <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Your display name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="username">
                  Username (ID) <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="username"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value.toLowerCase().replace(/\s/g, ''));
                      setUsernameAvailable(null);
                    }}
                    className="pl-10 pr-10"
                    required
                    minLength={3}
                  />
                  {checkingUsername && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                  {!checkingUsername && usernameAvailable === true && username.length >= 3 && (
                    <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                  )}
                  {!checkingUsername && usernameAvailable === false && username.length >= 3 && (
                    <X className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive" />
                  )}
                </div>
                {usernameAvailable === false && (
                  <p className="text-xs text-destructive animate-fade-in">This username is already taken</p>
                )}
                {usernameAvailable === true && (
                  <p className="text-xs text-green-500 animate-fade-in">This username is available!</p>
                )}
                {!usernameAvailable && username.length > 0 && username.length < 3 && (
                  <p className="text-xs text-muted-foreground">At least 3 characters (letters, numbers, dot, underscore)</p>
                )}
              </div>

              {/* Birth Date */}
              <div className="space-y-2">
                <Label htmlFor="birthDate">
                  Date of Birth <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                  <Input
                    id="birthDate"
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">You must be at least 18 years old to use Amori</p>
              </div>

              {/* Gender */}
              <div className="space-y-2">
                <Label>
                  Gender <span className="text-destructive">*</span>
                </Label>
                <div className="grid grid-cols-3 gap-3">
                  {genderOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setGender(opt.value)}
                      className={`relative flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 p-4 transition-all duration-300 ${
                        gender === opt.value
                          ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20 scale-[1.02]'
                          : 'border-border hover:border-primary/40 hover:bg-secondary/50'
                      }`}
                    >
                      <span className={`text-2xl transition-transform ${gender === opt.value ? 'scale-110' : ''}`}>
                        {opt.emoji}
                      </span>
                      <span className={`text-sm font-medium ${gender === opt.value ? 'text-primary' : 'text-foreground'}`}>
                        {opt.label}
                      </span>
                      {gender === opt.value && (
                        <div className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio" className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  Bio
                </Label>
                <Textarea
                  id="bio"
                  placeholder="Write a few lines about yourself... your interests, passions, what you're looking for"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  maxLength={500}
                  className="resize-none"
                />
                <div className="flex justify-end">
                  <span className="text-xs text-muted-foreground">{bio.length}/500</span>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading || !usernameAvailable}
                className="w-full bg-gradient-romance text-white shadow-lg shadow-primary/30 hover:shadow-primary/40 hover:scale-[1.02] transition-all duration-300 h-12 text-base font-semibold disabled:opacity-50 disabled:hover:scale-100"
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
            </form>
          </CardContent>
        </Card>
      </div>
    </AuroraBackground>
  );
}
