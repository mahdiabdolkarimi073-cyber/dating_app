'use client';

export function AuroraBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background bg-warm-mesh">
      {/* Aurora blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-primary/20 blur-[130px] animate-pulse-glow" />
        <div
          className="absolute top-1/3 -left-40 h-[450px] w-[450px] rounded-full bg-accent/15 blur-[130px] animate-pulse-glow"
          style={{ animationDelay: '1.5s' }}
        />
        <div
          className="absolute -bottom-40 right-1/4 h-[400px] w-[400px] rounded-full bg-primary/10 blur-[110px] animate-pulse-glow"
          style={{ animationDelay: '0.8s' }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
