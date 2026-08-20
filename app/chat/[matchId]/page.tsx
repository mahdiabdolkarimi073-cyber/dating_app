'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import { AuroraBackground } from '@/components/aurora-background';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  Send,
  Loader2,
  Heart,
  Info,
  ImageIcon,
  Smile,
  Reply,
  Trash2,
  Copy,
  MoreVertical,
  Shield,
  X,
  Check,
  CheckCheck,
  Ban,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: number;
  senderId: number;
  content: string;
  status: string;
  mediaUrl: string | null;
  replyToId: number | null;
  read: boolean;
  createdAt: string;
}

interface ReplyMessage {
  id: number;
  content: string;
  senderId: number;
  mediaUrl: string | null;
}

interface OtherUser {
  id: number;
  name: string | null;
  username: string | null;
  photo: string | null;
  isOnline: boolean;
  lastSeen: string | null;
  showOnlineStatus: boolean;
  showLastSeen: boolean;
}

function formatMessageTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDateSeparator(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString();
}

function formatLastSeen(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  if (diffMin < 1) return 'Active now';
  if (diffMin < 60) return `Active ${diffMin}m ago`;
  if (diffHr < 24) return `Active ${diffHr}h ago`;
  return `Active ${date.toLocaleDateString()}`;
}

const EMOJI_LIST = [
  '😀', '😂', '🥰', '😍', '😘', '😎', '🤗', '🤔',
  '😢', '😭', '😡', '🥺', '😴', '🤤', '🤩', '🥳',
  '👍', '👎', '👏', '🙌', '🙏', '💪', '🤝', '✌️',
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
  '🔥', '✨', '⭐', '🌟', '💫', '🎉', '🎊', '🎈',
  '🌹', '🌸', '🌺', '🌻', '🌷', '💐', '🌹', ' wilted',
  '☕', '🍷', '🍺', '🍕', '🍔', '🍟', '🍣', '🍜',
  '🎵', '🎶', '🎤', '🎧', '🎸', '🎹', '🥁', '🎺',
  '✈️', '🚗', '🏠', '🏖️', '⛰️', '🌍', '🌙', '☀️',
];

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const matchId = Number(params.matchId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [matchStatus, setMatchStatus] = useState('active');
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [myUserId, setMyUserId] = useState<number | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showImageInput, setShowImageInput] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [contextMenu, setContextMenu] = useState<{ messageId: number; x: number; y: number } | null>(null);
  const [otherTyping, setOtherTyping] = useState(false);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [showUnmatchDialog, setShowUnmatchDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastMessageCount = useRef(0);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        setAuthChecked(true);
        if (!data.user) {
          router.push('/auth');
          return;
        }
        if (!data.user.termsAccepted) {
          router.push('/onboarding');
          return;
        }
        setMyUserId(data.user.id);
        loadMessages();
      });
  }, [router]);

  // Update presence to online on mount
  useEffect(() => {
    fetch('/api/presence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ online: true }),
    });
    return () => {
      fetch('/api/presence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ online: false }),
      });
    };
  }, []);

  const loadMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/messages?matchId=${matchId}`);
      const data = await res.json();
      if (res.ok) {
        setMessages(data.messages);
        setOtherUser(data.otherUser);
        setMatchStatus(data.matchStatus || 'active');
        lastMessageCount.current = data.messages.length;
      } else {
        toast.error(data.error || 'Failed to load chat');
        router.push('/matches');
      }
    } catch {
      toast.error('Failed to load chat');
    } finally {
      setLoading(false);
    }
  }, [matchId, router]);

  // SSE: real-time message stream
  useEffect(() => {
    if (!authChecked || !myUserId) return;

    const eventSource = new EventSource(`/api/messages/stream?matchId=${matchId}`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'message' && data.message) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === data.message.id)) return prev;
            return [...prev, data.message];
          });
        } else if (data.type === 'delete' && data.messageId) {
          setMessages((prev) => prev.filter((m) => m.id !== data.messageId));
        } else if (data.type === 'status' && data.messageId && data.status) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === data.messageId ? { ...m, status: data.status, read: data.status === 'seen' ? true : m.read } : m
            )
          );
        } else if (data.type === 'unmatch') {
          setMatchStatus('unmatched');
        }
      } catch {
        // ignore parse errors
      }
    };

    eventSource.onerror = () => {
      // EventSource auto-reconnects
    };

    return () => {
      eventSource.close();
    };
  }, [authChecked, myUserId, matchId]);

  // Poll typing status
  useEffect(() => {
    if (matchStatus !== 'active') return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/typing?matchId=${matchId}`);
        if (res.ok) {
          const data = await res.json();
          setOtherTyping(data.typing);
        }
      } catch {
        // silent
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [matchId, matchStatus]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > lastMessageCount.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      lastMessageCount.current = messages.length;
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }
  }, [messages]);

  // Mark messages as delivered when received
  useEffect(() => {
    if (matchStatus === 'active' && messages.length > 0) {
      fetch('/api/messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId, status: 'seen' }),
      });
    }
  }, [matchId, messages.length, matchStatus]);

  const handleTyping = (value: string) => {
    setInput(value);
    if (matchStatus !== 'active') return;

    // Send typing indicator
    fetch('/api/typing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matchId, typing: true }),
    });

    // Clear after 2 seconds of no typing
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      fetch('/api/typing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId, typing: false }),
      });
    }, 2000);
  };

  const handleSend = async () => {
    if (!input.trim() || sending || !myUserId || matchStatus !== 'active') return;
    const content = input.trim();
    setInput('');
    setShowEmoji(false);
    setSending(true);

    // Stop typing indicator
    fetch('/api/typing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matchId, typing: false }),
    });

    const optimisticId = Date.now();
    const optimisticMsg: Message = {
      id: optimisticId,
      senderId: myUserId,
      content,
      status: 'sent',
      mediaUrl: null,
      replyToId: replyTo?.id || null,
      read: false,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setReplyTo(null);

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId, content, replyToId: replyTo?.id || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to send');
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
        setInput(content);
      } else if (data.message) {
        setMessages((prev) =>
          prev.map((m) => (m.id === optimisticId ? data.message : m))
        );
      }
    } catch {
      toast.error('Failed to send');
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      setInput(content);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleSendImage = async () => {
    if (!imageUrl.trim() || sending || matchStatus !== 'active') return;
    const url = imageUrl.trim();
    setImageUrl('');
    setShowImageInput(false);
    setSending(true);

    const optimisticId = Date.now();
    const optimisticMsg: Message = {
      id: optimisticId,
      senderId: myUserId!,
      content: '',
      status: 'sent',
      mediaUrl: url,
      replyToId: null,
      read: false,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId, content: '', mediaUrl: url }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to send');
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      } else if (data.message) {
        setMessages((prev) =>
          prev.map((m) => (m.id === optimisticId ? data.message : m))
        );
      }
    } catch {
      toast.error('Failed to send');
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDeleteMessage = async (messageId: number) => {
    try {
      await fetch(`/api/messages?messageId=${messageId}`, { method: 'DELETE' });
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      setContextMenu(null);
      toast.success('Message deleted', { duration: 1500 });
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    setContextMenu(null);
    toast.success('Copied to clipboard', { duration: 1500 });
  };

  const handleUnmatch = async (alsoBlock: boolean) => {
    try {
      const res = await fetch('/api/unmatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId, alsoBlock }),
      });
      if (res.ok) {
        setMatchStatus('unmatched');
        setShowUnmatchDialog(false);
        setShowBlockDialog(false);
        toast.success('Match removed', { duration: 2000 });
        setTimeout(() => router.push('/matches'), 1500);
      } else {
        toast.error('Failed to unmatch');
      }
    } catch {
      toast.error('Failed to unmatch');
    }
  };

  const handleReport = async () => {
    if (!reportReason) {
      toast.error('Please select a reason');
      return;
    }
    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportedId: otherUser?.id,
          reason: reportReason,
          targetType: 'user',
        }),
      });
      if (res.ok) {
        setShowReportDialog(false);
        setReportReason('');
        toast.success('Report submitted. Thank you.', { duration: 2000 });
      } else {
        toast.error('Failed to submit report');
      }
    } catch {
      toast.error('Failed to submit report');
    }
  };

  const handleBlock = async () => {
    try {
      const res = await fetch('/api/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: otherUser?.id }),
      });
      if (res.ok) {
        setShowBlockDialog(false);
        setMatchStatus('unmatched');
        toast.success('User blocked', { duration: 2000 });
        setTimeout(() => router.push('/matches'), 1500);
      } else {
        toast.error('Failed to block');
      }
    } catch {
      toast.error('Failed to block');
    }
  };

  if (!authChecked || loading) {
    return (
      <AuroraBackground>
        <div className="flex min-h-screen items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground text-sm">Loading chat...</p>
          </div>
        </div>
      </AuroraBackground>
    );
  }

  if (!otherUser) return null;

  let lastDate = '';
  const isUnmatched = matchStatus === 'unmatched';

  return (
    <AuroraBackground>
      <div className="h-screen flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b border-border/50 glass-strong z-20">
          <div className="max-w-3xl mx-auto w-full flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Button
                onClick={() => router.push('/matches')}
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <button
                onClick={() => router.push(`/profile/${otherUser.id}`)}
                className="flex items-center gap-3 min-w-0 hover:opacity-80 transition-opacity"
              >
                <div className="relative h-10 w-10 rounded-full overflow-hidden border-2 border-primary/20 flex-shrink-0">
                  {otherUser.photo ? (
                    <img
                      src={otherUser.photo}
                      alt={otherUser.name || 'User'}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-gradient-romance">
                      <span className="text-sm font-bold text-white">
                        {otherUser.name?.[0]?.toUpperCase() || '?'}
                      </span>
                    </div>
                  )}
                  {otherUser.showOnlineStatus && otherUser.isOnline && (
                    <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-green-500 border-2 border-card" />
                  )}
                </div>
                <div className="min-w-0 text-left">
                  <h2 className="font-semibold truncate text-sm">{otherUser.name}</h2>
                  <p className="text-xs text-muted-foreground truncate">
                    {otherUser.showOnlineStatus && otherUser.isOnline
                      ? 'Active now'
                      : otherUser.lastSeen
                      ? formatLastSeen(otherUser.lastSeen)
                      : `@${otherUser.username}`}
                  </p>
                </div>
              </button>
            </div>
            <div className="flex items-center gap-1">
              <Button
                onClick={() => router.push(`/profile/${otherUser.id}`)}
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Info className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => setShowUnmatchDialog(true)}
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-destructive transition-colors"
                title="Unmatch"
              >
                <Heart className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => setShowReportDialog(true)}
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-destructive transition-colors"
                title="Report"
              >
                <Shield className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => setShowBlockDialog(true)}
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-destructive transition-colors"
                title="Block"
              >
                <Ban className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="max-w-3xl mx-auto w-full space-y-1">
            {/* Match banner */}
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-romance shadow-lg shadow-primary/30 mb-3 animate-scale-in">
                <Heart className="h-8 w-8 text-white fill-white" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                You matched with {otherUser.name}
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Say hello and start the conversation
              </p>
            </div>

            {messages.map((msg) => {
              const isMine = msg.senderId === myUserId;
              const dateStr = formatDateSeparator(msg.createdAt);
              const showDate = dateStr !== lastDate;
              lastDate = dateStr;
              const replyMsg = msg.replyToId
                ? messages.find((m) => m.id === msg.replyToId)
                : null;

              return (
                <div key={msg.id}>
                  {showDate && (
                    <div className="flex items-center justify-center my-4">
                      <span className="text-xs text-muted-foreground bg-secondary/50 px-3 py-1 rounded-full">
                        {dateStr}
                      </span>
                    </div>
                  )}
                  <div
                    className={cn(
                      'flex animate-fade-in-up',
                      isMine ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div className="group relative max-w-[75%]">
                      {/* Reply preview */}
                      {replyMsg && (
                        <div
                          className={cn(
                            'mb-1 px-3 py-1.5 rounded-lg text-xs border-l-2 truncate',
                            isMine
                              ? 'border-white/50 bg-white/10 text-white/70'
                              : 'border-primary bg-primary/5 text-muted-foreground'
                          )}
                        >
                          {replyMsg.mediaUrl ? (
                            <span className="italic">📷 Photo</span>
                          ) : (
                            <span className="truncate">{replyMsg.content}</span>
                          )}
                        </div>
                      )}
                      <div
                        onContextMenu={(e) => {
                          e.preventDefault();
                          setContextMenu({ messageId: msg.id, x: e.clientX, y: e.clientY });
                        }}
                        className={cn(
                          'rounded-2xl px-4 py-2.5 shadow-sm cursor-pointer',
                          isMine
                            ? 'bg-gradient-romance text-white rounded-br-md'
                            : 'bg-card border border-border/50 text-foreground rounded-bl-md'
                        )}
                      >
                        {msg.mediaUrl && (
                          <div className="mb-2">
                            <img
                              src={msg.mediaUrl}
                              alt="Shared image"
                              className="rounded-xl max-h-64 w-full object-cover"
                            />
                          </div>
                        )}
                        {msg.content && (
                          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                            {msg.content}
                          </p>
                        )}
                        <div className="flex items-center justify-end gap-1 mt-1">
                          <p
                            className={cn(
                              'text-[10px]',
                              isMine ? 'text-white/60' : 'text-muted-foreground'
                            )}
                          >
                            {formatMessageTime(msg.createdAt)}
                          </p>
                          {isMine && (
                            <span className="ml-1">
                              {msg.status === 'seen' ? (
                                <CheckCheck className="h-3 w-3 text-white/80" />
                              ) : msg.status === 'delivered' ? (
                                <CheckCheck className="h-3 w-3 text-white/50" />
                              ) : (
                                <Check className="h-3 w-3 text-white/40" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Context menu */}
                      {contextMenu?.messageId === msg.id && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setContextMenu(null)}
                          />
                          <div
                            className="fixed z-50 rounded-xl border border-border/50 glass-strong shadow-2xl py-1 min-w-[140px]"
                            style={{
                              left: Math.min(contextMenu.x, window.innerWidth - 160),
                              top: Math.min(contextMenu.y, window.innerHeight - 200),
                            }}
                          >
                            <button
                              onClick={() => {
                                setReplyTo(msg);
                                setContextMenu(null);
                                inputRef.current?.focus();
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary/50 transition-colors text-left"
                            >
                              <Reply className="h-4 w-4 text-muted-foreground" />
                              Reply
                            </button>
                            {msg.content && (
                              <button
                                onClick={() => handleCopyMessage(msg.content)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary/50 transition-colors text-left"
                              >
                                <Copy className="h-4 w-4 text-muted-foreground" />
                                Copy
                              </button>
                            )}
                            {isMine && (
                              <button
                                onClick={() => handleDeleteMessage(msg.id)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-destructive/10 text-destructive transition-colors text-left"
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Typing indicator */}
            {otherTyping && !isUnmatched && (
              <div className="flex justify-start animate-fade-in">
                <div className="bg-card border border-border/50 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Reply preview bar */}
        {replyTo && (
          <div className="px-4 py-2 border-t border-border/50 glass-strong">
            <div className="max-w-3xl mx-auto w-full flex items-center gap-2">
              <Reply className="h-4 w-4 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0 border-l-2 border-primary pl-2">
                <p className="text-xs text-muted-foreground">
                  Replying to {replyTo.senderId === myUserId ? 'yourself' : otherUser.name}
                </p>
                <p className="text-sm truncate">
                  {replyTo.mediaUrl ? '📷 Photo' : replyTo.content}
                </p>
              </div>
              <Button
                onClick={() => setReplyTo(null)}
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Emoji picker */}
        {showEmoji && (
          <div className="px-4 py-2 border-t border-border/50 glass-strong">
            <div className="max-w-3xl mx-auto w-full">
              <div className="grid grid-cols-8 sm:grid-cols-10 gap-1 max-h-40 overflow-y-auto">
                {EMOJI_LIST.map((emoji, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setInput((prev) => prev + emoji);
                      inputRef.current?.focus();
                    }}
                    className="text-2xl hover:bg-secondary rounded-lg p-1 transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Image URL input */}
        {showImageInput && (
          <div className="px-4 py-2 border-t border-border/50 glass-strong">
            <div className="max-w-3xl mx-auto w-full flex items-center gap-2">
              <Input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Paste image URL..."
                className="flex-1"
                onKeyDown={(e) => e.key === 'Enter' && handleSendImage()}
              />
              <Button
                onClick={handleSendImage}
                size="sm"
                className="bg-gradient-romance text-white"
                disabled={!imageUrl.trim()}
              >
                Send
              </Button>
              <Button
                onClick={() => setShowImageInput(false)}
                variant="ghost"
                size="sm"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Input bar */}
        <div className="px-4 py-3 border-t border-border/50 glass-strong z-20">
          <div className="max-w-3xl mx-auto w-full flex items-center gap-2">
            {isUnmatched ? (
              <div className="flex-1 text-center py-2 text-sm text-muted-foreground">
                This match has been removed. Messages are disabled.
              </div>
            ) : (
              <>
                <Button
                  onClick={() => { setShowEmoji(!showEmoji); setShowImageInput(false); }}
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-full flex-shrink-0"
                  title="Emoji"
                >
                  <Smile className="h-5 w-5 text-muted-foreground" />
                </Button>
                <Button
                  onClick={() => { setShowImageInput(!showImageInput); setShowEmoji(false); }}
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-full flex-shrink-0"
                  title="Send image"
                >
                  <ImageIcon className="h-5 w-5 text-muted-foreground" />
                </Button>
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => handleTyping(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message..."
                  maxLength={2000}
                  className="flex-1 rounded-full border-border/50 bg-card focus-visible:ring-primary/30"
                  disabled={sending}
                  autoFocus
                />
                <Button
                  onClick={handleSend}
                  size="icon"
                  className="h-11 w-11 rounded-full bg-gradient-romance shadow-lg shadow-primary/30 hover:scale-105 active:scale-95 transition-all flex-shrink-0"
                  disabled={!input.trim() || sending}
                >
                  {sending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5 text-white" />
                  )}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Unmatch dialog */}
        {showUnmatchDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in" onClick={() => setShowUnmatchDialog(false)}>
            <div className="glass-strong rounded-2xl border border-border/50 shadow-2xl p-6 max-w-sm mx-4 animate-scale-in" onClick={(e) => e.stopPropagation()}>
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 mx-auto mb-4">
                <Heart className="h-7 w-7 text-destructive" />
              </div>
              <h3 className="text-lg font-bold text-center mb-2">Unmatch with {otherUser.name}?</h3>
              <p className="text-sm text-muted-foreground text-center mb-6">
                This will remove your match and delete the chat. You won't be able to message each other anymore. This cannot be undone.
              </p>
              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => handleUnmatch(false)}
                  variant="outline"
                  className="rounded-xl border-destructive/30 hover:border-destructive hover:bg-destructive/10"
                >
                  Just unmatch
                </Button>
                <Button
                  onClick={() => handleUnmatch(true)}
                  className="rounded-xl bg-destructive text-white hover:bg-destructive/90"
                >
                  Unmatch & Block
                </Button>
                <Button
                  onClick={() => setShowUnmatchDialog(false)}
                  variant="ghost"
                  className="rounded-xl"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Block dialog */}
        {showBlockDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in" onClick={() => setShowBlockDialog(false)}>
            <div className="glass-strong rounded-2xl border border-border/50 shadow-2xl p-6 max-w-sm mx-4 animate-scale-in" onClick={(e) => e.stopPropagation()}>
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 mx-auto mb-4">
                <Ban className="h-7 w-7 text-destructive" />
              </div>
              <h3 className="text-lg font-bold text-center mb-2">Block {otherUser.name}?</h3>
              <p className="text-sm text-muted-foreground text-center mb-6">
                They won't be able to see your profile, send you messages, or appear in your suggestions. You will be unmatched automatically.
              </p>
              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleBlock}
                  className="rounded-xl bg-destructive text-white hover:bg-destructive/90"
                >
                  Block
                </Button>
                <Button
                  onClick={() => setShowBlockDialog(false)}
                  variant="ghost"
                  className="rounded-xl"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Report dialog */}
        {showReportDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in" onClick={() => setShowReportDialog(false)}>
            <div className="glass-strong rounded-2xl border border-border/50 shadow-2xl p-6 max-w-sm mx-4 animate-scale-in" onClick={(e) => e.stopPropagation()}>
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 mx-auto mb-4">
                <Shield className="h-7 w-7 text-destructive" />
              </div>
              <h3 className="text-lg font-bold text-center mb-2">Report {otherUser.name}</h3>
              <p className="text-sm text-muted-foreground text-center mb-4">Why are you reporting this user?</p>
              <div className="space-y-2 mb-4">
                {[
                  { value: 'harassment', label: 'Harassment' },
                  { value: 'fake_profile', label: 'Fake Profile' },
                  { value: 'inappropriate_content', label: 'Inappropriate Content' },
                  { value: 'scam', label: 'Scam' },
                  { value: 'spam', label: 'Spam' },
                  { value: 'other', label: 'Other' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setReportReason(opt.value)}
                    className={cn(
                      'w-full flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-sm transition-all',
                      reportReason === opt.value
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/40'
                    )}
                  >
                    <div className={cn(
                      'flex h-5 w-5 items-center justify-center rounded-full border-2',
                      reportReason === opt.value ? 'border-primary bg-primary' : 'border-border'
                    )}>
                      {reportReason === opt.value && <Check className="h-3 w-3 text-white" />}
                    </div>
                    {opt.label}
                  </button>
                ))}
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleReport}
                  disabled={!reportReason}
                  className="rounded-xl bg-destructive text-white hover:bg-destructive/90"
                >
                  Submit Report
                </Button>
                <Button
                  onClick={() => setShowReportDialog(false)}
                  variant="ghost"
                  className="rounded-xl"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuroraBackground>
  );
}
