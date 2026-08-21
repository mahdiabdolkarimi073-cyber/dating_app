'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Heart,
  Loader2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Check,
  ChevronDown,
  Shield,
  Lock,
  Pencil,
  CheckCircle2,
} from 'lucide-react';

type User = {
  name: string | null;
  username: string | null;
  interests: string | null;
  photos: string | null;
  termsAccepted?: boolean;
};

const TRUST_FEATURES = [
  {
    title: 'Your Data is Safe',
    description: 'Encrypted and never sold to third parties.',
    icon: Shield,
  },
  {
    title: 'You Stay in Control',
    description: 'Manage your privacy settings anytime.',
    icon: Lock,
  },
  {
    title: 'Real Connections',
    description: 'Verified profiles, genuine interactions.',
    icon: Heart,
  },
];

const PRIVACY_ITEMS = [
  'Your information stays private',
  'You control what you share',
  'Photos are protected',
  'You can update your profile anytime',
];

export default function TermsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [user, setUser] = useState<User | null>(null);

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
        setLoading(false);
        return;
      }
      setSuccess(true);
      setTimeout(() => {
        router.push('/discover');
      }, 1400);
    } catch {
      toast.error('Connection error');
      setLoading(false);
    }
  };

  const parsedInterests = user?.interests ? JSON.parse(user.interests) : [];
  const photoCount = user?.photos ? JSON.parse(user.photos).length : 0;

  const summaryRows = [
    { label: 'Name', value: user?.name || '—', editPath: '/onboarding' },
    { label: 'Username', value: `@${user?.username || '—'}`, editPath: '/onboarding' },
    { label: 'Interests', value: `${parsedInterests.length} selected`, editPath: '/onboarding/interests' },
    { label: 'Photos', value: `${photoCount} uploaded`, editPath: '/onboarding/photos' },
  ];

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#FFFBFD]">
      {/* Background gradients */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -bottom-32 -left-20 h-[520px] w-[520px] rounded-full opacity-[0.10] blur-[120px]"
          style={{ background: 'radial-gradient(circle, #F6C6DC 0%, transparent 70%)' }}
        />
        <div
          className="absolute -top-32 -right-24 h-[560px] w-[560px] rounded-full opacity-[0.10] blur-[130px]"
          style={{ background: 'radial-gradient(circle, #E7C9F4 0%, transparent 70%)' }}
        />
        <Heart className="absolute left-[8%] top-[20%] h-7 w-7 fill-[#FF3D78] text-[#FF3D78] opacity-[0.07]" />
        <Heart className="absolute right-[12%] bottom-[22%] h-6 w-6 fill-[#9844D7] text-[#9844D7] opacity-[0.06]" />
        <Heart className="absolute left-[44%] top-[8%] h-5 w-5 fill-[#FF3D78] text-[#FF3D78] opacity-[0.05]" />
        <Heart className="absolute right-[30%] bottom-[8%] h-8 w-8 fill-[#E83382] text-[#E83382] opacity-[0.08]" />
        <Heart className="absolute left-[24%] bottom-[14%] h-4 w-4 fill-[#A143D5] text-[#A143D5] opacity-[0.09]" />
      </div>

      {/* Header */}
      <header className="relative z-20 mx-auto flex h-16 max-w-[1440px] items-center justify-between px-6 md:px-10 lg:px-12 border-b border-[#F2E9EF] bg-[rgba(255,255,255,0.95)]">
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
          <div className="hidden h-7 w-7 rounded-full bg-gradient-to-br from-[#FF8AB8] to-[#C968E8] sm:block" />
          <ChevronDown className="hidden h-3.5 w-3.5 text-[#9A8E96] sm:block" />
        </div>
      </header>

      {/* Stepper */}
      <div className="relative z-10 mx-auto mt-8 flex w-full max-w-[560px] justify-center px-4">
        <div className="flex w-full items-center justify-between">
          {['Profile', 'Interests', 'Photos', 'Terms'].map((label, i) => {
            const completed = i < 3;
            const active = i === 3;
            return (
              <div key={label} className="flex flex-1 items-center last:flex-none">
                <div className="flex flex-col items-center gap-[7px]">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-all duration-300 ${
                      completed
                        ? 'text-white shadow-[0_4px_14px_rgba(232,58,126,0.30)]'
                        : active
                          ? 'text-white shadow-[0_4px_14px_rgba(232,58,126,0.30)] ring-[3px] ring-[#FFE0EF]/60 scale-110'
                          : 'bg-[#F3EDF1] text-[#81757D]'
                    }`}
                    style={
                      completed || active
                        ? { background: 'linear-gradient(135deg, #EC3A82 0%, #9945D5 100%)' }
                        : undefined
                    }
                  >
                    {completed ? <Check className="h-4 w-4" /> : i + 1}
                  </div>
                  <span
                    className={`text-[12px] font-semibold transition-colors ${
                      active ? 'text-[#E82F78]' : 'text-[#81757D]'
                    }`}
                  >
                    {label}
                  </span>
                </div>
                {i < 3 && (
                  <div
                    className={`mx-1 h-px flex-1 sm:mx-2 ${completed ? 'bg-[#E83A7E]' : 'bg-[#E8DDE4]'}`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main content */}
      <main className="relative z-10 mx-auto mt-8 max-w-[1440px] px-6 pb-16 md:px-10 lg:px-12">
        <div className="grid grid-cols-1 items-start gap-7 lg:grid-cols-[22%_56%_22%] lg:gap-9">
          {/* LEFT - Intro */}
          <section className="hidden lg:block">
            <h1 className="text-[36px] font-extrabold leading-[1.05] text-[#1A121A]">
              One{' '}
              <span
                className="bg-clip-text text-transparent"
                style={{ background: 'linear-gradient(135deg, #E83382 0%, #A143D5 100%)', WebkitBackgroundClip: 'text' }}
              >
                Last
              </span>{' '}
              Step
            </h1>
            <p className="mt-[22px] max-w-[230px] text-[14px] leading-[1.55] text-[#766B73]">
              Review your profile and accept our terms to finish setting up your Amori account.
            </p>
            <div className="mt-7 flex flex-col gap-[24px]">
              {TRUST_FEATURES.map((f) => (
                <div key={f.title} className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[13px] border border-[#F8D7E5] bg-[#FFF0F6]">
                    <f.icon className="h-5 w-5 text-[#ED3A7D]" strokeWidth={2} />
                  </div>
                  <div className="pt-0.5">
                    <h3 className="text-[13.5px] font-bold text-[#292229]">{f.title}</h3>
                    <p className="mt-0.5 max-w-[200px] text-[11.5px] leading-[1.45] text-[#81757D]">{f.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* CENTER - Terms Card */}
          <section className="mx-auto w-full max-w-[780px] lg:mx-0">
            <div
              className="rounded-[22px] border border-[#F0E7ED] bg-[rgba(255,255,255,0.96)] p-7 shadow-[0_18px_55px_rgba(85,30,65,0.07)] backdrop-blur-xl animate-scale-in sm:p-8"
            >
              {/* Card Header */}
              <div className="flex flex-col items-center text-center">
                <div className="flex h-[42px] w-[42px] items-center justify-center rounded-full bg-[#FFF0F6]">
                  <ShieldCheck className="h-5 w-5 text-[#ED3A7D]" />
                </div>
                <h2 className="mt-2.5 text-[23px] font-extrabold text-[#1A121A]">Almost There!</h2>
                <p className="mt-1 text-[13px] text-[#837680]">Review your profile and accept our terms to finish</p>
              </div>

              {/* Profile Summary Box */}
              <div className="mt-4 rounded-[12px] border border-[#EEE4E9] bg-[#FBF7F9] p-4">
                {summaryRows.map((row, i) => (
                  <div
                    key={row.label}
                    className={`group flex items-center justify-between ${i > 0 ? 'mt-[11px]' : ''}`}
                  >
                    <span className="text-[12.5px] text-[#887782]">{row.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="max-w-[180px] truncate text-right text-[12.5px] font-bold text-[#292229]">
                        {row.value}
                      </span>
                      <button
                        onClick={() => router.push(row.editPath)}
                        className="text-[#E83A7D] opacity-0 transition-opacity group-hover:opacity-100"
                        title={`Edit ${row.label}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Terms Agreement Box */}
              <div className="mt-[18px] rounded-[12px] border border-[#E9DDE4] bg-white p-4">
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => setAccepted(!accepted)}
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] border-[1.5px] transition-all duration-200 ${
                      accepted
                        ? 'border-[#E83A7D] bg-[#E83A7D] shadow-[0_0_0_3px_rgba(232,58,125,0.15)]'
                        : 'border-[#E83A7D] bg-white hover:bg-[#FFF4F8]'
                    }`}
                    aria-label="Accept terms"
                  >
                    {accepted && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
                  </button>
                  <label
                    onClick={() => setAccepted(!accepted)}
                    className="flex-1 cursor-pointer text-[12.5px] font-semibold leading-[1.55] text-[#332B31]"
                  >
                    I agree to Amori&apos;s{' '}
                    <a
                      href="/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="font-bold text-[#E8337D] underline decoration-[#E8337D]/30 underline-offset-2 hover:decoration-[#E8337D]"
                    >
                      Terms of Service
                    </a>
                    ,{' '}
                    <a
                      href="/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="font-bold text-[#E8337D] underline decoration-[#E8337D]/30 underline-offset-2 hover:decoration-[#E8337D]"
                    >
                      Privacy Policy
                    </a>
                    , and{' '}
                    <a
                      href="/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="font-bold text-[#E8337D] underline decoration-[#E8337D]/30 underline-offset-2 hover:decoration-[#E8337D]"
                    >
                      Community Guidelines
                    </a>
                    . I confirm that I am at least 18 years old.
                  </label>
                </div>
              </div>

              {/* Bottom Navigation */}
              <div className="mt-[20px] flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/onboarding/photos')}
                  className="h-[43px] w-[110px] shrink-0 rounded-[10px] border-[#E8DEE5] bg-white text-[13px] font-semibold text-[#5A4F57] hover:bg-[#FAF7F9]"
                >
                  <ArrowLeft className="mr-1.5 h-4 w-4" />
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading || success || !accepted}
                  className="h-[43px] flex-1 rounded-[11px] border-0 text-[13px] font-bold text-white transition-all duration-200 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
                  style={
                    accepted && !loading && !success
                      ? {
                          background: 'linear-gradient(135deg, #FF3977 0%, #A23ED5 100%)',
                          boxShadow: '0 8px 20px rgba(225,45,115,0.18)',
                        }
                      : {
                          background: 'linear-gradient(135deg, #F39ABD 0%, #D59BE0 100%)',
                          opacity: 0.65,
                          boxShadow: 'none',
                        }
                  }
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating your profile...
                    </>
                  ) : success ? (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Profile created!
                    </>
                  ) : (
                    <>
                      Enter Amori
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </section>

          {/* RIGHT - Privacy Card */}
          <aside className="hidden lg:block">
            <div className="rounded-[18px] border border-[#F3DCE8] bg-[rgba(255,247,251,0.78)] p-5 pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-[40px] w-[40px] items-center justify-center rounded-full bg-[#FFF0F6]">
                  <Shield className="h-5 w-5 text-[#ED3A7D]" />
                </div>
                <h3 className="mt-2.5 text-[14.5px] font-bold text-[#292229]">Your Privacy Matters</h3>
              </div>
              <div className="mt-5 flex flex-col gap-[14px]">
                {PRIVACY_ITEMS.map((item) => (
                  <div key={item} className="flex items-start gap-2.5">
                    <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#FFE0EF]">
                      <Check className="h-2.5 w-2.5 text-[#E83A7E]" strokeWidth={3} />
                    </div>
                    <p className="text-[11.5px] leading-[1.5] text-[#756A73]">{item}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex items-center justify-center gap-1.5 border-t border-[#F3DCE8] pt-4">
                <Lock className="h-3.5 w-3.5 text-[#E83A7D]" />
                <p className="text-[11.5px] font-semibold text-[#E83A7D]">Secure &amp; private</p>
              </div>
            </div>
          </aside>
        </div>

        {/* Mobile Privacy Accordion */}
        <div className="mt-5 lg:hidden">
          <div className="rounded-[18px] border border-[#F3DCE8] bg-[rgba(255,247,251,0.78)] p-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FFF0F6]">
                <Shield className="h-4 w-4 text-[#ED3A7D]" />
              </div>
              <h3 className="text-[13px] font-bold text-[#292229]">Your Privacy Matters</h3>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2.5">
              {PRIVACY_ITEMS.map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-3 w-3 shrink-0 text-[#E83A7E]" strokeWidth={3} />
                  <p className="text-[11px] leading-[1.45] text-[#756A73]">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
