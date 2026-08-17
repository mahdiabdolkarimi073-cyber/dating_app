'use client';

import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

const STEPS = [
  { label: 'Profile', path: '/onboarding' },
  { label: 'Interests', path: '/onboarding/interests' },
  { label: 'Photos', path: '/onboarding/photos' },
  { label: 'Terms', path: '/onboarding/terms' },
];

export function OnboardingStepper({ currentStep }: { currentStep: number }) {
  return (
    <div className="w-full max-w-lg mb-6 animate-fade-in">
      <div className="flex items-center justify-between gap-1 sm:gap-2">
        {STEPS.map((step, i) => (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-all duration-300',
                  i < currentStep && 'bg-primary text-primary-foreground shadow-lg shadow-primary/30',
                  i === currentStep && 'bg-gradient-romance text-white shadow-lg shadow-primary/30 ring-4 ring-primary/15 scale-110',
                  i > currentStep && 'bg-secondary text-muted-foreground'
                )}
              >
                {i < currentStep ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span
                className={cn(
                  'text-[10px] sm:text-xs font-medium transition-colors',
                  i === currentStep ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  'h-0.5 flex-1 mx-1 sm:mx-2 rounded-full transition-all duration-500',
                  i < currentStep ? 'bg-primary' : 'bg-border'
                )}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
