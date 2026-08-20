'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AuroraBackground } from '@/components/aurora-background';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Users, Search, Ban, ShieldCheck, ShieldX, Crown, Trash2, ArrowLeft, LogOut } from 'lucide-react';
import { AppHeader } from '@/components/app-header';
import { cn } from '@/lib/utils';

interface AdminUser {
  id: number;
  name: string | null;
  username: string | null;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  moderationFlag: string | null;
  suspendedUntil: string | null;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState('');
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
        loadUsers();
      });
  }, [router]);

  const loadUsers = async (q?: string) => {
    try {
      const res = await fetch(`/api/admin?section=users${q ? `&q=${encodeURIComponent(q)}` : ''}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    loadUsers(search);
  };

  const handleAction = async (userId: number, action: string, role?: string) => {
    setActionLoading(userId);
    try {
      const res = await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action, role }),
      });
      if (res.ok) {
        toast.success(`User ${action}ed`, { duration: 1500 });
        loadUsers(search);
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed');
      }
    } catch {
      toast.error('Failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (userId: number) => {
    if (!confirm('Are you sure? This permanently deletes the user and all their data.')) return;
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/admin?userId=${userId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('User deleted', { duration: 1500 });
        loadUsers(search);
      } else {
        toast.error('Failed to delete');
      }
    } catch {
      toast.error('Failed to delete');
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

  const statusColors: Record<string, string> = {
    active: 'text-green-500 bg-green-500/10',
    suspended: 'text-amber-500 bg-amber-500/10',
    banned: 'text-destructive bg-destructive/10',
  };

  const roleColors: Record<string, string> = {
    user: 'text-muted-foreground bg-secondary',
    moderator: 'text-blue-500 bg-blue-500/10',
    admin: 'text-primary bg-primary/10',
    super_admin: 'text-amber-500 bg-amber-500/10',
  };

  return (
    <AuroraBackground>
      <div className="min-h-screen flex flex-col px-4 py-5">
        <div className="max-w-5xl mx-auto w-full">
          <AppHeader title="Manage Users" showBack backHref="/admin" onLogout={handleLogout} />
        </div>

        <div className="max-w-5xl mx-auto w-full flex-1">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, username, or email..."
                className="pl-10"
              />
            </div>
            <Button type="submit" variant="outline">Search</Button>
          </form>

          {/* Users list */}
          {users.length === 0 ? (
            <div className="text-center py-20">
              <Users className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No users found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {users.map((user, i) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 rounded-2xl border border-border/50 bg-card p-3 shadow-sm animate-fade-in-up"
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-romance flex-shrink-0">
                    <span className="text-sm font-bold text-white">
                      {user.name?.[0]?.toUpperCase() || '?'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold truncate text-sm">{user.name || 'Unknown'}</h3>
                      <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full', statusColors[user.status])}>
                        {user.status}
                      </span>
                      <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full', roleColors[user.role])}>
                        {user.role}
                      </span>
                      {user.moderationFlag && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full text-destructive bg-destructive/10">
                          {user.moderationFlag}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">@{user.username} · {user.email}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {user.status === 'active' ? (
                      <Button
                        onClick={() => handleAction(user.id, 'suspend')}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-amber-500 hover:bg-amber-500/10"
                        title="Suspend"
                        disabled={actionLoading === user.id}
                      >
                        {actionLoading === user.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldX className="h-4 w-4" />}
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleAction(user.id, 'unban')}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-green-500 hover:bg-green-500/10"
                        title="Reactivate"
                        disabled={actionLoading === user.id}
                      >
                        {actionLoading === user.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                      </Button>
                    )}
                    <Button
                      onClick={() => handleAction(user.id, 'ban')}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                      title="Ban"
                      disabled={actionLoading === user.id}
                    >
                      <Ban className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => handleAction(user.id, 'role', user.role === 'admin' ? 'user' : 'admin')}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-primary hover:bg-primary/10"
                      title={user.role === 'admin' ? 'Demote to user' : 'Promote to admin'}
                      disabled={actionLoading === user.id}
                    >
                      <Crown className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => handleDelete(user.id)}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                      title="Delete (super admin only)"
                      disabled={actionLoading === user.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
