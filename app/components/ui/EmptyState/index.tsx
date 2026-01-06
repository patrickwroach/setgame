'use client';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
}

export default function EmptyState({ title, description, icon }: EmptyStateProps) {
  const defaultIcon = (
    <svg className="mx-auto mb-4 w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  return (
    <div className="flex flex-col justify-center items-center py-12 text-center">
      <div className="mb-4 p-8 gradient-box">
        {icon || defaultIcon}
        <h3 className="mb-2 font-semibold text-white text-xl">{title}</h3>
        <p className="text-white/80">{description}</p>
      </div>
    </div>
  );
}
