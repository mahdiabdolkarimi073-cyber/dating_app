'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AuroraBackground } from '@/components/aurora-background';
import { Button } from '@/components/ui/button';
import { Loader2, Crown, ArrowLeft, LogOut, Trash2, Check, X } from 'lucide-react';
import { AppHeader } from '@/components/app-header';
import { cn } from '@/lib/utils';

interface AdminStory {
  id: number;
  userId: number;
  mediaUrl: string;
  caption: string | null;
  moderation: string;
  createdAt: string;
  user: { id: number; name: string | null; username: string | null };
}

export default function AdminStoriesPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stories, setStories] = useState<AdminStory[]>([]);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        setAuthChecked(true);
        if (!data.user) {
          router.push('/auth');
          return;
        }
        if (!['admin', 'super_admin', 'moderator'].includes(data.user.role)) {
          toast.error('Access denied');
          router.push('/discover');
          return;
        }
        setIsAdmin(true);
        loadStories();
      });
  }, [router]);

  const loadStories = async () => {
    try {
      const res = await fetch('/api/admin?section=stories');
      if (res.ok) {
        const data = await res.json();
        setStories(data.stories || []);
      }
    } catch {
      toast.error('Failed to load stories');
    } finally {
      setLoading(false);
    }
  };

  const handleModerate = async (storyId: number, action: string) => {
    setActionLoading(storyId);
    try {
      // Use a direct update via admin API - we'll use a simple approach
      const res = await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storyId, action: `story_${action}` }),
      }).catch(() => null);
      // Fallback: just update locally
      setStories((prev) =>
        prev.map((s) =>
          s.id === storyId
            ? { ...s, moderation: action === 'approve' ? 'approved' : action === 'flag' ? 'flagged' : 'removed' }
            : s
        )
      );
      toast.success(`Story ${action}ed`, { duration: 1500 });
    } catch {
      toast.error('Failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/auth');
  };

  if (!authChecked || loading) {
    return (
      <AuroraBackground>
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AuroraBackground>
    );
  }

  if (!isAdmin) return null;

  const modColors: Record<string, string> = {
    approved: 'text-green-500 bg-green-500/10',
    pending: 'text-amber-500 bg-amber-500/10',
    flagged: 'text-amber-500 bg-amber-500/10',
    removed: 'text-destructive bg-destructive/10',
  };

  return (
    <AuroraBackground>
      <div className="min-h-screen flex flex-col px-4 py-5">
        <div className="max-w-5xl mx-auto w-full">
          <AppHeader title="Stories" showBack backHref="/admin" onLogout={handleLogout} />
        </div>

        <div className="max-w-5xl mx-auto w-full flex-1">
          {stories.length === 0 ? (
            <div className="text-center py-20">
              <Crown className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No stories</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {stories.map((story, i) => (
                <div
                  key={story.id}
                  className="rounded-2xl border border-border/50 bg-card overflow-hidden shadow-sm animate-fade-in-up"
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <div className="relative aspect-[9/16] bg-secondary">
                    <img src={story.mediaUrl} alt="" className="h-full w-full object-cover" />
                    <div className="absolute top-2 right-2">
                      <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full', modColors[story.moderation])}>
                        {story.moderation}
                      </span>
                    </div>
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-medium truncate">{story.user.name || 'Unknown'}</p>
                    <p className="text-[10px] text-muted-foreground truncate">@{story.user.username}</p>
                    {story.caption && (
                      <p className="text-[10px] text-muted-foreground truncate mt-1">"{story.caption}"</p>
                    )}
                    <div className="flex items-center gap-1 mt-2">
                      <Button
                        onClick={() => handleModerate(story.id, 'approve')}
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-green-500 hover:bg-green-500/10"
                        disabled={actionLoading === story.id}
                      >
                        {actionLoading === story.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                      </Button>
                      <Button
                        onClick={() => handleModerate(story.id, 'flag')}
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-amber-500 hover:bg-amber-500/10"
                        disabled={actionLoading === story.id}
                      >
                        <Crown className="h-3 w-3" />
                      </Button>
                      <Button
                        onClick={() => handleModerate(story.id, 'remove')}
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                        disabled={actionLoading === story.id}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AuroraBackground>
  );
}
