'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  ChevronDown,
  Heart,
  ImagePlus,
  Lightbulb,
  Loader2,
  Shield,
  ShieldCheck,
  Star,
  X,
} from 'lucide-react';

const MAX_PHOTOS = 6;
const MIN_PHOTOS = 1;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const BENEFITS = [
  { title: 'More Matches', description: 'Profiles with photos get up to 5x more matches.', icon: Star },
  { title: 'Be Authentic', description: 'Real photos build trust and better connections.', icon: Shield },
  { title: 'Stand Out', description: 'A great profile photo makes you memorable.', icon: Heart },
];

const GUIDELINES = [
  'Use clear, high-quality photos',
  'Show your face clearly',
  'Good lighting works best',
  'No group photos as the main picture',
  'Avoid sunglasses or heavy filters',
  'Show different sides of your life',
];

export default function PhotosPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);
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
          if (data.user.photos) {
            try {
              setPhotos(JSON.parse(data.user.photos));
            } catch {
              setPhotos([]);
            }
          }
        }
      });
  }, [router]);

  const readFile = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('Unable to read image'));
    };
    reader.onerror = () => reject(new Error('Unable to read image'));
    reader.readAsDataURL(file);
  });

  const handleFiles = async (files: FileList | null) => {
    if (!files || uploading || photos.length >= MAX_PHOTOS) return;
    const remaining = MAX_PHOTOS - photos.length;
    const validFiles = Array.from(files).slice(0, remaining).filter((file) => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        toast.error(`${file.name} is not a supported image type`);
        return false;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} is too large (maximum 10MB)`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;
    setUploading(true);
    try {
      const newPhotos = await Promise.all(validFiles.map(readFile));
      setPhotos((current) => [...current, ...newPhotos].slice(0, MAX_PHOTOS));
    } catch {
      toast.error('Could not read one of the selected images');
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((current) => current.filter((_, photoIndex) => photoIndex !== index));
  };

  const setMainPhoto = (index: number) => {
    setPhotos((current) => {
      const next = [...current];
      const [mainPhoto] = next.splice(index, 1);
      next.unshift(mainPhoto);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (photos.length < MIN_PHOTOS) {
      toast.error('Please upload at least 1 photo');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/user/photos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photos }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to save photos');
        return;
      }
      toast.success('Photos saved! Almost there');
      router.push('/onboarding/terms');
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
        <div className="absolute bottom-[16%] right-[2%] grid grid-cols-4 gap-2 opacity-[0.12]">{Array.from({ length: 16 }).map((_, index) => <span key={index} className="h-1 w-1 rounded-full bg-[#E83A7E]" />)}</div>
        <div className="absolute bottom-[12%] left-[16%] grid grid-cols-4 gap-2 opacity-[0.10]">{Array.from({ length: 16 }).map((_, index) => <span key={index} className="h-1 w-1 rounded-full bg-[#E83A7E]" />)}</div>
      </div>

      <header className="relative z-20 mx-auto flex h-16 max-w-[1440px] items-center justify-between border-b border-[#F2E9EF] bg-white/95 px-6 md:px-10 lg:px-12">
        <button onClick={() => router.push('/')} className="flex items-center gap-2.5">
          <div className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px]" style={{ background: 'linear-gradient(135deg, #FF3D78 0%, #9844D7 100%)', boxShadow: '0 6px 16px rgba(255,61,120,0.30)' }}><Heart className="h-[18px] w-[18px] fill-white text-white" /></div>
          <span className="text-[22px] font-extrabold tracking-tight text-[#181318]">Amori</span>
        </button>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/discover')} className="text-[13px] font-semibold text-[#756A73] transition-colors hover:text-[#1A121A]">Save &amp; Exit</button>
          <div className="hidden items-center gap-2 sm:flex"><div className="h-[38px] w-[38px] rounded-full bg-gradient-to-br from-[#FF8AB8] to-[#C968E8]" /><div className="hidden leading-tight md:block"><p className="text-[13px] font-bold text-[#292229]">{userName || 'Member'}</p><p className="mt-0.5 text-[11px] font-semibold text-[#E83B82]">Premium</p></div><ChevronDown className="h-3.5 w-3.5 text-[#8B7D87]" /></div>
        </div>
      </header>

      <div className="relative z-10 mx-auto mt-8 flex w-full max-w-[560px] justify-center px-4 sm:mt-9">
        <div className="flex w-full items-center justify-between">
          {['Profile', 'Interests', 'Photos', 'Terms'].map((label, index) => (
            <div key={label} className="flex flex-1 items-center last:flex-none"><div className="flex flex-col items-center gap-[7px]"><div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-all duration-300 ${index < 2 ? 'bg-[#E8327D] text-white shadow-[0_4px_12px_rgba(232,50,125,0.22)]' : index === 2 ? 'text-white shadow-[0_4px_14px_rgba(232,58,126,0.28)] ring-4 ring-[#F3D9F5]' : 'bg-[#F1EBEF] text-[#81757D]'}`} style={index === 2 ? { background: 'linear-gradient(135deg, #EC3A82 0%, #9945D5 100%)' } : undefined}>{index < 2 ? <Check className="h-4 w-4" /> : index + 1}</div><span className={`text-[12px] font-semibold ${index === 2 ? 'text-[#E82F78]' : 'text-[#81757D]'}`}>{label}</span></div>{index < 3 && <div className={`mx-1 h-px flex-1 sm:mx-2 ${index < 2 ? 'bg-[#E8327D]' : 'bg-[#E8DDE4]'}`} />}</div>
          ))}
        </div>
      </div>

      <main className="relative z-10 mx-auto mt-8 max-w-[1440px] px-6 pb-14 md:px-10 lg:mt-8 lg:px-12">
        <div className="grid grid-cols-1 items-start gap-7 lg:grid-cols-[22%_56%_22%] lg:gap-8">
          <section className="hidden lg:block lg:pt-8"><h1 className="text-[36px] font-extrabold leading-[1.05] text-[#1A121A]">Show your best<br /><span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #E83382 0%, #A143D5 100%)' }}>self</span> <Heart className="ml-1 inline-block h-8 w-8 align-middle text-[#E83382]" strokeWidth={2} /></h1><p className="mt-5 max-w-[230px] text-[14px] leading-[1.55] text-[#766B73]">Add photos that show who you are and what you love.</p><div className="mt-7 flex flex-col gap-6">{BENEFITS.map((benefit) => { const Icon = benefit.icon; return <div key={benefit.title} className="flex items-start gap-3"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[13px] border border-[#F8D7E5] bg-[#FFF0F6] shadow-[0_4px_12px_rgba(232,58,126,0.06)]"><Icon className="h-5 w-5 text-[#ED3A7D]" fill={benefit.title === 'Stand Out' ? 'currentColor' : 'none'} /></div><div className="pt-0.5"><h3 className="text-[13.5px] font-bold text-[#292229]">{benefit.title}</h3><p className="mt-1 max-w-[185px] text-[11.5px] leading-[1.5] text-[#81757D]">{benefit.description}</p></div></div>; })}</div></section>

          <section className="mx-auto w-full max-w-[780px]">
            <div className="rounded-[22px] border border-[#F0E7ED] bg-[rgba(255,255,255,0.95)] p-5 shadow-[0_18px_55px_rgba(85,30,65,0.07)] backdrop-blur-xl animate-scale-in sm:p-7">
              <div className="text-center"><div className="mx-auto flex h-[42px] w-[42px] items-center justify-center rounded-full bg-[#FFF0F6]"><Camera className="h-5 w-5 text-[#ED3A7D]" /></div><h2 className="mt-2.5 text-[23px] font-extrabold text-[#1A121A]">Add Your Photos</h2><p className="mt-1 text-[13px] text-[#837680]">Upload 1–6 photos. Your first photo will be your main profile picture.</p></div>
              <div className="mt-5 flex items-center justify-center gap-3"><div className="flex gap-[6px]">{Array.from({ length: MAX_PHOTOS }).map((_, index) => <span key={index} className={`h-2 w-[29px] rounded-full transition-all duration-200 ${index < photos.length ? 'bg-[#E9327D]' : 'bg-[#E9E0E6]'}`} />)}</div><span className="text-[12.5px] font-bold text-[#8A7180]">{photos.length}/{MAX_PHOTOS}</span></div>

              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {photos.map((photo, index) => <div key={`${photo.slice(0, 20)}-${index}`} className="group relative aspect-square overflow-hidden rounded-[12px] border-[1.5px] border-[#FFB3D0] bg-white shadow-[0_4px_12px_rgba(255,74,134,0.08)]"><img src={photo} alt={`Profile photo ${index + 1}`} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" /><div className="absolute inset-0 bg-[#FF3D78]/0 transition-colors duration-200 group-hover:bg-[#FF3D78]/[0.05]" />{index === 0 && <span className="absolute left-2 top-2 rounded-[7px] bg-[#F02F7B] px-2 py-1 text-[10px] font-bold text-white">Main</span>}<button type="button" onClick={() => removePhoto(index)} aria-label="Remove photo" className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#71666F] shadow-[0_3px_10px_rgba(85,30,65,0.16)] transition-colors hover:bg-[#FFF0F5] hover:text-[#E83A7E]"><X className="h-3.5 w-3.5" /></button>{index > 0 && <button type="button" onClick={() => setMainPhoto(index)} className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold text-[#71666F] opacity-0 shadow-sm transition-opacity hover:text-[#E83A7E] group-hover:opacity-100">Set as main</button>}</div>)}
                {photos.length < MAX_PHOTOS && <button type="button" onClick={() => fileInputRef.current?.click()} onDragOver={(event) => { event.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={(event) => { event.preventDefault(); setDragOver(false); void handleFiles(event.dataTransfer.files); }} className={`relative flex aspect-square flex-col items-center justify-center gap-2 rounded-[12px] border-[1.5px] border-dashed transition-all duration-200 ${dragOver ? 'border-[#E83A7E] bg-[#FFF6F9]' : 'border-[#E9DCE5] bg-[#FFFCFD] hover:border-[#E83A7E] hover:bg-[#FFF6F9]'}`}><ImagePlus className={`h-8 w-8 ${dragOver ? 'text-[#E83A7E]' : 'text-[#897485]'}`} /><span className="text-[11.5px] font-semibold text-[#897485]">Add Photo</span>{uploading && <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-[12px] bg-white/85"><Loader2 className="h-6 w-6 animate-spin text-[#E83A7E]" /><span className="text-[11px] font-semibold text-[#756A73]">Uploading...</span></span>}</button>}
                {Array.from({ length: Math.max(0, MAX_PHOTOS - photos.length - 1) }).map((_, index) => <button key={`empty-${index}`} type="button" onClick={() => fileInputRef.current?.click()} className="hidden aspect-square flex-col items-center justify-center gap-2 rounded-[12px] border-[1.5px] border-dashed border-[#E9DCE5] bg-[#FFFCFD] transition-all duration-200 hover:border-[#E83A7E] hover:bg-[#FFF6F9] sm:flex"><ImagePlus className="h-8 w-8 text-[#897485]" /><span className="text-[11.5px] font-semibold text-[#897485]">Add Photo</span></button>)}
              </div>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={(event) => { void handleFiles(event.target.files); event.target.value = ''; }} />

              <div className="mt-6 border-t border-[#F0E7ED] pt-5"><div className="flex items-center justify-between gap-3"><Button type="button" variant="outline" onClick={() => router.push('/onboarding/interests')} className="h-[42px] w-[110px] rounded-[10px] border-[#E8DEE5] bg-white text-[13px] font-semibold text-[#5A4F57] hover:bg-[#FAF7F9]"><ArrowLeft className="mr-1.5 h-4 w-4" />Back</Button><Button type="button" onClick={handleSubmit} disabled={loading || photos.length < MIN_PHOTOS} className="h-[43px] w-full max-w-[340px] rounded-[11px] border-0 text-[13px] font-bold text-white shadow-[0_8px_20px_rgba(225,45,115,0.20)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(225,45,115,0.28)] disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #FF3977 0%, #A23ED5 100%)' }}>{loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : <>Continue<ArrowRight className="ml-2 h-4 w-4" /></>}</Button></div></div>
            </div>
          </section>

          <aside className="hidden lg:block lg:pt-7"><div className="rounded-[18px] border border-[#F3DCE8] bg-[rgba(255,247,251,0.78)] p-5"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-[0_4px_12px_rgba(232,58,126,0.10)]"><Lightbulb className="h-5 w-5 text-[#ED3A7D]" /></div><h3 className="text-[14.5px] font-bold text-[#292229]">Photo Guidelines</h3></div><div className="mt-5 flex flex-col gap-3.5">{GUIDELINES.map((guideline) => <div key={guideline} className="flex items-start gap-2.5"><span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#FFE0EF]"><Check className="h-2.5 w-2.5 text-[#E83A7E]" strokeWidth={3} /></span><p className="text-[11.5px] leading-[1.5] text-[#756A73]">{guideline}</p></div>)}</div></div><div className="mt-14 flex items-start gap-3 px-2"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#827680]" /><p className="text-[11.5px] leading-[1.5] text-[#827680]">Your photos are private and secure. They will only be visible to people you match with.</p></div></aside>
        </div>
      </main>
    </div>
  );
}
