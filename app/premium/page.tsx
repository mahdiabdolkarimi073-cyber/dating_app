'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AuroraBackground } from '@/components/aurora-background';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Loader2,
  LogOut,
  Crown,
  Zap,
  Eye,
  Heart,
  Sparkles,
  Infinity as InfinityIcon,
  Check,
  Star,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AppHeader } from '@/components/app-header';

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    color: 'from-gray-400 to-gray-500',
    features: [
      '10 swipes per day',
      'Basic matching',
      'Standard chat',
      '1 story per day',
    ],
    cta: 'Current Plan',
    disabled: true,
  },
  {
    id: 'plus',
    name: 'Amori Plus',
    price: '$9.99',
    period: 'per month',
    color: 'from-rose-500 to-pink-600',
    features: [
      'Unlimited swipes',
      'See who liked you',
      '5 super likes per day',
      'Advanced filters',
      'Read receipts',
      'Unlimited stories',
    ],
    cta: 'Upgrade to Plus',
    popular: true,
  },
  {
    id: 'premium',
    name: 'Amori Premium',
    price: '$19.99',
    period: 'per month',
    color: 'from-amber-400 to-orange-500',
    features: [
      'Everything in Plus',
      'See who viewed your profile',
      'Priority in discovery',
      'Unlimited super likes',
      'Boost profile weekly',
      'Advanced analytics',
      'Exclusive badge',
    ],
    cta: 'Go Premium',
  },
];

export default function PremiumPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

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
      });
  }, [router]);

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
    setTimeout(() => {
      toast.success('This is a demo — payment integration coming soon!', {
        description: 'Your plan selection has been noted.',
      });
      setSelectedPlan(null);
    }, 1500);
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/auth');
  };

  if (!authChecked) {
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
        {/* Header */}
        <div className="max-w-5xl mx-auto w-full">
          <AppHeader title="Premium" showBack backHref="/discover" onLogout={handleLogout} />
        </div>

        {/* Content */}
        <div className="max-w-5xl mx-auto w-full flex-1">
          {/* Hero */}
          <div className="text-center mb-8 animate-fade-in-up">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-xl shadow-amber-500/30 mb-4 animate-pulse-glow">
              <Crown className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2">
              Unlock <span className="text-gradient">Amori Premium</span>
            </h1>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Get the most out of Amori with powerful features designed to help you find your perfect match faster.
            </p>
          </div>

          {/* Stats banner */}
          <div className="grid grid-cols-3 gap-3 mb-8 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <div className="rounded-2xl border border-border/50 glass p-4 text-center">
              <Zap className="h-5 w-5 text-primary mx-auto mb-1.5" />
              <p className="text-lg font-bold">10x</p>
              <p className="text-xs text-muted-foreground">More matches</p>
            </div>
            <div className="rounded-2xl border border-border/50 glass p-4 text-center">
              <Eye className="h-5 w-5 text-primary mx-auto mb-1.5" />
              <p className="text-lg font-bold">Unlimited</p>
              <p className="text-xs text-muted-foreground">Profile views</p>
            </div>
            <div className="rounded-2xl border border-border/50 glass p-4 text-center">
              <TrendingUp className="h-5 w-5 text-primary mx-auto mb-1.5" />
              <p className="text-lg font-bold">Priority</p>
              <p className="text-xs text-muted-foreground">In discovery</p>
            </div>
          </div>

          {/* Plans */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((plan, i) => (
              <div
                key={plan.id}
                className={cn(
                  'relative rounded-3xl border p-6 animate-fade-in-up transition-all duration-300',
                  plan.popular
                    ? 'border-primary/50 shadow-xl shadow-primary/10 bg-card'
                    : 'border-border/50 bg-card',
                  !plan.disabled && 'hover:border-primary/30 hover:shadow-lg cursor-pointer'
                )}
                style={{ animationDelay: `${200 + i * 100}ms` }}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <div className="flex items-center gap-1 rounded-full bg-gradient-warm px-4 py-1 shadow-lg">
                      <Star className="h-3 w-3 text-white fill-white" />
                      <span className="text-xs font-bold text-white">Most Popular</span>
                    </div>
                  </div>
                )}

                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br', plan.color)}>
                        {plan.id === 'free' ? (
                          <Heart className="h-4 w-4 text-white" />
                        ) : plan.id === 'plus' ? (
                          <Sparkles className="h-4 w-4 text-white" />
                        ) : (
                          <Crown className="h-4 w-4 text-white" />
                        )}
                      </div>
                      <h3 className="text-lg font-bold">{plan.name}</h3>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold">{plan.price}</span>
                      <span className="text-sm text-muted-foreground">/{plan.period}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5 mb-5">
                  {plan.features.map((feature, fi) => (
                    <div key={fi} className="flex items-center gap-2.5">
                      <div className={cn(
                        'flex h-5 w-5 items-center justify-center rounded-full flex-shrink-0',
                        plan.id === 'free' ? 'bg-muted' : 'bg-primary/10'
                      )}>
                        <Check className={cn(
                          'h-3 w-3',
                          plan.id === 'free' ? 'text-muted-foreground' : 'text-primary'
                        )} />
                      </div>
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={() => !plan.disabled && handleSelectPlan(plan.id)}
                  disabled={plan.disabled || selectedPlan === plan.id}
                  className={cn(
                    'w-full rounded-xl transition-all',
                    plan.disabled
                      ? 'bg-secondary text-muted-foreground'
                      : plan.popular
                      ? 'bg-gradient-warm text-white shadow-lg shadow-primary/30 hover:scale-[1.02]'
                      : 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/30 hover:scale-[1.02]'
                  )}
                >
                  {selectedPlan === plan.id ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : plan.id === 'premium' ? (
                    <>
                      <Crown className="h-5 w-5" />
                      {plan.cta}
                    </>
                  ) : plan.id === 'plus' ? (
                    <>
                      <InfinityIcon className="h-5 w-5" />
                      {plan.cta}
                    </>
                  ) : (
                    plan.cta
                  )}
                </Button>
              </div>
            ))}
          </div>

          {/* FAQ */}
          <div className="mt-8 mb-4 animate-fade-in-up" style={{ animationDelay: '500ms' }}>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">Frequently Asked</h3>
            <div className="space-y-2">
              <div className="rounded-2xl border border-border/50 bg-card p-4">
                <p className="text-sm font-medium mb-1">Can I cancel anytime?</p>
                <p className="text-xs text-muted-foreground">Yes, you can cancel your subscription at any time. You'll keep premium features until the end of your billing period.</p>
              </div>
              <div className="rounded-2xl border border-border/50 bg-card p-4">
                <p className="text-sm font-medium mb-1">Is my payment secure?</p>
                <p className="text-xs text-muted-foreground">All payments are processed through secure, encrypted payment gateways. We never store your card details.</p>
              </div>
              <div className="rounded-2xl border border-border/50 bg-card p-4">
                <p className="text-sm font-medium mb-1">What payment methods do you accept?</p>
                <p className="text-xs text-muted-foreground">We accept all major credit cards, debit cards, and digital wallets including Apple Pay and Google Pay.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuroraBackground>
  );
}
