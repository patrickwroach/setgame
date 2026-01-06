'use client';

interface LeaderboardEntryProps {
  rank: number;
  displayName: string;
  value: string | number;
  subtitle?: string;
  isCurrentUser?: boolean;
  isWinner?: boolean;
}

export default function LeaderboardEntry({
  rank,
  displayName,
  value,
  subtitle,
  isCurrentUser = false,
  isWinner = false
}: LeaderboardEntryProps) {
  const getRankBadgeClasses = () => {
    if (rank === 1) return 'bg-yellow-400 text-yellow-900';
    if (rank === 2) return 'bg-muted text-muted-foreground';
    if (rank === 3) return 'bg-orange-300 text-orange-900';
    return 'bg-muted/50 text-muted-foreground';
  };

  const getContainerClasses = () => {
    if (isWinner) return 'bg-linear-to-r from-gradient-start to-gradient-end text-white';
    if (isCurrentUser) return 'bg-primary/10 border-2 border-primary';
    return 'bg-secondary';
  };

  const getTextClasses = () => {
    if (isWinner) return 'text-white';
    return 'text-foreground';
  };

  const getValueClasses = () => {
    if (isWinner) return 'text-yellow-200';
    return 'text-success';
  };

  return (
    <div className={`flex justify-between items-center p-4 rounded-lg ${getContainerClasses()}`}>
      <div className="flex items-center gap-4">
        <div className={`flex justify-center items-center rounded-full w-10 h-10 font-bold text-lg ${getRankBadgeClasses()}`}>
          {rank}
        </div>
        <div className="max-w-[300px]">
          <div className={`font-semibold truncate ${getTextClasses()}`}>
            {displayName}
          </div>
          {subtitle && (
            <div className={`text-sm ${isWinner ? 'text-white/80' : 'text-muted-foreground'}`}>
              {subtitle}
            </div>
          )}
        </div>
      </div>
      <div className={`font-bold text-xl ${rank === 1 ? 'font-mono' : ''} ${getValueClasses()}`}>
        {value}
        {subtitle && (
          <div className={`text-xs font-normal ${isWinner ? 'text-white/80' : 'text-muted-foreground'}`}>
            {typeof value === 'number' && value !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
}
