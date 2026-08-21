'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Heart,
  User,
  AtSign,
  Calendar,
  Users,
  Loader2,
  Check,
  X,
  PenLine,
  ArrowRight,
  ArrowLeft,
  Shield,
  Sparkles,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';

type Gender = 'male' | 'female' | 'other';

const BENEFITS = [
  {
    title: 'Better Matches',
    description: 'A complete profile gets up to 3x more quality matches.',
    icon: Sparkles,
  },
  {
    title: 'Safe & Secure',
    description: 'Your information is private and protected.',
    icon: ShieldCheck,
  },
  {
    title: 'Real Connections',
    description: 'Be yourself and attract the right people.',
    icon: Heart,
  },
];

const TIPS = [
  'Add a clear profile photo',
  'Write a bio that shows your personality',
  'Be honest about your interests',
  'Complete all steps for better matches',
];

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

  const maxBirthDate = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 18);
    return d.toISOString().split('T')[0];
  })();

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
    <div className="relative min-h-screen w-full overflow-hidden bg-[#FFFBFD]">
      {/* Background gradients */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -bottom-32 -left-20 h-[520px] w-[520px] rounded-full opacity-[0.10] blur-[120px]"
          style={{ background: 'radial-gradient(circle, #F6B9D5 0%, transparent 70%)' }}
        />
        <div
          className="absolute -top-32 -right-24 h-[560px] w-[560px] rounded-full opacity-[0.10] blur-[130px]"
          style={{ background: 'radial-gradient(circle, #DDBAF3 0%, transparent 70%)' }}
        />
        <Heart className="absolute left-[8%] top-[20%] h-7 w-7 fill-[#FF3D78] text-[#FF3D78] opacity-[0.08]" />
        <Heart className="absolute right-[12%] bottom-[22%] h-6 w-6 fill-[#9844D7] text-[#9844D7] opacity-[0.07]" />
        <Heart className="absolute left-[44%] top-[8%] h-5 w-5 fill-[#FF3D78] text-[#FF3D78] opacity-[0.06]" />
        <Heart className="absolute right-[30%] bottom-[8%] h-8 w-8 fill-[#E83382] text-[#E83382] opacity-[0.09]" />
        <Heart className="absolute left-[24%] bottom-[14%] h-4 w-4 fill-[#A143D5] text-[#A143D5] opacity-[0.10]" />
      </div>

      {/* Header */}
      <header className="relative z-20 mx-auto flex h-16 max-w-[1440px] items-center justify-between px-6 md:px-10 lg:px-12">
        <button onClick={() => router.push('/')} className="flex items-center gap-2.5">
          <div
            className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] shadow-md"
            style={{
              background: 'linear-gradient(135deg, #FF3D78 0%, #9844D7 100%)',
              boxShadow: '0 6px 16px rgba(255,61,120,0.30)',
            }}
          >
            <Heart className="h-[18px] w-[18px] fill-white text-white" />
          </div>
          <span className="text-[22px] font-extrabold tracking-tight text-[#181318]">Amori</span>
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/discover')}
            className="text-[13px] font-semibold text-[#756A73] transition-colors hover:text-[#1A121A]"
          >
            Save &amp; Exit
          </button>
          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-[#FF8AB8] to-[#C968E8]" />
          <ChevronDown className="h-3.5 w-3.5 text-[#9A8E96]" />
        </div>
      </header>

      {/* Stepper */}
      <div className="relative z-10 mx-auto mt-8 flex w-full max-w-[560px] justify-center px-4">
        <div className="flex w-full items-center justify-between">
          {['Profile', 'Interests', 'Photos', 'Terms'].map((label, i) => (
            <div key={label} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center gap-[7px]">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-all duration-300 ${
                    i === 0
                      ? 'text-white shadow-[0_4px_14px_rgba(232,58,126,0.30)] ring-4 ring-[#FFE0EF]/60'
                      : 'bg-[#F3EDF1] text-[#81757D]'
                  }`}
                  style={
                    i === 0
                      ? { background: 'linear-gradient(135deg, #FF3D78 0%, #9844D7 100%)' }
                      : undefined
                  }
                >
                  {i === 0 ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <span
                  className={`text-[12px] font-semibold transition-colors ${
                    i === 0 ? 'text-[#E82F78]' : 'text-[#81757D]'
                  }`}
                >
                  {label}
                </span>
              </div>
              {i < 3 && (
                <div className="mx-1 h-px flex-1 bg-[#E8DDE4] sm:mx-2" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <main className="relative z-10 mx-auto mt-8 max-w-[1440px] px-6 pb-16 md:px-10 lg:px-12">
        <div className="grid grid-cols-1 items-start gap-7 lg:grid-cols-[24%_56%_20%] lg:gap-9">
          {/* LEFT - Intro */}
          <section className="hidden lg:block">
            <h1 className="text-[36px] font-extrabold leading-[1.05] text-[#1A121A]">
              Let&apos;s build
              <br />
              your{' '}
              <span
                className="bg-clip-text text-transparent"
                style={{ background: 'linear-gradient(135deg, #E83382 0%, #A143D5 100%)', WebkitBackgroundClip: 'text' }}
              >
                profile
              </span>
              <Heart className="ml-1.5 inline-block h-8 w-8 fill-none text-[#E83382] align-middle" strokeWidth={2} />
            </h1>
            <p className="mt-[22px] max-w-[230px] text-[14px] leading-[1.55] text-[#766B73]">
              The more details you add, the better your matches will be.
            </p>
            <div className="mt-7 flex flex-col gap-[24px]">
              {BENEFITS.map((b) => (
                <div key={b.title} className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[13px] border border-[#F8D7E5] bg-[#FFF0F6]">
                    <b.icon className="h-5 w-5 text-[#ED3A7D]" strokeWidth={2} />
                  </div>
                  <div className="pt-0.5">
                    <h3 className="text-[13.5px] font-bold text-[#292229]">{b.title}</h3>
                    <p className="mt-0.5 max-w-[200px] text-[11.5px] leading-[1.45] text-[#81757D]">{b.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* CENTER - Form Card */}
          <section className="mx-auto w-full max-w-[680px] lg:mx-0">
            <div
              className="rounded-[22px] border border-[#F0E7ED] bg-[rgba(255,255,255,0.94)] p-7 shadow-[0_18px_55px_rgba(85,30,65,0.07)] backdrop-blur-xl animate-scale-in sm:p-8"
            >
              {/* Header */}
              <div className="flex flex-col items-center text-center">
                <div className="flex h-[42px] w-[42px] items-center justify-center rounded-full bg-[#FFF0F6]">
                  <PenLine className="h-5 w-5 text-[#ED3A7D]" />
                </div>
                <h2 className="mt-2.5 text-[23px] font-extrabold text-[#1A121A]">Build Your Profile</h2>
                <p className="mt-1 text-[13px] text-[#837680]">Enter your details to find the best matches</p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="mt-7">
                {/* Name */}
                <div>
                  <Label htmlFor="name" className="text-[12.5px] font-bold text-[#292229]">
                    Name <span className="text-[#E84A70]">*</span>
                  </Label>
                  <div className="relative mt-[7px]">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#B5A7AF]" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Your display name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-[44px] rounded-[11px] border border-[#E9DEE5] bg-[#FFFCFD] pl-10 pr-3 text-[13px] text-[#1A121A] placeholder:text-[#8A7D85] focus-visible:ring-0 focus:border-[#E83A7E] focus:shadow-[0_0_0_3px_rgba(232,58,126,0.06)] transition-all duration-200"
                      required
                    />
                  </div>
                </div>

                {/* Username */}
                <div className="mt-[17px]">
                  <Label htmlFor="username" className="text-[12.5px] font-bold text-[#292229]">
                    Username (ID) <span className="text-[#E84A70]">*</span>
                  </Label>
                  <div className="relative mt-[7px]">
                    <AtSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#B5A7AF]" />
                    <Input
                      id="username"
                      type="text"
                      placeholder="username"
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value.toLowerCase().replace(/\s/g, ''));
                        setUsernameAvailable(null);
                      }}
                      className="h-[44px] rounded-[11px] border border-[#E9DEE5] bg-[#FFFCFD] pl-10 pr-10 text-[13px] text-[#1A121A] placeholder:text-[#8A7D85] focus-visible:ring-0 focus:border-[#E83A7E] focus:shadow-[0_0_0_3px_rgba(232,58,126,0.06)] transition-all duration-200"
                      required
                      minLength={3}
                    />
                    {checkingUsername && (
                      <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[#B5A7AF]" />
                    )}
                    {!checkingUsername && usernameAvailable === true && username.length >= 3 && (
                      <Check className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-green-500" />
                    )}
                    {!checkingUsername && usernameAvailable === false && username.length >= 3 && (
                      <X className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#E84A70]" />
                    )}
                  </div>
                  {usernameAvailable === false && (
                    <p className="mt-1.5 text-[11px] text-[#E84A70]">This username is already taken</p>
                  )}
                  {usernameAvailable === true && (
                    <p className="mt-1.5 text-[11px] text-green-500">This username is available!</p>
                  )}
                  {!usernameAvailable && (
                    <p className="mt-1.5 text-[11px] text-[#897C84]">This will be your unique ID on Amori</p>
                  )}
                </div>

                {/* Birth Date */}
                <div className="mt-[17px]">
                  <Label htmlFor="birthDate" className="text-[12.5px] font-bold text-[#292229]">
                    Date of Birth <span className="text-[#E84A70]">*</span>
                  </Label>
                  <div className="relative mt-[7px]">
                    <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#B5A7AF] pointer-events-none z-10" />
                    <Input
                      id="birthDate"
                      type="date"
                      value={birthDate}
                      max={maxBirthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      className="h-[44px] rounded-[11px] border border-[#E9DEE5] bg-[#FFFCFD] pl-10 pr-3 text-[13px] text-[#1A121A] placeholder:text-[#8A7D85] focus-visible:ring-0 focus:border-[#E83A7E] focus:shadow-[0_0_0_3px_rgba(232,58,126,0.06)] transition-all duration-200"
                      required
                    />
                  </div>
                  <p className="mt-1.5 text-[11px] text-[#8A7C85]">
                    You must be at least 18 years old — the calendar only allows dates up to 18 years ago.
                  </p>
                </div>

                {/* Gender */}
                <div className="mt-[17px]">
                  <Label className="text-[12.5px] font-bold text-[#292229]">
                    Gender <span className="text-[#E84A70]">*</span>
                  </Label>
                  <div className="mt-[7px] grid grid-cols-3 gap-3">
                    {genderOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setGender(opt.value)}
                        className={`flex h-[66px] flex-col items-center justify-center gap-1.5 rounded-[11px] border transition-all duration-200 ${
                          gender === opt.value
                            ? 'border-[1.5px] border-[#FF4A86] bg-[#FFF4F8] shadow-[0_4px_12px_rgba(255,74,134,0.10)]'
                            : 'border-[#E8DEE5] bg-white hover:bg-[#FFF9FB]'
                        }`}
                      >
                        <span className={`text-[21px] ${gender === opt.value ? 'text-[#E83A7E]' : 'text-[#81757D]'}`}>
                          {opt.emoji}
                        </span>
                        <span className={`text-[13px] font-semibold ${gender === opt.value ? 'text-[#E83A7E]' : 'text-[#5A4F57]'}`}>
                          {opt.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bio */}
                <div className="mt-[17px]">
                  <Label htmlFor="bio" className="flex items-center gap-1.5 text-[12.5px] font-bold text-[#292229]">
                    <Users className="h-4 w-4 text-[#B5A7AF]" />
                    Bio
                  </Label>
                  <Textarea
                    id="bio"
                    placeholder="Write a few lines about yourself... your interests, passions, what you're looking for"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    maxLength={500}
                    className="mt-[7px] h-[70px] resize-none rounded-[11px] border border-[#E9DEE5] bg-[#FFFCFD] p-3 text-[12.5px] text-[#1A121A] placeholder:text-[#8A7D85] focus-visible:ring-0 focus:border-[#E83A7E] focus:shadow-[0_0_0_3px_rgba(232,58,126,0.06)] transition-all duration-200"
                  />
                  <div className="mt-1 flex justify-end">
                    <span className="text-[11px] text-[#897C84]">{bio.length}/500</span>
                  </div>
                </div>

                {/* Buttons */}
                <div className="mt-6 flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/auth')}
                    className="h-[43px] w-[105px] shrink-0 rounded-[10px] border-[#E8DEE5] bg-white text-[13px] font-semibold text-[#5A4F57] hover:bg-[#FAF7F9]"
                  >
                    <ArrowLeft className="mr-1.5 h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || !usernameAvailable}
                    className="h-[43px] flex-1 rounded-[11px] border-0 text-[13px] font-bold text-white shadow-[0_8px_20px_rgba(225,45,115,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(225,45,115,0.26)] active:scale-[0.98] disabled:opacity-50 disabled:hover:translate-y-0"
                    style={{ background: 'linear-gradient(135deg, #FF3977 0%, #A23ED5 100%)' }}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        Continue
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>

            {/* Security note */}
            <div className="mt-[18px] flex items-center justify-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-[#B5A7AF]" />
              <p className="text-[11.5px] text-[#827680]">Your information is safe and secure</p>
            </div>
          </section>

          {/* RIGHT - Tips Card */}
          <aside className="hidden lg:block">
            <div
              className="relative rounded-[18px] border border-[#F3DCE8] bg-[rgba(255,247,251,0.75)] p-5 pt-7"
            >
              {/* Heart badge */}
              <div className="absolute -top-5 left-1/2 flex h-[46px] w-[46px] -translate-x-1/2 items-center justify-center rounded-full bg-white shadow-[0_6px_18px_rgba(255,61,120,0.18)]">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-full"
                  style={{ background: 'linear-gradient(135deg, #FF3D78 0%, #9844D7 100%)' }}
                >
                  <Heart className="h-4 w-4 fill-white text-white" />
                </div>
              </div>

              <h3 className="mt-3 text-center text-[13.5px] font-bold text-[#292229]">Tips for a great profile</h3>

              <div className="mt-5 flex flex-col gap-[17px]">
                {TIPS.map((tip) => (
                  <div key={tip} className="flex items-start gap-2.5">
                    <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#FFE0EF]">
                      <Check className="h-2.5 w-2.5 text-[#E83A7E]" strokeWidth={3} />
                    </div>
                    <p className="text-[11.5px] leading-[1.45] text-[#756A73]">{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
