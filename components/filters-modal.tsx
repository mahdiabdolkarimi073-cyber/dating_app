'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { X, Filter, Save, Trash2, RotateCcw } from 'lucide-react';
import { INTEREST_LABELS } from '@/lib/matchmaker';
import { toast } from 'sonner';

export interface DiscoveryFilters {
  minAge: number | null;
  maxAge: number | null;
  gender: string | null;
  maxDistance: number | null;
  onlineOnly: boolean;
  hasPhotos: boolean;
  newOnly: boolean;
  sortBy: string;
  interests: string[];
}

interface FiltersModalProps {
  open: boolean;
  onClose: () => void;
  onApply: (filters: DiscoveryFilters) => void;
  initialFilters?: DiscoveryFilters;
}

export function FiltersModal({ open, onClose, onApply, initialFilters }: FiltersModalProps) {
  const [minAge, setMinAge] = useState<number>(18);
  const [maxAge, setMaxAge] = useState<number>(80);
  const [gender, setGender] = useState<string>('');
  const [maxDistance, setMaxDistance] = useState<number>(100);
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [hasPhotos, setHasPhotos] = useState(true);
  const [newOnly, setNewOnly] = useState(false);
  const [sortBy, setSortBy] = useState('recent');
  const [interests, setInterests] = useState<string[]>([]);
  const [savedFilters, setSavedFilters] = useState<{ id: number; name: string; config: DiscoveryFilters }[]>([]);
  const [filterName, setFilterName] = useState('');

  useEffect(() => {
    if (initialFilters) {
      setMinAge(initialFilters.minAge ?? 18);
      setMaxAge(initialFilters.maxAge ?? 80);
      setGender(initialFilters.gender ?? '');
      setMaxDistance(initialFilters.maxDistance ?? 100);
      setOnlineOnly(initialFilters.onlineOnly ?? false);
      setHasPhotos(initialFilters.hasPhotos ?? true);
      setNewOnly(initialFilters.newOnly ?? false);
      setSortBy(initialFilters.sortBy ?? 'recent');
      setInterests(initialFilters.interests ?? []);
    }
  }, [initialFilters, open]);

  useEffect(() => {
    if (open) loadSavedFilters();
  }, [open]);

  const loadSavedFilters = async () => {
    try {
      const res = await fetch('/api/filters');
      if (res.ok) {
        const data = await res.json();
        setSavedFilters(data.filters || []);
      }
    } catch {
      // silent
    }
  };

  const handleApply = () => {
    onApply({
      minAge: minAge !== 18 ? minAge : null,
      maxAge: maxAge !== 80 ? maxAge : null,
      gender: gender || null,
      maxDistance: maxDistance !== 100 ? maxDistance : null,
      onlineOnly,
      hasPhotos,
      newOnly,
      sortBy,
      interests,
    });
    onClose();
  };

  const handleReset = () => {
    setMinAge(18);
    setMaxAge(80);
    setGender('');
    setMaxDistance(100);
    setOnlineOnly(false);
    setHasPhotos(true);
    setNewOnly(false);
    setSortBy('recent');
    setInterests([]);
  };

  const handleSave = async () => {
    if (!filterName.trim()) {
      toast.error('Enter a name for your filter');
      return;
    }
    try {
      const config = {
        minAge: minAge !== 18 ? minAge : null,
        maxAge: maxAge !== 80 ? maxAge : null,
        gender: gender || null,
        maxDistance: maxDistance !== 100 ? maxDistance : null,
        onlineOnly,
        hasPhotos,
        newOnly,
        sortBy,
        interests,
      };
      const res = await fetch('/api/filters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: filterName, config }),
      });
      if (res.ok) {
        toast.success('Filter saved');
        setFilterName('');
        loadSavedFilters();
      }
    } catch {
      toast.error('Failed to save');
    }
  };

  const handleLoadSaved = (config: DiscoveryFilters) => {
    setMinAge(config.minAge ?? 18);
    setMaxAge(config.maxAge ?? 80);
    setGender(config.gender ?? '');
    setMaxDistance(config.maxDistance ?? 100);
    setOnlineOnly(config.onlineOnly ?? false);
    setHasPhotos(config.hasPhotos ?? true);
    setNewOnly(config.newOnly ?? false);
    setSortBy(config.sortBy ?? 'recent');
    setInterests(config.interests ?? []);
  };

  const handleDeleteSaved = async (id: number) => {
    try {
      await fetch(`/api/filters?id=${id}`, { method: 'DELETE' });
      loadSavedFilters();
    } catch {
      // silent
    }
  };

  const toggleInterest = (id: string) => {
    setInterests((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 animate-fade-in" onClick={onClose}>
      <div
        className="glass-strong rounded-t-3xl sm:rounded-3xl border border-border/50 shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 glass-strong rounded-t-3xl z-10 p-4 border-b border-border/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold">Discovery Filters</h2>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-secondary transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4 space-y-5">
          {/* Saved filters */}
          {savedFilters.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-2 block">Saved Filters</label>
              <div className="flex flex-wrap gap-2">
                {savedFilters.map((f) => (
                  <div key={f.id} className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5">
                    <button onClick={() => handleLoadSaved(f.config)} className="text-xs font-medium">
                      {f.name}
                    </button>
                    <button onClick={() => handleDeleteSaved(f.id)} className="h-4 w-4 rounded-full flex items-center justify-center hover:bg-destructive/10">
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Age range */}
          <div>
            <label className="text-sm font-semibold mb-2 block">Age Range: {minAge} - {maxAge}</label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={minAge}
                onChange={(e) => setMinAge(Math.max(18, parseInt(e.target.value) || 18))}
                className="w-16 rounded-lg border border-border bg-card px-2 py-1.5 text-sm text-center"
              />
              <div className="flex-1 h-1.5 bg-secondary rounded-full relative">
                <div className="absolute h-full bg-primary rounded-full" style={{ left: `${((minAge - 18) / 62) * 100}%`, right: `${100 - ((maxAge - 18) / 62) * 100}%` }} />
              </div>
              <input
                type="number"
                value={maxAge}
                onChange={(e) => setMaxAge(Math.min(80, parseInt(e.target.value) || 80))}
                className="w-16 rounded-lg border border-border bg-card px-2 py-1.5 text-sm text-center"
              />
            </div>
          </div>

          {/* Distance */}
          <div>
            <label className="text-sm font-semibold mb-2 block">Max Distance: {maxDistance} km</label>
            <Slider value={[maxDistance]} onValueChange={(v) => setMaxDistance(v[0])} min={1} max={500} step={5} />
          </div>

          {/* Gender */}
          <div>
            <label className="text-sm font-semibold mb-2 block">Gender</label>
            <div className="flex gap-2">
              {['', 'male', 'female', 'other'].map((g) => (
                <button
                  key={g}
                  onClick={() => setGender(g)}
                  className={`flex-1 rounded-xl border-2 px-3 py-2 text-sm font-medium capitalize transition-all ${
                    gender === g ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/40'
                  }`}
                >
                  {g || 'Any'}
                </button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Online Now</span>
              <Switch checked={onlineOnly} onCheckedChange={setOnlineOnly} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Has Photos</span>
              <Switch checked={hasPhotos} onCheckedChange={setHasPhotos} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">New Users (7 days)</span>
              <Switch checked={newOnly} onCheckedChange={setNewOnly} />
            </div>
          </div>

          {/* Sort by */}
          <div>
            <label className="text-sm font-semibold mb-2 block">Sort By</label>
            <div className="flex gap-2">
              {[
                { value: 'recent', label: 'Recent' },
                { value: 'compatibility', label: 'Compatibility' },
                { value: 'distance', label: 'Distance' },
                { value: 'online', label: 'Online' },
              ].map((s) => (
                <button
                  key={s.value}
                  onClick={() => setSortBy(s.value)}
                  className={`flex-1 rounded-xl border-2 px-3 py-2 text-sm font-medium transition-all ${
                    sortBy === s.value ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/40'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Interests */}
          <div>
            <label className="text-sm font-semibold mb-2 block">Interests</label>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {Object.entries(INTEREST_LABELS).map(([id, info]) => (
                <button
                  key={id}
                  onClick={() => toggleInterest(id)}
                  className={`inline-flex items-center gap-1 rounded-full border-2 px-3 py-1.5 text-xs font-medium transition-all ${
                    interests.includes(id) ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/40'
                  }`}
                >
                  <span>{info.emoji}</span>
                  {info.label}
                </button>
              ))}
            </div>
          </div>

          {/* Save filter */}
          <div className="flex gap-2">
            <input
              type="text"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              placeholder="Save as..."
              className="flex-1 rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <Button onClick={handleSave} variant="outline" size="sm">
              <Save className="h-4 w-4" />
            </Button>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button onClick={handleReset} variant="ghost" className="rounded-xl">
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
            <Button onClick={handleApply} className="flex-1 rounded-xl bg-gradient-romance text-white">
              Apply Filters
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
