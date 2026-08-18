'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Plus,
  X,
  Loader2,
  Camera,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StoryItem {
  id: number;
  mediaUrl: string;
  caption: string | null;
  createdAt: string;
  viewed: boolean;
  viewCount: number;
}

interface StoryGroup {
  userId: number;
  name: string | null;
  username: string | null;
  photo: string | null;
  stories: StoryItem[];
}

export function StoriesBar() {
  const router = useRouter();
  const [feed, setFeed] = useState<StoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showViewer, setShowViewer] = useState(false);
  const [activeGroup, setActiveGroup] = useState(0);
  const [activeStory, setActiveStory] = useState(0);
  const [showUploader, setShowUploader] = useState(false);
  const [uploadUrl, setUploadUrl] = useState('');
  const [uploadCaption, setUploadCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadStories = useCallback(async () => {
    try {
      const res = await fetch('/api/stories');
      const data = await res.json();
      if (res.ok) {
        setFeed(data.feed);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStories();
  }, [loadStories]);

  // Progress bar for story viewer
  useEffect(() => {
    if (!showViewer) {
      if (progressTimer.current) clearInterval(progressTimer.current);
      return;
    }

    const currentGroup = feed[activeGroup];
    if (!currentGroup) return;
    const currentStory = currentGroup.stories[activeStory];
    if (!currentStory) return;

    // Mark as viewed
    fetch('/api/stories/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storyId: currentStory.id }),
    }).catch(() => {});

    let progress = 0;
    const duration = 5000; // 5 seconds per story
    const interval = 50;
    const increment = (interval / duration) * 100;

    progressTimer.current = setInterval(() => {
      progress += increment;
      if (progress >= 100) {
        // Move to next story
        if (activeStory < currentGroup.stories.length - 1) {
          setActiveStory((prev) => prev + 1);
        } else if (activeGroup < feed.length - 1) {
          setActiveGroup((prev) => prev + 1);
          setActiveStory(0);
        } else {
          setShowViewer(false);
        }
      }
      const bar = document.getElementById('story-progress-bar');
      if (bar) bar.style.width = `${progress}%`;
    }, interval);

    return () => {
      if (progressTimer.current) clearInterval(progressTimer.current);
    };
  }, [showViewer, activeGroup, activeStory, feed]);

  const openStory = (groupIndex: number) => {
    setActiveGroup(groupIndex);
    setActiveStory(0);
    setShowViewer(true);
  };

  const handleNext = () => {
    const currentGroup = feed[activeGroup];
    if (!currentGroup) return;
    if (activeStory < currentGroup.stories.length - 1) {
      setActiveStory((prev) => prev + 1);
    } else if (activeGroup < feed.length - 1) {
      setActiveGroup((prev) => prev + 1);
      setActiveStory(0);
    } else {
      setShowViewer(false);
    }
  };

  const handlePrev = () => {
    if (activeStory > 0) {
      setActiveStory((prev) => prev - 1);
    } else if (activeGroup > 0) {
      setActiveGroup((prev) => prev - 1);
      const prevGroup = feed[activeGroup - 1];
      setActiveStory(prevGroup.stories.length - 1);
    }
  };

  const handleUpload = async () => {
    if (!uploadUrl.trim() || uploading) return;
    setUploading(true);
    try {
      const res = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaUrl: uploadUrl.trim(), caption: uploadCaption.trim() || undefined }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Story posted!');
        setShowUploader(false);
        setUploadUrl('');
        setUploadCaption('');
        loadStories();
      } else {
        toast.error(data.error || 'Failed to post story');
      }
    } catch {
      toast.error('Failed to post story');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex gap-3 overflow-hidden">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 w-16 rounded-full bg-secondary animate-pulse flex-shrink-0" />
        ))}
      </div>
    );
  }

  if (feed.length === 0) {
    return (
      <div className="flex items-center gap-3">
        <button
          onClick={() => setShowUploader(true)}
          className="flex flex-col items-center gap-1.5 flex-shrink-0"
        >
          <div className="relative h-16 w-16 rounded-full border-2 border-dashed border-primary/40 flex items-center justify-center hover:border-primary hover:bg-primary/5 transition-all">
            <Plus className="h-6 w-6 text-primary" />
          </div>
          <span className="text-[10px] text-muted-foreground font-medium">Add Story</span>
        </button>
        <p className="text-xs text-muted-foreground">No stories yet. Share a moment!</p>
        {showUploader && (
          <StoryUploader
            uploadUrl={uploadUrl}
            setUploadUrl={setUploadUrl}
            uploadCaption={uploadCaption}
            setUploadCaption={setUploadCaption}
            uploading={uploading}
            onUpload={handleUpload}
            onClose={() => setShowUploader(false)}
          />
        )}
      </div>
    );
  }

  return (
    <>
      <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
        {/* Add story button */}
        <button
          onClick={() => setShowUploader(true)}
          className="flex flex-col items-center gap-1.5 flex-shrink-0"
        >
          <div className="relative h-16 w-16 rounded-full border-2 border-dashed border-primary/40 flex items-center justify-center hover:border-primary hover:bg-primary/5 transition-all">
            <Plus className="h-6 w-6 text-primary" />
          </div>
          <span className="text-[10px] text-muted-foreground font-medium">Your Story</span>
        </button>

        {/* Story circles */}
        {feed.map((group, i) => {
          const hasUnviewed = group.stories.some((s) => !s.viewed);
          return (
            <button
              key={group.userId}
              onClick={() => openStory(i)}
              className="flex flex-col items-center gap-1.5 flex-shrink-0 group"
            >
              <div
                className={cn(
                  'relative h-16 w-16 rounded-full p-0.5 transition-all group-hover:scale-105',
                  hasUnviewed
                    ? 'bg-gradient-romance'
                    : 'bg-border'
                )}
              >
                <div className="h-full w-full rounded-full overflow-hidden border-2 border-background">
                  {group.photo ? (
                    <img
                      src={group.photo || undefined}
                      alt={group.name || 'User'}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-gradient-romance">
                      <span className="text-lg font-bold text-white">
                        {group.name?.[0]?.toUpperCase() || '?'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <span className="text-[10px] text-muted-foreground font-medium max-w-[64px] truncate">
                {group.name || 'User'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Story Viewer */}
      {showViewer && feed[activeGroup] && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center animate-fade-in"
          onClick={() => setShowViewer(false)}
        >
          {/* Progress bars */}
          <div className="absolute top-4 left-4 right-4 flex gap-1.5 z-10">
            {feed[activeGroup].stories.map((_, i) => (
              <div key={i} className="h-1 flex-1 rounded-full bg-white/20 overflow-hidden">
                {i < activeStory && <div className="h-full w-full bg-white" />}
                {i === activeStory && (
                  <div
                    id="story-progress-bar"
                    className="h-full bg-white transition-none"
                    style={{ width: '0%' }}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Header */}
          <div className="absolute top-8 left-4 right-4 flex items-center justify-between z-10">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-full overflow-hidden border-2 border-white/30">
                {feed[activeGroup].photo ? (
                  <img
                    src={feed[activeGroup].photo || undefined}
                    alt={feed[activeGroup].name || 'User'}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-gradient-romance">
                    <span className="text-sm font-bold text-white">
                      {feed[activeGroup].name?.[0]?.toUpperCase() || '?'}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  {feed[activeGroup].name || 'User'}
                </p>
                <p className="text-xs text-white/60">@{feed[activeGroup].username}</p>
              </div>
            </div>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                setShowViewer(false);
              }}
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Story content */}
          <div
            className="relative max-w-md w-full h-full max-h-[80vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={feed[activeGroup].stories[activeStory]?.mediaUrl}
              alt="Story"
              className="max-w-full max-h-full object-contain"
            />
            {feed[activeGroup].stories[activeStory]?.caption && (
              <div className="absolute bottom-20 left-4 right-4 text-center">
                <p className="text-white text-lg font-medium bg-black/40 backdrop-blur-sm rounded-xl px-4 py-2 inline-block">
                  {feed[activeGroup].stories[activeStory].caption}
                </p>
              </div>
            )}
          </div>

          {/* Navigation */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            className="absolute left-0 top-0 bottom-0 w-1/4 flex items-center justify-start pl-2 z-10"
          >
            {activeGroup > 0 || activeStory > 0 ? (
              <div className="h-10 w-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors">
                <ChevronLeft className="h-6 w-6 text-white" />
              </div>
            ) : null}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-0 top-0 bottom-0 w-1/4 flex items-center justify-end pr-2 z-10"
          >
            <div className="h-10 w-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors">
              <ChevronRight className="h-6 w-6 text-white" />
            </div>
          </button>
        </div>
      )}

      {/* Story Uploader */}
      {showUploader && (
        <StoryUploader
          uploadUrl={uploadUrl}
          setUploadUrl={setUploadUrl}
          uploadCaption={uploadCaption}
          setUploadCaption={setUploadCaption}
          uploading={uploading}
          onUpload={handleUpload}
          onClose={() => setShowUploader(false)}
        />
      )}
    </>
  );
}

function StoryUploader({
  uploadUrl,
  setUploadUrl,
  uploadCaption,
  setUploadCaption,
  uploading,
  onUpload,
  onClose,
}: {
  uploadUrl: string;
  setUploadUrl: (v: string) => void;
  uploadCaption: string;
  setUploadCaption: (v: string) => void;
  uploading: boolean;
  onUpload: () => void;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl bg-card border border-border/50 shadow-2xl p-6 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold">Share a Story</h3>
          <Button onClick={onClose} variant="ghost" size="icon" className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
              Image URL
            </label>
            <Input
              value={uploadUrl}
              onChange={(e) => setUploadUrl(e.target.value)}
              placeholder="https://example.com/photo.jpg"
              className="rounded-xl"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
              Caption (optional)
            </label>
            <Input
              value={uploadCaption}
              onChange={(e) => setUploadCaption(e.target.value)}
              placeholder="What's on your mind?"
              maxLength={200}
              className="rounded-xl"
            />
          </div>

          {uploadUrl && (
            <div className="rounded-xl overflow-hidden border border-border/50 aspect-square">
              <img
                src={uploadUrl}
                alt="Preview"
                className="h-full w-full object-cover"
              />
            </div>
          )}

          <Button
            onClick={onUpload}
            disabled={!uploadUrl.trim() || uploading}
            className="w-full rounded-xl bg-gradient-romance text-white shadow-lg shadow-primary/30 hover:scale-[1.02] transition-all"
          >
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Camera className="h-5 w-5" />
                Post Story
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Stories disappear after 24 hours
          </p>
        </div>
      </div>
    </div>
  );
}
