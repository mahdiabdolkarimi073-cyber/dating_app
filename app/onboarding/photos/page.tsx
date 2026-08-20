'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AuroraBackground } from '@/components/aurora-background';
import { OnboardingStepper } from '@/components/onboarding-stepper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Heart, Loader2, ArrowRight, ArrowLeft, X, Camera, ImagePlus } from 'lucide-react';
import { cn } from '@/lib/utils';

const MAX_PHOTOS = 6;
const MIN_PHOTOS = 1;

export default function PhotosPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (!data.user) {
          router.push('/auth');
        } else if (!data.user.username) {
          router.push('/onboarding');
        } else if (data.user.photos) {
          try {
            setPhotos(JSON.parse(data.user.photos));
          } catch { /* ignore */ }
        }
      });
  }, [router]);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const newPhotos: string[] = [];
    const remaining = MAX_PHOTOS - photos.length;

    Array.from(files)
      .slice(0, remaining)
      .forEach((file) => {
        if (!file.type.startsWith('image/')) {
          toast.error('Only image files are allowed');
          return;
        }
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} is too large (max 5MB)`);
          return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            newPhotos.push(e.target.result as string);
            if (newPhotos.length === Math.min(files.length, remaining)) {
              setPhotos((prev) => [...prev, ...newPhotos]);
            }
          }
        };
        reader.readAsDataURL(file);
      });
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (photos.length < MIN_PHOTOS) {
      toast.error(`Please upload at least ${MIN_PHOTOS} photo`);
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

        <OnboardingStepper currentStep={2} />

        <Card className="w-full max-w-2xl glass border-border/50 shadow-2xl shadow-primary/10 animate-scale-in">
          <CardHeader className="space-y-1 text-center pb-4">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Camera className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-2xl">Add Your Photos</CardTitle>
            <CardDescription>
              Upload {MIN_PHOTOS}–{MAX_PHOTOS} photos. Your first photo will be your main profile picture.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Photo counter */}
            <div className="flex items-center justify-center gap-2 mb-5">
              <div className="flex gap-1.5">
                {Array.from({ length: MAX_PHOTOS }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'h-2.5 rounded-full transition-all duration-300',
                      i < photos.length ? 'bg-primary w-8' : 'bg-border w-2.5'
                    )}
                  />
                ))}
              </div>
              <span className="text-sm font-medium text-muted-foreground ml-2">
                {photos.length}/{MAX_PHOTOS}
              </span>
            </div>

            {/* Photo grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              {photos.map((photo, i) => (
                <div
                  key={i}
                  className="relative aspect-square rounded-xl overflow-hidden border-2 border-primary/30 group animate-scale-in"
                >
                  <img src={photo} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
                  {i === 0 && (
                    <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs font-semibold px-2 py-0.5 rounded-full">
                      Main
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}

              {/* Upload slot */}
              {photos.length < MAX_PHOTOS && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    handleFiles(e.dataTransfer.files);
                  }}
                  className={cn(
                    'aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all duration-300 hover:scale-105',
                    dragOver
                      ? 'border-primary bg-primary/10 scale-105'
                      : 'border-border hover:border-primary/40 hover:bg-secondary/50'
                  )}
                >
                  <ImagePlus className="h-8 w-8 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground font-medium">Add Photo</span>
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/onboarding/interests')}
                className="h-12 px-6 hover:bg-secondary/50 transition-all duration-300"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={loading || photos.length < MIN_PHOTOS}
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
