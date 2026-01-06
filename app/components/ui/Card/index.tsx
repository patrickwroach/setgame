'use client';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`card ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }: CardProps) {
  return (
    <div className={`card-header ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '' }: CardProps) {
  return (
    <h2 className={`card-title ${className}`}>
      {children}
    </h2>
  );
}

export function CardContent({ children, className = '' }: CardProps) {
  return (
    <div className={`card-content ${className}`}>
      {children}
    </div>
  );
}
