'use client';

export function AuroraBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Aurora blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-primary/25 blur-[130px] animate-pulse-glow" />
        <div
          className="absolute top-1/3 -left-40 h-[450px] w-[450px] rounded-full bg-accent/20 blur-[130px] animate-pulse-glow"
          style={{ animationDelay: '1.5s' }}
        />
        <div
          className="absolute -bottom-40 right-1/4 h-[400px] w-[400px] rounded-full bg-primary/15 blur-[110px] animate-pulse-glow"
          style={{ animationDelay: '0.8s' }}
        />
      </div>

      {/* Floating hearts */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {[
          { left: '8%', top: '12%', delay: '0s', size: 'w-8 h-8', duration: '7s' },
          { left: '82%', top: '18%', delay: '2s', size: 'w-6 h-6', duration: '9s' },
          { left: '68%', top: '68%', delay: '1s', size: 'w-10 h-10', duration: '8s' },
          { left: '18%', top: '72%', delay: '3s', size: 'w-5 h-5', duration: '10s' },
          { left: '48%', top: '8%', delay: '2.5s', size: 'w-7 h-7', duration: '11s' },
          { left: '92%', top: '55%', delay: '4s', size: 'w-6 h-6', duration: '12s' },
        ].map((item, i) => (
          <div
            key={i}
            className={`absolute ${item.size} opacity-[0.05] animate-float`}
            style={{
              left: item.left,
              top: item.top,
              animationDelay: item.delay,
              animationDuration: item.duration,
            }}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-full w-full text-primary">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
