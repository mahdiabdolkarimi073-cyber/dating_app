'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Heart,
  Sparkles,
  Shield,
  MessageCircle,
  BadgeCheck,
  Play,
  Menu,
  X,
  ArrowRight,
} from 'lucide-react';

const NAV_LINKS = [
  { label: 'Home', href: '#home' },
  { label: 'About', href: '#about' },
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Blog', href: '#blog' },
];

const FEATURES = [
  {
    icon: Sparkles,
    title: 'Smart Matching',
    desc: 'AI-powered algorithm finds your best matches',
  },
  {
    icon: Shield,
    title: 'Safe & Secure',
    desc: 'Verified profiles and encrypted conversations',
  },
  {
    icon: MessageCircle,
    title: 'Real Conversations',
    desc: 'Meaningful chats that lead to real connections',
  },
  {
    icon: BadgeCheck,
    title: 'Verified Profiles',
    desc: 'Every member is verified for authenticity',
  },
];

const STATS = [
  { value: '2M+', label: 'Successful Matches' },
  { value: '500K+', label: 'Happy Members' },
  { value: '50M+', label: 'Messages Sent' },
  { value: '4.9/5', label: 'User Rating' },
];

const STEPS = [
  {
    num: '01',
    icon: Heart,
    title: 'Create Profile',
    desc: 'Sign up and build your profile in minutes with photos and interests.',
  },
  {
    num: '02',
    icon: Sparkles,
    title: 'Find Matches',
    desc: 'Our smart algorithm suggests compatible people near you.',
  },
  {
    num: '03',
    icon: MessageCircle,
    title: 'Start Connecting',
    desc: 'Chat, match, and meet your special someone in real life.',
  },
];

const HERO_IMG_1 =
  'https://images.pexels.com/photos/1890033/pexels-photo-1890033.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';
const HERO_IMG_2 =
  'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';

const AVATAR_URLS = [
  'https://images.pexels.com/photos/993716/pexels-photo-993716.jpeg?auto=compress&cs=tinysrgb&h=100&w=100',
  'https://images.pexels.com/photos/37159572/pexels-photo-37159572.jpeg?auto=compress&cs=tinysrgb&h=100&w=100',
  'https://images.pexels.com/photos/18355488/pexels-photo-18355488.jpeg?auto=compress&cs=tinysrgb&h=100&w=100',
  'https://images.pexels.com/photos/15929275/pexels-photo-15929275.jpeg?auto=compress&cs=tinysrgb&h=100&w=100',
];

export default function Home() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (data.user?.username && data.user.termsAccepted) {
          router.push('/discover');
        }
      });
  }, [router]);

  return (
    <div className="min-h-screen bg-[#FFFBFD] text-[#181318] overflow-x-hidden">
      {/* Background decorations */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full opacity-[0.12] blur-[120px]"
          style={{ background: 'radial-gradient(circle, #F8B8D0 0%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full opacity-[0.10] blur-[140px]"
          style={{ background: 'radial-gradient(circle, #D9B8F2 0%, transparent 70%)' }}
        />
        <div
          className="absolute top-[40%] right-[30%] w-[300px] h-[300px] rounded-full opacity-[0.08] blur-[100px]"
          style={{ background: 'radial-gradient(circle, #F8B8D0 0%, transparent 70%)' }}
        />
        {/* Floating hearts */}
        <Heart className="absolute top-[15%] left-[8%] h-6 w-6 text-[#FF3F78] opacity-[0.10] rotate-[20deg]" fill="currentColor" />
        <Heart className="absolute top-[60%] left-[5%] h-4 w-4 text-[#9B45D8] opacity-[0.12] -rotate-[15deg]" fill="currentColor" />
        <Heart className="absolute top-[25%] right-[10%] h-5 w-5 text-[#FF3F78] opacity-[0.08] rotate-[-10deg]" fill="currentColor" />
        <Heart className="absolute bottom-[20%] right-[8%] h-7 w-7 text-[#C44CE0] opacity-[0.10] rotate-[25deg]" fill="currentColor" />
        <Heart className="absolute top-[80%] left-[40%] h-3 w-3 text-[#FF3F78] opacity-[0.15] rotate-[45deg]" fill="currentColor" />
      </div>

      {/* Navbar */}
      <nav className="relative z-50 px-5 sm:px-8 lg:px-12 pt-[18px]">
        <div className="mx-auto max-w-[1180px]">
          <div
            className="flex items-center justify-between h-[68px] px-5 sm:px-6 rounded-[20px] shadow-[0_8px_30px_rgba(80,30,60,0.06)] border border-[#F1E8EE]"
            style={{ background: 'rgba(255,255,255,0.92)' }}
          >
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] shadow-md"
                style={{ background: 'linear-gradient(135deg, #FF3F78 0%, #9B45D8 100%)' }}
              >
                <Heart className="h-[18px] w-[18px] text-white fill-white" />
              </div>
              <span className="text-[22px] font-extrabold tracking-tight text-[#181318]" style={{ fontWeight: 800 }}>
                Amori
              </span>
            </div>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-[30px]">
              {NAV_LINKS.map((link, i) => (
                <a
                  key={link.label}
                  href={link.href}
                  className={`text-[14px] font-medium transition-colors ${
                    i === 0 ? 'text-[#E83B83]' : 'text-[#181318] hover:text-[#E83B83]'
                  }`}
                >
                  {link.label}
                </a>
              ))}
            </div>

            {/* Desktop actions */}
            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={() => router.push('/auth')}
                className="h-[42px] w-[72px] rounded-[11px] text-[14px] font-semibold text-[#181318] hover:bg-[#FFF0F5] transition-colors"
              >
                Log In
              </button>
              <button
                onClick={() => router.push('/auth')}
                className="h-[42px] w-[98px] rounded-[11px] text-[13px] font-semibold text-white shadow-[0_6px_16px_rgba(235,50,120,0.18)] hover:shadow-[0_8px_22px_rgba(235,50,120,0.28)] hover:scale-[1.03] transition-all"
                style={{ background: 'linear-gradient(135deg, #FF3E78 0%, #A644D7 100%)' }}
              >
                Get Started
              </button>
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden flex items-center justify-center h-10 w-10 rounded-xl hover:bg-[#FFF0F5] transition-colors"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-3 rounded-[16px] border border-[#F1E8EE] bg-white shadow-lg p-5 animate-fade-in">
              <div className="flex flex-col gap-4 mb-4">
                {NAV_LINKS.map((link, i) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className={`text-[15px] font-medium ${i === 0 ? 'text-[#E83B83]' : 'text-[#181318]'}`}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
              <div className="flex flex-col gap-2.5">
                <button
                  onClick={() => router.push('/auth')}
                  className="h-[44px] rounded-[11px] text-[14px] font-semibold text-[#181318] border border-[#F1E8EE] hover:bg-[#FFF0F5] transition-colors"
                >
                  Log In
                </button>
                <button
                  onClick={() => router.push('/auth')}
                  className="h-[44px] rounded-[11px] text-[14px] font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg, #FF3E78 0%, #A644D7 100%)' }}
                >
                  Get Started
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero section */}
      <section id="home" className="relative z-10 px-5 sm:px-8 lg:px-12 mt-[55px] lg:mt-[70px]">
        <div className="mx-auto max-w-[1180px]">
          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-8">
            {/* Left: text content */}
            <div className="w-full lg:w-[52%] flex flex-col justify-center">
              {/* Badge */}
              <div
                className="inline-flex items-center gap-1.5 h-[28px] px-3 rounded-[20px] mb-5 w-fit animate-fade-in-up"
                style={{ background: 'linear-gradient(135deg, rgba(255,63,120,0.08) 0%, rgba(155,69,216,0.08) 100%)' }}
              >
                <Heart className="h-3 w-3 text-[#D7357B] fill-[#D7357B]" />
                <span className="text-[12px] font-semibold text-[#D7357B]">
                  #1 Dating App of 2026
                </span>
              </div>

              {/* Heading */}
              <h1
                className="text-[38px] sm:text-[48px] lg:text-[60px] font-extrabold leading-[1.0] text-[#181318] mb-6 animate-fade-in-up max-w-[520px]"
                style={{ animationDelay: '0.1s', fontWeight: 800 }}
              >
                Find{' '}
                <span
                  className="bg-clip-text text-transparent"
                  style={{ background: 'linear-gradient(135deg, #FF3F78 0%, #C44CE0 50%, #9B45D8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                >
                  Love
                </span>
                , Build Lasting
                <br />
                Connections
              </h1>

              {/* Description */}
              <p
                className="text-[15px] sm:text-[17px] leading-[1.55] text-[#756A73] max-w-[480px] mb-7 animate-fade-in-up"
                style={{ animationDelay: '0.2s' }}
              >
                Meet like-minded people and create meaningful relationships. Your journey to finding the perfect match starts right here.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center gap-3 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                <button
                  onClick={() => router.push('/auth')}
                  className="h-[52px] w-full sm:w-[190px] rounded-[13px] text-[15px] font-semibold text-white flex items-center justify-center gap-2 shadow-[0_12px_25px_rgba(235,50,120,0.22)] hover:shadow-[0_16px_32px_rgba(235,50,120,0.30)] hover:scale-[1.03] transition-all"
                  style={{ background: 'linear-gradient(135deg, #FF3E78 0%, #A644D7 100%)' }}
                >
                  <Heart className="h-[18px] w-[18px] fill-white" />
                  Get Started — It&apos;s Free
                </button>
                <button
                  onClick={() => router.push('/auth')}
                  className="h-[52px] w-full sm:w-auto px-5 rounded-[13px] text-[14px] font-semibold text-[#181318] flex items-center justify-center gap-2.5 border border-[#F1E8EE] bg-white hover:bg-[#FFF5F8] transition-all"
                >
                  <div className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-[#FFF0F5]">
                    <Play className="h-4 w-4 text-[#E83B83] fill-[#E83B83]" />
                  </div>
                  Watch Demo
                </button>
              </div>

              {/* Social proof */}
              <div className="flex items-center gap-3 mt-8 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                <div className="flex -space-x-2">
                  {AVATAR_URLS.map((url, i) => (
                    <div
                      key={i}
                      className="relative h-[34px] w-[34px] rounded-full border-2 border-white overflow-hidden shadow-sm"
                    >
                      <img src={url} alt={`Member ${i + 1}`} className="h-full w-full object-cover" />
                    </div>
                  ))}
                </div>
                <p className="text-[13px] text-[#756A73] leading-[1.4] max-w-[240px]">
                  Join <span className="font-bold text-[#181318]">500K+</span> happy members who found their special someone
                </p>
              </div>
            </div>

            {/* Right: hero images */}
            <div className="w-full lg:w-[48%] flex items-center justify-center relative">
              <div className="relative flex items-center justify-center w-full max-w-[420px] h-[350px] sm:h-[400px] lg:h-[460px]">
                {/* Card 1 - back, rotated -3deg */}
                <div
                  className="absolute left-[5%] top-[2%] w-[150px] h-[240px] sm:w-[190px] sm:h-[310px] lg:w-[220px] lg:h-[350px] rounded-[22px] overflow-hidden shadow-[0_20px_50px_rgba(80,30,60,0.12)]"
                  style={{ transform: 'rotate(-3deg)' }}
                >
                  <img src={HERO_IMG_1} alt="Happy member" className="h-full w-full object-cover" />
                </div>

                {/* Card 2 - front, rotated +5deg */}
                <div
                  className="absolute right-[5%] top-[8%] w-[150px] h-[240px] sm:w-[190px] sm:h-[310px] lg:w-[220px] lg:h-[350px] rounded-[22px] overflow-hidden shadow-[0_20px_50px_rgba(80,30,60,0.15)]"
                  style={{ transform: 'rotate(5deg)' }}
                >
                  <img src={HERO_IMG_2} alt="Happy member" className="h-full w-full object-cover" />
                </div>

                {/* Floating badge: top right - 98% Verified */}
                <div
                  className="absolute top-[0%] right-[0%] sm:right-[2%] bg-white rounded-[16px] shadow-[0_10px_30px_rgba(60,20,50,0.10)] px-4 py-3 flex items-center gap-2.5 animate-float"
                  style={{ animationDelay: '0.5s' }}
                >
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-full"
                    style={{ background: 'linear-gradient(135deg, #FF3F78 0%, #9B45D8 100%)' }}
                  >
                    <BadgeCheck className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-[15px] font-extrabold text-[#181318] leading-none">98%</p>
                    <p className="text-[11px] text-[#81757D] leading-none mt-0.5">Verified Profiles</p>
                  </div>
                </div>

                {/* Floating badge: bottom - 2M+ Matches */}
                <div
                  className="absolute bottom-[2%] left-[0%] sm:left-[2%] bg-white rounded-[16px] shadow-[0_10px_30px_rgba(60,20,50,0.10)] px-4 py-3 flex items-center gap-2.5 animate-float"
                  style={{ animationDelay: '0.8s' }}
                >
                  <div className="flex -space-x-1.5">
                    {AVATAR_URLS.slice(0, 3).map((url, i) => (
                      <div
                        key={i}
                        className="relative h-7 w-7 rounded-full border-2 border-white overflow-hidden"
                      >
                        <img src={url} alt={`Avatar ${i + 1}`} className="h-full w-full object-cover" />
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="text-[15px] font-extrabold text-[#181318] leading-none">2M+</p>
                    <p className="text-[11px] text-[#81757D] leading-none mt-0.5">Successful Matches</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features section */}
      <section id="features" className="relative z-10 px-5 sm:px-8 lg:px-12 mt-[30px] lg:mt-[35px]">
        <div className="mx-auto max-w-[1180px]">
          <div className="bg-white border border-[#F1E8EE] rounded-[20px] shadow-[0_4px_20px_rgba(80,30,60,0.04)] px-5 sm:px-8 py-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-0">
              {FEATURES.map((feature, i) => (
                <div
                  key={i}
                  className={`flex flex-col items-start gap-2.5 lg:px-6 ${
                    i < FEATURES.length - 1 ? 'lg:border-r lg:border-[#F1E8EE]' : ''
                  }`}
                >
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-[12px]"
                    style={{ background: 'linear-gradient(135deg, rgba(255,63,120,0.08) 0%, rgba(155,69,216,0.08) 100%)' }}
                  >
                    <feature.icon className="h-5 w-5" style={{ color: '#E83B83' }} />
                  </div>
                  <h3 className="text-[14px] font-bold text-[#181318]">{feature.title}</h3>
                  <p className="text-[12px] text-[#81757D] leading-[1.4]">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats section */}
      <section className="relative z-10 px-5 sm:px-8 lg:px-12 mt-[12px]">
        <div className="mx-auto max-w-[1180px]">
          <div className="bg-[#FFF5F9] border border-[#F7E1EB] rounded-[18px] px-5 sm:px-8 py-5">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
              {STATS.map((stat, i) => (
                <div key={i} className="text-center">
                  <p className="text-[20px] lg:text-[22px] font-extrabold text-[#181318]">{stat.value}</p>
                  <p className="text-[12px] text-[#81757D] mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works section */}
      <section id="about" className="relative z-10 px-5 sm:px-8 lg:px-12 mt-[60px] lg:mt-[70px]">
        <div className="mx-auto max-w-[1180px]">
          {/* Heading */}
          <div className="text-center mb-10 animate-fade-in-up">
            <span className="text-[13px] font-semibold text-[#E83B83] uppercase tracking-wider">
              How It Works
            </span>
            <h2 className="text-[26px] lg:text-[30px] font-extrabold text-[#181318] mt-2 mb-2" style={{ fontWeight: 800 }}>
              Your Journey to Love Starts Here
            </h2>
            <p className="text-[14px] text-[#81757D] max-w-[480px] mx-auto">
              Three simple steps to find your perfect match and start building a meaningful connection.
            </p>
          </div>

          {/* Step cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5">
            {STEPS.map((step, i) => (
              <div
                key={i}
                className="bg-white border border-[#F0E8ED] rounded-[18px] p-5 shadow-[0_4px_16px_rgba(80,30,60,0.04)] hover:shadow-[0_8px_28px_rgba(80,30,60,0.08)] hover:-translate-y-1 transition-all duration-300 animate-fade-in-up"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="flex h-[52px] w-[52px] items-center justify-center rounded-full"
                    style={{ background: 'linear-gradient(135deg, rgba(255,63,120,0.08) 0%, rgba(155,69,216,0.08) 100%)' }}
                  >
                    <step.icon className="h-6 w-6" style={{ color: '#E83B83' }} />
                  </div>
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FFF0F5] border border-[#F7E1EB]">
                    <span className="text-[11px] font-bold text-[#D7357B]">{step.num}</span>
                  </div>
                </div>
                <h3 className="text-[15px] font-bold text-[#181318] mb-1.5">{step.title}</h3>
                <p className="text-[12px] text-[#81757D] leading-[1.5]">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="relative z-10 px-5 sm:px-8 lg:px-12 mt-[60px] lg:mt-[80px] mb-[60px]">
        <div className="mx-auto max-w-[1180px]">
          <div
            className="rounded-[28px] px-6 py-12 lg:py-16 text-center relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #FF3F78 0%, #C44CE0 50%, #9B45D8 100%)' }}
          >
            <div className="absolute inset-0 opacity-20">
              <Heart className="absolute top-4 left-8 h-8 w-8 text-white rotate-[20deg]" fill="currentColor" />
              <Heart className="absolute bottom-6 right-10 h-10 w-10 text-white -rotate-[15deg]" fill="currentColor" />
              <Heart className="absolute top-10 right-20 h-5 w-5 text-white rotate-[45deg]" fill="currentColor" />
              <Heart className="absolute bottom-12 left-16 h-6 w-6 text-white -rotate-[25deg]" fill="currentColor" />
            </div>
            <div className="relative z-10">
              <h2 className="text-[28px] lg:text-[36px] font-extrabold text-white mb-3" style={{ fontWeight: 800 }}>
                Ready to Find Your Match?
              </h2>
              <p className="text-[15px] text-white/90 max-w-[440px] mx-auto mb-7">
                Join thousands of happy couples who found love on Amori. Your perfect match is waiting.
              </p>
              <button
                onClick={() => router.push('/auth')}
                className="h-[52px] px-8 rounded-[13px] text-[15px] font-bold text-[#E83B83] bg-white shadow-lg hover:scale-[1.03] transition-all inline-flex items-center gap-2"
              >
                Get Started Now
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-5 sm:px-8 lg:px-12 pb-10">
        <div className="mx-auto max-w-[1180px] border-t border-[#F1E8EE] pt-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-[30px] w-[30px] items-center justify-center rounded-[8px]"
                style={{ background: 'linear-gradient(135deg, #FF3F78 0%, #9B45D8 100%)' }}
              >
                <Heart className="h-4 w-4 text-white fill-white" />
              </div>
              <span className="text-[18px] font-extrabold text-[#181318]">Amori</span>
            </div>
            <p className="text-[12px] text-[#81757D]">
              © 2026 Amori. All rights reserved. Made with{' '}
              <Heart className="inline h-3 w-3 text-[#FF3F78] fill-[#FF3F78]" /> for love.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
