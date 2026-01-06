'use client';

interface MessageBannerProps {
  message: string;
  type?: 'success' | 'gradient' | 'warning' | 'info';
}

export default function MessageBanner({ message, type = 'info' }: MessageBannerProps) {
  const getTypeClass = () => {
    switch (type) {
      case 'success': return 'message-success';
      case 'gradient': return 'message-gradient';
      case 'warning': return 'message-warning';
      case 'info': return 'message-info';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className={`message-banner ${getTypeClass()}`}>
      {message}
    </div>
  );
}
