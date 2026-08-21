'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Heart,
  Lightbulb,
  Loader2,
  Shield,
  Sparkles,
  Star,
} from 'lucide-react';

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
];

const BENEFITS = [
  { title: 'Better Matches', description: 'Shared interests help us find the right people for you.', icon: Star },
  { title: 'Be Yourself', description: 'Show what you truly love and attract real connections.', icon: Shield },
  { title: 'More Connections', description: 'The more you share, the better your matches will be.', icon: Heart },
];

const TIPS = [
  'Choose what you genuinely enjoy',
  'Common interests lead to better conversations',
  'You can select up to 5 interests',
  "Don't worry, you can change them later",
];

const MAX_SELECTIONS = 5;

export default function InterestsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (!data.user) {
          router.push('/auth');
        } else if (!data.user.username) {
          router.push('/onboarding');
        } else {
          setUserName(data.user.name || data.user.username || 'Member');
          if (data.user.interests) {
            try {
              setSelected(JSON.parse(data.user.interests));
            } catch {
              setSelected([]);
            }
          }
        }
      });
  }, [router]);

  const toggleInterest = (id: string) => {
    if (selected.includes(id)) {
      setSelected(selected.filter((interest) => interest !== id));
    } else if (selected.length < MAX_SELECTIONS) {
      setSelected([...selected, id]);
    } else {
      toast.warning('You can select up to 5 interests');
    }
  };

  const handleSubmit = async () => {
    if (selected.length < 1) {
      toast.error('Please select at least 1 interest');
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
    <div className="relative min-h-screen w-full overflow-hidden bg-[#FFFBFD]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -bottom-40 -left-24 h-[540px] w-[540px] rounded-full opacity-10 blur-[125px]" style={{ background: 'radial-gradient(circle, #F7BDD7 0%, transparent 70%)' }} />
        <div className="absolute -right-32 -top-32 h-[580px] w-[580px] rounded-full opacity-10 blur-[135px]" style={{ background: 'radial-gradient(circle, #E4C4F5 0%, transparent 70%)' }} />
        <Heart className="absolute left-[7%] top-[17%] h-6 w-6 fill-[#FF3D78] text-[#FF3D78] opacity-[0.08]" />
        <Heart className="absolute right-[8%] top-[23%] h-7 w-7 fill-[#E83382] text-[#E83382] opacity-[0.07]" />
        <Heart className="absolute bottom-[21%] left-[5%] h-6 w-6 fill-[#FF3D78] text-[#FF3D78] opacity-[0.08]" />
        <div className="absolute bottom-[16%] right-[2%] grid grid-cols-4 gap-2 opacity-[0.12]">
          {Array.from({ length: 16 }).map((_, index) => <span key={index} className="h-1 w-1 rounded-full bg-[#E83A7E]" />)}
        </div>
        <div className="absolute bottom-[12%] left-[16%] grid grid-cols-4 gap-2 opacity-[0.10]">
          {Array.from({ length: 16 }).map((_, index) => <span key={index} className="h-1 w-1 rounded-full bg-[#E83A7E]" />)}
        </div>
      </div>

      <header className="relative z-20 mx-auto flex h-16 max-w-[1440px] items-center justify-between border-b border-[#F2E9EF] bg-white/95 px-6 md:px-10 lg:px-12">
        <button onClick={() => router.push('/')} className="flex items-center gap-2.5">
          <div className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px]" style={{ background: 'linear-gradient(135deg, #FF3D78 0%, #9844D7 100%)', boxShadow: '0 6px 16px rgba(255,61,120,0.30)' }}>
            <Heart className="h-[18px] w-[18px] fill-white text-white" />
          </div>
          <span className="text-[22px] font-extrabold tracking-tight text-[#181318]">Amori</span>
        </button>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/discover')} className="text-[13px] font-semibold text-[#756A73] transition-colors hover:text-[#1A121A]">Save &amp; Exit</button>
          <div className="hidden items-center gap-2 sm:flex">
            <div className="h-[38px] w-[38px] rounded-full bg-gradient-to-br from-[#FF8AB8] to-[#C968E8]" />
            <div className="hidden leading-tight md:block">
              <p className="text-[13px] font-bold text-[#292229]">{userName || 'Member'}</p>
              <p className="mt-0.5 text-[11px] font-semibold text-[#E83B82]">Premium</p>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-[#8B7D87]" />
          </div>
        </div>
      </header>

      <div className="relative z-10 mx-auto mt-8 flex w-full max-w-[560px] justify-center px-4 sm:mt-9">
        <div className="flex w-full items-center justify-between">
          {['Profile', 'Interests', 'Photos', 'Terms'].map((label, index) => (
            <div key={label} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center gap-[7px]">
                <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-all duration-300 ${index < 1 ? 'bg-[#E8327D] text-white shadow-[0_4px_12px_rgba(232,50,125,0.22)]' : index === 1 ? 'text-white shadow-[0_4px_14px_rgba(232,58,126,0.28)] ring-4 ring-[#F3D9F5]' : 'bg-[#F1EBEF] text-[#81757D]'}`} style={index === 1 ? { background: 'linear-gradient(135deg, #EC3A82 0%, #9945D5 100%)' } : undefined}>
                  {index === 0 ? <Check className="h-4 w-4" /> : index + 1}
                </div>
                <span className={`text-[12px] font-semibold ${index === 1 ? 'text-[#E82F78]' : 'text-[#81757D]'}`}>{label}</span>
              </div>
              {index < 3 && <div className={`mx-1 h-px flex-1 sm:mx-2 ${index === 0 ? 'bg-[#E8327D]' : 'bg-[#E8DDE4]'}`} />}
            </div>
          ))}
        </div>
      </div>

      <main className="relative z-10 mx-auto mt-8 max-w-[1440px] px-6 pb-14 md:px-10 lg:mt-8 lg:px-12">
        <div className="grid grid-cols-1 items-start gap-7 lg:grid-cols-[22%_56%_22%] lg:gap-8">
          <section className="hidden lg:block lg:pt-8">
            <h1 className="text-[36px] font-extrabold leading-[1.05] text-[#1A121A]">Tell us what<br />you <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #E83382 0%, #A143D5 100%)' }}>love</span> <Heart className="ml-1 inline-block h-8 w-8 align-middle text-[#E83382]" strokeWidth={2} /></h1>
            <p className="mt-5 max-w-[220px] text-[14px] leading-[1.55] text-[#766B73]">Select 1–5 interests that describe you best.</p>
            <div className="mt-7 flex flex-col gap-6">
              {BENEFITS.map((benefit) => {
                const Icon = benefit.icon;
                return <div key={benefit.title} className="flex items-start gap-3"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[13px] border border-[#F8D7E5] bg-[#FFF0F6] shadow-[0_4px_12px_rgba(232,58,126,0.06)]"><Icon className="h-5 w-5 text-[#ED3A7D]" fill={benefit.title === 'More Connections' ? 'currentColor' : 'none'} /></div><div className="pt-0.5"><h3 className="text-[13.5px] font-bold text-[#292229]">{benefit.title}</h3><p className="mt-1 max-w-[175px] text-[11.5px] leading-[1.5] text-[#81757D]">{benefit.description}</p></div></div>;
              })}
            </div>
          </section>

          <section className="mx-auto w-full max-w-[780px]">
            <div className="rounded-[22px] border border-[#F0E7ED] bg-[rgba(255,255,255,0.95)] p-5 shadow-[0_18px_55px_rgba(85,30,65,0.07)] backdrop-blur-xl animate-scale-in sm:p-7">
              <div className="text-center">
                <div className="mx-auto flex h-[42px] w-[42px] items-center justify-center rounded-full bg-[#FFF0F6]"><Heart className="h-5 w-5 text-[#ED3A7D]" /></div>
                <h2 className="mt-2.5 text-[23px] font-extrabold text-[#1A121A]">What Are You Into?</h2>
                <p className="mt-1 text-[13px] text-[#837680]">Pick 1–5 interests that define you. We&apos;ll match you with like-minded people.</p>
              </div>

              <div className="mt-4 flex items-center justify-center gap-3">
                <div className="flex gap-[5px]">{Array.from({ length: MAX_SELECTIONS }).map((_, index) => <span key={index} className={`h-2 w-2 rounded-full transition-all duration-200 ${index < selected.length ? 'bg-[#E83A7E]' : 'bg-[#E9E0E6]'}`} />)}</div>
                <span className="text-[12.5px] font-bold text-[#8A7180]">{selected.length}/{MAX_SELECTIONS}</span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {INTERESTS.map((interest) => {
                  const isSelected = selected.includes(interest.id);
                  const isDisabled = selected.length >= MAX_SELECTIONS && !isSelected;
                  return <button key={interest.id} type="button" onClick={() => toggleInterest(interest.id)} disabled={isDisabled} className={`group relative flex h-[88px] flex-col items-center justify-center gap-2 rounded-[12px] border text-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#E83A7E]/20 ${isSelected ? 'border-[1.5px] border-[#FF4A86] bg-[#FFF3F8] shadow-[0_4px_12px_rgba(255,74,134,0.10)]' : isDisabled ? 'cursor-not-allowed border-[#E9E0E6] bg-white opacity-60' : 'border-[#E9E0E6] bg-white hover:-translate-y-0.5 hover:border-[#F3A1BF] hover:shadow-[0_5px_14px_rgba(85,30,65,0.07)]'}`}><span className={`text-[28px] leading-none transition-transform duration-200 ${isSelected ? 'scale-105' : 'group-hover:scale-105'}`}>{interest.emoji}</span><span className={`text-[12px] font-semibold ${isSelected ? 'text-[#E83A7E]' : 'text-[#292229]'}`}>{interest.label}</span>{isSelected && <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#E9367D]"><Check className="h-3 w-3 text-white" strokeWidth={3} /></span>}</button>;
                })}
              </div>

              <div className="mt-6 flex items-center gap-3"><div className="h-px flex-1 bg-[#F0E7ED]" /><div className="flex shrink-0 items-center gap-1.5 text-[11.5px] text-[#827680]"><Lightbulb className="h-3.5 w-3.5 text-[#A57A9A]" />You can always update your interests later</div><div className="h-px flex-1 bg-[#F0E7ED]" /></div>

              <div className="mt-5 flex items-center justify-between gap-3">
                <Button type="button" variant="outline" onClick={() => router.push('/onboarding')} className="h-[42px] w-[105px] rounded-[10px] border-[#E8DEE5] bg-white text-[13px] font-semibold text-[#5A4F57] hover:bg-[#FAF7F9]"><ArrowLeft className="mr-1.5 h-4 w-4" />Back</Button>
                <Button type="button" onClick={handleSubmit} disabled={loading || selected.length < 1} className="h-[43px] w-full max-w-[215px] rounded-[11px] border-0 text-[13px] font-bold text-white shadow-[0_8px_20px_rgba(225,45,115,0.20)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(225,45,115,0.28)] disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #FF3977 0%, #A23ED5 100%)' }}>{loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : <>Continue<ArrowRight className="ml-2 h-4 w-4" /></>}</Button>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-center gap-1.5"><Shield className="h-3.5 w-3.5 text-[#B5A7AF]" /><span className="text-[11.5px] text-[#827680]">Your information is safe and secure</span></div>
          </section>

          <aside className="hidden lg:block lg:pt-7"><div className="rounded-[18px] border border-[#F3DCE8] bg-[rgba(255,247,251,0.78)] p-5"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-[0_4px_12px_rgba(232,58,126,0.10)]"><Lightbulb className="h-5 w-5 text-[#ED3A7D]" /></div><h3 className="text-[14.5px] font-bold text-[#292229]">Tips</h3></div><div className="mt-5 flex flex-col gap-4">{TIPS.map((tip) => <div key={tip} className="flex items-start gap-2.5"><span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#FFE0EF]"><Check className="h-2.5 w-2.5 text-[#E83A7E]" strokeWidth={3} /></span><p className="text-[11.5px] leading-[1.5] text-[#756A73]">{tip}</p></div>)}</div></div></aside>
        </div>
      </main>
    </div>
  );
}
