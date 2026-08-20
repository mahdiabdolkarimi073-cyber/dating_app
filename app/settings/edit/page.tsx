'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AuroraBackground } from '@/components/aurora-background';
import { AppHeader } from '@/components/app-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Save, Camera, X, Plus } from 'lucide-react';
import { INTEREST_LABELS } from '@/lib/matchmaker';

interface ProfileData {
  id: number;
  name: string;
  username: string;
  birthDate: string;
  gender: string;
  bio: string;
  interests: string[];
  photos: string[];
  email: string;
}

export default function EditProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('');
  const [bio, setBio] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (!data.user) {
          router.push('/auth');
          return;
        }
        const u = data.user;
        setProfile(u);
        setName(u.name || '');
        setUsername(u.username || '');
        setBirthDate(u.birthDate || '');
        setGender(u.gender || '');
        setBio(u.bio || '');
        setInterests(u.interests ? (typeof u.interests === 'string' ? JSON.parse(u.interests) : u.interests) : []);
        setPhotos(u.photos ? (typeof u.photos === 'string' ? JSON.parse(u.photos) : u.photos) : []);
        setLoading(false);
      });
  }, [router]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, username, birthDate, gender, bio }),
      });
      const data = await res.json();
      if (res.ok) {
        // Save interests
        await fetch('/api/user/interests', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ interests }),
        });
        toast.success('Profile updated', { duration: 2000 });
        router.push('/settings');
      } else {
        toast.error(data.error || 'Failed to update');
      }
    } catch {
      toast.error('Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const toggleInterest = (id: string) => {
    setInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : prev.length < 8 ? [...prev, id] : prev
    );
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/auth');
  };

  if (loading || !profile) {
    return (
      <AuroraBackground>
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AuroraBackground>
    );
  }

  return (
    <AuroraBackground>
      <div className="min-h-screen flex flex-col px-4 py-5">
        <div className="max-w-2xl mx-auto w-full">
          <AppHeader title="Edit Profile" showBack backHref="/settings" onLogout={handleLogout} />
        </div>

        <div className="max-w-2xl mx-auto w-full flex-1 space-y-5 pb-32">
          {/* Photos */}
          <div className="animate-fade-in-up">
            <Label className="text-sm font-semibold mb-3 block">Photos</Label>
            <div className="grid grid-cols-3 gap-3">
              {photos.map((photo, i) => (
                <div key={i} className="relative aspect-square rounded-2xl overflow-hidden border border-border/50 group">
                  <img src={photo} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
                  <button
                    onClick={() => setPhotos(photos.filter((_, idx) => idx !== i))}
                    className="absolute top-1 right-1 h-6 w-6 rounded-full bg-destructive/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3 text-white" />
                  </button>
                </div>
              ))}
              {photos.length < 6 && (
                <button
                  onClick={() => toast.info('Photo upload coming soon. Use the onboarding flow to add photos.')}
                  className="aspect-square rounded-2xl border-2 border-dashed border-border/50 flex flex-col items-center justify-center text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
                >
                  <Plus className="h-6 w-6 mb-1" />
                  <span className="text-xs">Add Photo</span>
                </button>
              )}
            </div>
          </div>

          {/* Basic info */}
          <div className="space-y-3 animate-fade-in-up" style={{ animationDelay: '50ms' }}>
            <div>
              <Label htmlFor="name" className="text-sm font-semibold mb-1.5 block">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
            </div>
            <div>
              <Label htmlFor="username" className="text-sm font-semibold mb-1.5 block">Username</Label>
              <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" />
            </div>
            <div>
              <Label htmlFor="birthDate" className="text-sm font-semibold mb-1.5 block">Date of Birth</Label>
              <Input id="birthDate" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
            </div>
            <div>
              <Label className="text-sm font-semibold mb-1.5 block">Gender</Label>
              <div className="flex gap-2">
                {['male', 'female', 'other'].map((g) => (
                  <button
                    key={g}
                    onClick={() => setGender(g)}
                    className={`flex-1 rounded-xl border-2 px-4 py-2.5 text-sm font-medium capitalize transition-all ${
                      gender === g ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/40'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="bio" className="text-sm font-semibold mb-1.5 block">Bio</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell others about yourself..."
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground mt-1 text-right">{bio.length}/500</p>
            </div>
          </div>

          {/* Interests */}
          <div className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <Label className="text-sm font-semibold mb-3 block">
              Interests ({interests.length}/8)
            </Label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(INTEREST_LABELS).map(([id, info]) => {
                const selected = interests.includes(id);
                return (
                  <button
                    key={id}
                    onClick={() => toggleInterest(id)}
                    className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-2 text-sm font-medium transition-all ${
                      selected
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-primary/40 text-muted-foreground'
                    }`}
                  >
                    <span>{info.emoji}</span>
                    {info.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sticky save button */}
        <div className="fixed bottom-0 left-0 right-0 z-30">
          <div className="max-w-2xl mx-auto px-4 pb-5 pt-3">
            <div className="glass-strong rounded-2xl border border-border/50 shadow-2xl p-3">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full rounded-xl bg-gradient-warm text-white shadow-lg shadow-primary/30 hover:scale-[1.01] transition-all"
              >
                {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AuroraBackground>
  );
}
