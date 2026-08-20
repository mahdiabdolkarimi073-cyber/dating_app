'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AuroraBackground } from '@/components/aurora-background';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Mail, Lock, User, Eye, EyeOff, Sparkles, Loader2, ArrowRight } from 'lucide-react';

export default function AuthPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('register');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: regEmail, password: regPassword, name: regName }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Registration failed');
        return;
      }
      toast.success('Welcome to Amori! Let\'s set up your profile');
      router.push('/onboarding');
    } catch {
      toast.error('Connection error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Login failed');
        return;
      }
      toast.success('Welcome back!');
      if (data.user?.termsAccepted) {
        router.push('/discover');
      } else if (data.user?.username) {
        router.push('/onboarding/interests');
      } else {
        router.push('/onboarding');
      }
    } catch {
      toast.error('Connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuroraBackground>
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
        {/* Logo */}
        <div className="mb-8 text-center animate-fade-in-up">
          <div className="mb-3 inline-flex items-center justify-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-warm shadow-lg shadow-primary/25">
              <Heart className="h-6 w-6 text-white fill-white" />
            </div>
            <span className="text-3xl font-bold tracking-tight">Amori</span>
          </div>
          <p className="text-muted-foreground text-sm">
            Find love, build connections
          </p>
        </div>

        {/* Auth Card */}
        <Card className="w-full max-w-md glass border-border/50 shadow-2xl shadow-primary/10 animate-scale-in">
          <CardHeader className="space-y-1 text-center pb-4">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-2xl">Welcome to Amori</CardTitle>
            <CardDescription>
              Create an account or sign in to continue your journey
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'register')}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="register">Sign Up</TabsTrigger>
                <TabsTrigger value="login">Log In</TabsTrigger>
              </TabsList>

              {/* Register */}
              <TabsContent value="register" className="animate-fade-in">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reg-name">Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="reg-name"
                        type="text"
                        placeholder="Enter your name"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reg-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="reg-email"
                        type="email"
                        placeholder="example@email.com"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reg-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="reg-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="At least 6 characters"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="pl-10 pr-10"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-warm text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] transition-all duration-300 h-12 text-base font-semibold border-0"
                  >
                    {loading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <Heart className="h-4 w-4 mr-2 fill-white" />
                        Start Your Journey
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* Login */}
              <TabsContent value="login" className="animate-fade-in">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="example@email.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="pl-10 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-warm text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] transition-all duration-300 h-12 text-base font-semibold border-0"
                  >
                    {loading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Sign In
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground max-w-xs">
          By signing up for Amori, you agree to our Terms of Service.
          You must be at least 18 years old to use this service.
        </p>
      </div>
    </AuroraBackground>
  );
}
