'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuroraBackground } from '@/components/aurora-background';
import { Button } from '@/components/ui/button';
import { Heart, Sparkles, Shield, Zap, ArrowRight, Star, MessageCircle } from 'lucide-react';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (data.user?.username && data.user.termsAccepted) {
          router.push('/discover');
        }
      });
  }, [router]);

  return (
    <AuroraBackground>
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10 text-center">
        <div className="max-w-2xl mx-auto">
          {/* Logo */}
          <div className="mb-6 inline-flex items-center justify-center gap-3 animate-fade-in-up">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-romance shadow-xl shadow-primary/40 animate-float">
              <Heart className="h-7 w-7 text-white fill-white" />
            </div>
            <span className="text-4xl font-bold tracking-tight">Amori</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-5 animate-fade-in-up text-balance" style={{ animationDelay: '0.1s' }}>
            Find{' '}
            <span className="text-gradient animate-gradient-x">Love</span>
            , Build Connections
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-lg mx-auto animate-fade-in-up text-balance" style={{ animationDelay: '0.2s' }}>
            Meet like-minded people and create meaningful relationships.
            Your journey starts right here.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <Button
              onClick={() => router.push('/auth')}
              size="lg"
              className="bg-gradient-romance text-white shadow-xl shadow-primary/30 hover:shadow-primary/50 hover:scale-105 transition-all duration-300 h-14 px-8 text-base font-semibold"
            >
              <Heart className="h-5 w-5 mr-2 fill-white" />
              Get Started
            </Button>
            <Button
              onClick={() => router.push('/auth')}
              size="lg"
              variant="outline"
              className="h-14 px-8 text-base font-semibold hover:bg-secondary/50 transition-all duration-300"
            >
              Log In
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-16 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            {[
              { icon: Sparkles, title: 'Smart Matching', desc: 'Based on interests & personality' },
              { icon: Shield, title: 'Safe & Private', desc: 'Your privacy is our priority' },
              { icon: Zap, title: 'Fast & Easy', desc: 'Get started in minutes' },
            ].map((feature, i) => (
              <div
                key={i}
                className="glass rounded-2xl border border-border/50 p-5 text-left hover:scale-105 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 mb-3">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-1">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 mt-14 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
            {[
              { icon: Star, value: '4.9', label: 'Rating' },
              { icon: Heart, value: '2M+', label: 'Matches' },
              { icon: MessageCircle, value: '500K', label: 'Daily Chats' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <stat.icon className="h-4 w-4 text-primary" />
                  <span className="text-2xl font-bold">{stat.value}</span>
                </div>
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AuroraBackground>
  );
}
