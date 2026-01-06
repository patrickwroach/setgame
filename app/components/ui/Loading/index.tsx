'use client';

interface LoadingProps {
  fullScreen?: boolean;
}

export default function Loading({ fullScreen = false }: LoadingProps) {
  const containerClasses = fullScreen 
    ? 'fixed inset-0 flex justify-center items-center bg-background/80 backdrop-blur-sm z-50'
    : 'flex justify-center items-center min-h-[400px]';

  return (
    <div className={containerClasses}>
      <div className="gap-1.5 sm:gap-2 grid grid-cols-3 md:grid-cols-4 grid-rows-4 md:grid-rows-3 w-full max-w-[200px] md:max-w-[280px]">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="bg-card shadow-md border border-border rounded-lg aspect-square md:aspect-3/2"
            style={{
              animation: 'card-wave 1.5s ease-in-out infinite',
              animationDelay: `${i * 0.12}s`
            }}
          />
        ))}
      </div>
    </div>
  );
}
