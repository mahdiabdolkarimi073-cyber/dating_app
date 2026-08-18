'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import { AuroraBackground } from '@/components/aurora-background';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, Loader2, LogOut, Heart, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: number;
  senderId: number;
  content: string;
  read: boolean;
  createdAt: string;
}

interface OtherUser {
  id: number;
  name: string | null;
  username: string | null;
  photo: string | null;
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

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const matchId = Number(params.matchId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [myUserId, setMyUserId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastMessageCount = useRef(0);

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

  const loadMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/messages?matchId=${matchId}`);
      const data = await res.json();
      if (res.ok) {
        setMessages(data.messages);
        setOtherUser(data.otherUser);
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
        }
      } catch {
        // ignore parse errors
      }
    };

    eventSource.onerror = () => {
      // EventSource auto-reconnects; fall back to polling if it fails repeatedly
    };

    return () => {
      eventSource.close();
    };
  }, [authChecked, myUserId, matchId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > lastMessageCount.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      lastMessageCount.current = messages.length;
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || sending || !myUserId) return;
    const content = input.trim();
    setInput('');
    setSending(true);

    // Optimistic: add message immediately
    const optimisticId = Date.now();
    const optimisticMsg: Message = {
      id: optimisticId,
      senderId: myUserId,
      content,
      read: false,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId, content }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to send');
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
        setInput(content);
      } else if (data.message) {
        // Replace optimistic message with real one
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
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

  return (
    <AuroraBackground>
      <div className="h-screen flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b border-border/50 glass-strong z-20">
          <div className="max-w-2xl mx-auto w-full flex items-center justify-between gap-3">
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
                  <div className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-gradient-romance border-2 border-card">
                    <Heart className="h-2 w-2 text-white fill-white" />
                  </div>
                </div>
                <div className="min-w-0 text-left">
                  <h2 className="font-semibold truncate text-sm">{otherUser.name}</h2>
                  <p className="text-xs text-muted-foreground truncate">@{otherUser.username}</p>
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
                onClick={handleLogout}
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="max-w-2xl mx-auto w-full space-y-1">
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
                    <div
                      className={cn(
                        'max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm',
                        isMine
                          ? 'bg-gradient-romance text-white rounded-br-md'
                          : 'bg-card border border-border/50 text-foreground rounded-bl-md'
                      )}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                        {msg.content}
                      </p>
                      <p
                        className={cn(
                          'text-[10px] mt-1 text-right',
                          isMine ? 'text-white/60' : 'text-muted-foreground'
                        )}
                      >
                        {formatMessageTime(msg.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input bar */}
        <div className="px-4 py-3 border-t border-border/50 glass-strong z-20">
          <div className="max-w-2xl mx-auto w-full flex items-center gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
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
          </div>
        </div>
      </div>
    </AuroraBackground>
  );
}
