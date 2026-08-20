'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Heart,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  Shield,
  ShieldCheck,
  Sparkles,
  Users,
  Star,
} from 'lucide-react';

const FEATURES = [
  {
    title: 'Smart Matching',
    description: 'AI-powered algorithm connects you with compatible people.',
    icon: Sparkles,
  },
  {
    title: 'Safe & Secure',
    description: 'Verified profiles and end-to-end encrypted messaging.',
    icon: ShieldCheck,
  },
  {
    title: 'Real Connections',
    description: 'Meet genuine people looking for meaningful relationships.',
    icon: Heart,
  },
];

const AVATARS = [
  'https://images.pexels.com/photos/1890033/pexels-photo-1890033.jpeg?auto=compress&cs=tinysrgb&w=80&h=80&fit=crop',
  'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=80&h=80&fit=crop',
  'https://images.pexels.com/photos/18355488/pexels-photo-18355488.jpeg?auto=compress&cs=tinysrgb&w=80&h=80&fit=crop',
  'https://images.pexels.com/photos/37159572/pexels-photo-37159572.jpeg?auto=compress&cs=tinysrgb&w=80&h=80&fit=crop',
];

const PORTRAIT_1 =
  'https://images.pexels.com/photos/1890033/pexels-photo-1890033.jpeg?auto=compress&cs=tinysrgb&w=440&h=620&fit=crop';
const PORTRAIT_2 =
  'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=420&h=620&fit=crop';

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="16" height="16">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.46 15.39 3.08 8.6 9.36 8.32c1.27.07 2.16.7 3 .7 1.1 0 1.84-.7 3.13-.7 1.36.07 2.4.6 3.1 1.5-2.84 1.66-2.72 5.74.46 6.85-.42 1.1-.96 2.17-2.01 3.61zM12.4 8.24c-.15-2.23 1.66-4.07 3.74-4.24.29 2.58-2.34 4.5-3.74 4.24z" />
    </svg>
  );
}

export default function AuthPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const validate = () => {
    const next: typeof errors = {};
    if (!loginEmail) next.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(loginEmail)) next.email = 'Enter a valid email';
    if (!loginPassword) next.password = 'Password is required';
    else if (loginPassword.length < 6) next.password = 'Password must be at least 6 characters';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Login failed');
        setLoading(false);
        return;
      }
      toast.success('Welcome back!');
      if (data.user?.termsAccepted) {
        router.push('/discover');
      } else if (data.user?.username) {
        router.push('/onboarding/interests');
      } else {
        router.push('/onboarding');
      }
    } catch {
      toast.error('Connection error');
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#FFFBFD]">
      {/* Background gradients */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -bottom-32 -left-20 h-[520px] w-[520px] rounded-full opacity-[0.12] blur-[120px]"
          style={{ background: 'radial-gradient(circle, #FF6FA8 0%, transparent 70%)' }}
        />
        <div
          className="absolute -top-32 -right-24 h-[560px] w-[560px] rounded-full opacity-[0.13] blur-[130px]"
          style={{ background: 'radial-gradient(circle, #C968E8 0%, transparent 70%)' }}
        />
        {/* Floating hearts */}
        <Heart className="absolute left-[8%] top-[18%] h-7 w-7 fill-[#FF3D78] text-[#FF3D78] opacity-[0.09]" />
        <Heart className="absolute right-[12%] bottom-[22%] h-6 w-6 fill-[#9844D7] text-[#9844D7] opacity-[0.08]" />
        <Heart className="absolute left-[44%] top-[8%] h-5 w-5 fill-[#FF3D78] text-[#FF3D78] opacity-[0.07]" />
        <Heart className="absolute right-[30%] bottom-[8%] h-8 w-8 fill-[#E83382] text-[#E83382] opacity-[0.10]" />
        <Heart className="absolute left-[24%] bottom-[14%] h-4 w-4 fill-[#A143D5] text-[#A143D5] opacity-[0.12]" />
      </div>

      {/* Header */}
      <header className="relative z-20 mx-auto flex h-[60px] max-w-[1360px] items-center justify-between px-6 md:px-10 lg:px-12">
        <div className="flex items-center gap-2.5">
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
        </div>
        <div className="flex items-center gap-3.5">
          <span className="hidden text-[13px] text-[#71666F] sm:inline">Don&apos;t have an account?</span>
          <button
            onClick={() => router.push('/auth?tab=register')}
            className="h-10 rounded-[12px] border border-[#F2B7D1] bg-white/70 px-5 text-[13px] font-semibold text-[#DD3478] transition-colors hover:bg-white"
          >
            Sign Up
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 mx-auto max-w-[1360px] px-6 md:px-10 lg:px-12">
        <div className="grid grid-cols-1 items-center gap-0 lg:grid-cols-[54%_46%] lg:gap-[60px] xl:gap-[70px]">
          {/* LEFT - Hero */}
          <section className="hidden lg:block lg:pl-8 xl:pl-10" style={{ minHeight: 'calc(100vh - 100px)' }}>
            <div className="flex h-full flex-col justify-center py-8">
              {/* Heading */}
              <h1
                className="max-w-[430px] text-[52px] font-extrabold leading-[1.05] text-[#1A121A] animate-fade-in-up"
                style={{ fontWeight: 800 }}
              >
                Welcome back
                <br />
                to{' '}
                <span
                  className="bg-clip-text text-transparent"
                  style={{ background: 'linear-gradient(135deg, #E83382 0%, #A143D5 100%)', WebkitBackgroundClip: 'text' }}
                >
                  Amori
                </span>
                <Heart className="ml-2 inline-block h-9 w-9 fill-none text-[#E83382] align-middle" strokeWidth={2} />
              </h1>

              {/* Description */}
              <p className="mt-[18px] max-w-[370px] text-[16px] leading-[1.5] text-[#766B73] animate-fade-in-up" style={{ animationDelay: '0.08s' }}>
                Log in to continue your journey and connect with amazing people.
              </p>

              {/* Features */}
              <div className="mt-8 flex flex-col gap-[26px] animate-fade-in-up" style={{ animationDelay: '0.16s' }}>
                {FEATURES.map((f) => (
                  <div key={f.title} className="flex items-start gap-3.5">
                    <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[14px] border border-[#FFE0EF] bg-[#FFF0F6]">
                      <f.icon className="h-5 w-5 text-[#ED3C7C]" strokeWidth={2} />
                    </div>
                    <div className="pt-1">
                      <h3 className="text-[14px] font-bold text-[#292229]">{f.title}</h3>
                      <p className="mt-0.5 max-w-[210px] text-[12.5px] leading-[1.45] text-[#81757C]">{f.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Image composition */}
              <div className="relative mt-9 h-[320px] w-full max-w-[460px] animate-fade-in-up" style={{ animationDelay: '0.24s' }}>
                {/* Dots pattern */}
                <div className="absolute left-2 top-6 grid grid-cols-4 gap-1.5 opacity-40">
                  {Array.from({ length: 16 }).map((_, i) => (
                    <span key={i} className="h-1 w-1 rounded-full bg-[#FF8AB8]" />
                  ))}
                </div>
                <div className="absolute right-4 bottom-4 grid grid-cols-3 gap-1.5 opacity-30">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <span key={i} className="h-1 w-1 rounded-full bg-[#C968E8]" />
                  ))}
                </div>

                {/* Portrait 1 */}
                <div
                  className="absolute left-0 top-0 h-[310px] w-[220px] overflow-hidden rounded-[18px] bg-[#FFE0EF] shadow-[0_18px_45px_rgba(60,20,50,0.14)]"
                  style={{ transform: 'rotate(-3deg)' }}
                >
                  <img src={PORTRAIT_1} alt="Happy member" className="h-full w-full object-cover" />
                </div>
                {/* Portrait 2 */}
                <div
                  className="absolute right-0 top-2 h-[310px] w-[210px] overflow-hidden rounded-[18px] bg-[#F5E0FA] shadow-[0_18px_45px_rgba(60,20,50,0.14)]"
                  style={{ transform: 'rotate(5deg)' }}
                >
                  <img src={PORTRAIT_2} alt="Happy member" className="h-full w-full object-cover" />
                </div>

                {/* Floating heart circle */}
                <div className="absolute left-1/2 top-[140px] flex h-[50px] w-[50px] -translate-x-1/2 items-center justify-center rounded-full bg-white shadow-[0_8px_24px_rgba(255,61,120,0.25)]">
                  <Heart className="h-6 w-6 fill-[#FF3D78] text-[#FF3D78]" />
                </div>

                {/* Badge: 2M+ Successful Matches */}
                <div className="absolute -right-2 top-[60px] flex items-center gap-2 rounded-[15px] bg-white px-3.5 py-3 shadow-[0_10px_30px_rgba(60,20,50,0.12)]">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FFF0F6]">
                    <Heart className="h-4 w-4 fill-[#FF3D78] text-[#FF3D78]" />
                  </div>
                  <div>
                    <p className="text-[15px] font-extrabold leading-tight text-[#1A121A]">2M+</p>
                    <p className="text-[10.5px] leading-tight text-[#81757C]">Successful Matches</p>
                  </div>
                </div>

                {/* Badge: 98% Verified Profiles */}
                <div className="absolute bottom-2 left-4 flex items-center gap-2 rounded-[15px] bg-white px-3.5 py-3 shadow-[0_10px_30px_rgba(60,20,50,0.12)]">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FFF6E6]">
                    <ShieldCheck className="h-4 w-4 text-[#F5A623]" />
                  </div>
                  <div>
                    <p className="text-[15px] font-extrabold leading-tight text-[#1A121A]">98%</p>
                    <p className="text-[10.5px] leading-tight text-[#81757C]">Verified Profiles</p>
                  </div>
                </div>

                {/* Small hearts */}
                <Heart className="absolute -left-3 bottom-10 h-4 w-4 fill-[#FF8AB8] text-[#FF8AB8] opacity-60" />
                <Heart className="absolute right-10 -top-2 h-3 w-3 fill-[#C968E8] text-[#C968E8] opacity-50" />
              </div>

              {/* Social proof */}
              <div className="mt-9 flex items-center gap-3 animate-fade-in-up" style={{ animationDelay: '0.32s' }}>
                <div className="flex items-center">
                  {AVATARS.map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt="Member"
                      className="h-8 w-8 rounded-full border-2 border-[#FFFBFD] object-cover"
                      style={{ marginLeft: i === 0 ? 0 : -7 }}
                    />
                  ))}
                </div>
                <div className="flex flex-col">
                  <span className="text-[14px] font-semibold text-[#292229]">Join 500K+ happy members</span>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="h-3 w-3 fill-[#F5B841] text-[#F5B841]" />
                      ))}
                    </div>
                    <span className="text-[12px] font-medium text-[#81757C]">4.9/5 (2M+ reviews)</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* RIGHT - Login Card */}
          <section className="flex items-center justify-center py-8 lg:py-0">
            <div
              className="w-full max-w-[540px] rounded-[22px] border border-[#F0E7ED] bg-white/95 p-7 shadow-[0_20px_60px_rgba(80,25,65,0.08)] backdrop-blur-xl animate-scale-in sm:p-9"
              style={{ minHeight: '590px' }}
            >
              {/* Lock icon */}
              <div className="mx-auto flex h-[46px] w-[46px] items-center justify-center rounded-full bg-[#FFF0F6]">
                <Lock className="h-5 w-5 text-[#E83A7E]" />
              </div>

              {/* Heading */}
              <h2 className="mt-4 text-center text-[26px] font-extrabold text-[#1A121A]">Log In</h2>
              <p className="mt-1.5 text-center text-[14px] text-[#81747D]">Welcome back! Please enter your details.</p>

              {/* Social login */}
              <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  className="flex h-[46px] items-center justify-center gap-2 rounded-[11px] border border-[#EEE5EB] bg-white text-[13px] font-semibold text-[#292229] transition-colors hover:bg-[#FAF7F9]"
                >
                  <GoogleIcon className="h-4 w-4" />
                  Continue with Google
                </button>
                <button
                  type="button"
                  className="flex h-[46px] items-center justify-center gap-2 rounded-[11px] border border-[#EEE5EB] bg-white text-[13px] font-semibold text-[#292229] transition-colors hover:bg-[#FAF7F9]"
                >
                  <AppleIcon className="h-4 w-4" />
                  Continue with Apple
                </button>
              </div>

              {/* Divider */}
              <div className="my-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-[#EEE7EC]" />
                <span className="text-[12px] text-[#9A8E96]">or</span>
                <div className="h-px flex-1 bg-[#EEE7EC]" />
              </div>

              {/* Form */}
              <form onSubmit={handleLogin} noValidate>
                {/* Email */}
                <div>
                  <Label htmlFor="login-email" className="text-[12.5px] font-bold text-[#292229]">
                    Email
                  </Label>
                  <div className="relative mt-2">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#B5A7AF]" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="Enter your email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className={`h-[45px] rounded-[11px] border bg-[#FFFCFD] pl-10 pr-3 text-[13px] text-[#1A121A] placeholder:text-[#8A7D85] focus-visible:ring-0 ${
                        errors.email ? 'border-[#E84A70]' : 'border-[#E9DEE5] focus:border-[#E83A7E]'
                      }`}
                    />
                  </div>
                  {errors.email && <p className="mt-1.5 text-[11.5px] text-[#E84A70]">{errors.email}</p>}
                </div>

                {/* Password */}
                <div className="mt-[18px]">
                  <Label htmlFor="login-password" className="text-[12.5px] font-bold text-[#292229]">
                    Password
                  </Label>
                  <div className="relative mt-2">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#B5A7AF]" />
                    <Input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className={`h-[45px] rounded-[11px] border bg-[#FFFCFD] pl-10 pr-10 text-[13px] text-[#1A121A] placeholder:text-[#8A7D85] focus-visible:ring-0 ${
                        errors.password ? 'border-[#E84A70]' : 'border-[#E9DEE5] focus:border-[#E83A7E]'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B5A7AF] transition-colors hover:text-[#E83A7E]"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="mt-1.5 text-[11.5px] text-[#E84A70]">{errors.password}</p>}
                </div>

                {/* Remember + Forgot */}
                <div className="mt-3.5 flex items-center justify-between">
                  <label className="flex cursor-pointer items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setRemember(!remember)}
                      className={`flex h-4 w-4 items-center justify-center rounded-[5px] border transition-colors ${
                        remember ? 'border-[#E83A7E] bg-[#E83A7E]' : 'border-[#D9CDD4] bg-white'
                      }`}
                    >
                      {remember && (
                        <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none">
                          <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </button>
                    <span className="text-[12.5px] text-[#5A4F57]">Remember me</span>
                  </label>
                  <a href="/auth?tab=forgot" className="text-[12px] font-semibold text-[#E4337B] hover:underline">
                    Forgot password?
                  </a>
                </div>

                {/* CTA */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="mt-6 h-[49px] w-full rounded-[12px] border-0 text-[14.5px] font-bold text-white shadow-[0_10px_25px_rgba(225,45,115,0.20)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(225,45,115,0.28)] active:scale-[0.98] disabled:opacity-70"
                  style={{ background: 'linear-gradient(135deg, #FF3976 0%, #A23ED5 100%)' }}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    <>
                      <Heart className="mr-2 h-4 w-4 fill-white text-white" />
                      Log In
                    </>
                  )}
                </Button>
              </form>

              {/* Security note */}
              <div className="mt-5 flex items-center justify-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-[#B5A7AF]" />
                <p className="text-[12px] text-[#827780]">Your data is protected with end-to-end encryption</p>
              </div>

              {/* Mobile sign up link */}
              <p className="mt-4 text-center text-[13px] text-[#71666F] lg:hidden">
                Don&apos;t have an account?{' '}
                <button onClick={() => router.push('/auth?tab=register')} className="font-semibold text-[#DD3478]">
                  Sign Up
                </button>
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
