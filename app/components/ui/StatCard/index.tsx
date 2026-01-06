'use client';

interface StatCardProps {
  label: string;
  value: string | number;
  valueColor?: string;
  className?: string;
}

export default function StatCard({ label, value, valueColor = 'text-primary', className = '' }: StatCardProps) {
  return (
    <div className={`stat-card ${className}`}>
      <div className="stat-label">{label}</div>
      <div className={`stat-value ${valueColor}`}>{value}</div>
    </div>
  );
}
