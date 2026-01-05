'use client';

import { Card } from '../lib/setLogic';

interface SetCardProps {
  card: Card;
  isSelected: boolean;
  isInSet?: boolean;
  setLabels?: string[];
  onClick: () => void;
}

export default function SetCard({ card, isSelected, isInSet = false, setLabels = [], onClick }: SetCardProps) {
  const getColorClasses = () => {
    switch (card.color) {
      case 'red': return { fill: 'fill-set-red', stroke: 'stroke-set-red' };
      case 'green': return { fill: 'fill-set-green', stroke: 'stroke-set-green' };
      case 'purple': return { fill: 'fill-set-purple', stroke: 'stroke-set-purple' };
    }
  };

  const renderShape = (shapeIndex: number) => {
    const colorClasses = getColorClasses();
    const shading = card.shading;
    
    let fillClass = '';
    let fillAttr = 'none';
    let strokeWidth = 2;

    if (shading === 'solid') {
      fillClass = colorClasses.fill;
    } else if (shading === 'striped') {
      fillAttr = `url(#stripe-${card.color})`;
    } else {
      fillAttr = 'none';
    }

    // Calculate horizontal centering based on number of shapes (121.5% scale = 135% * 0.9)
    const shapeWidth = 24.3; // 27 * 0.9
    const spacing = 9.72; // 10.8 * 0.9
    const totalWidth = card.number * shapeWidth + (card.number - 1) * spacing;
    const startX = (100 - totalWidth) / 2;
    const baseX = startX + shapeIndex * (shapeWidth + spacing) + shapeWidth / 2;

    switch (card.shape) {
      case 'diamond':
        return (
          <polygon
            key={shapeIndex}
            points={`${baseX},25.7 ${baseX + 12.15},50 ${baseX},74.3 ${baseX - 12.15},50`}
            fill={fillAttr}
            className={`${fillClass} ${colorClasses.stroke}`}
            strokeWidth={strokeWidth}
          />
        );
      case 'oval':
        return (
          <ellipse
            key={shapeIndex}
            cx={baseX}
            cy="50"
            rx="12.15"
            ry="24.3"
            fill={fillAttr}
            className={`${fillClass} ${colorClasses.stroke}`}
            strokeWidth={strokeWidth}
          />
        );
      case 'squiggle':
        // Centered squiggle path - horizontal orientation (121.5% scale, adjusted center)
        return (
          <path
            key={shapeIndex}
            d={`M ${baseX + 6} 40 
                c 0 -8.748 6.01425 -10.935 5.79555 -15.4305 
                c -0.27945 -4.9815 -11.5425 -6.6825 -18.225 -2.0655 
                c -7.047 4.86 -8.6265 11.5425 -5.103 20.7765 
                c 2.0655 4.131 2.673 7.6545 2.673 10.935 
                c 0 8.748 -6.01425 10.935 -5.79555 15.4305 
                c 0.27945 4.9815 11.5425 6.6825 18.225 2.0655 
                c 7.047 -4.86 8.6265 -11.5425 5.103 -20.7765 
                c -2.0655 -4.131 -2.673 -7.6545 -2.673 -10.935 z`}
            fill={fillAttr}
            className={`${fillClass} ${colorClasses.stroke}`}
            strokeWidth={strokeWidth}
          />
        );
    }
  };

  return (
    <div
      onClick={onClick}
      className={`
        bg-card rounded-lg shadow-md cursor-pointer transition-all duration-200
        hover:shadow-xl hover:scale-105
        ${isSelected ? 'ring-4 ring-primary scale-105' : ''}
        ${isInSet && !isSelected ? 'ring-4 ring-accent' : ''}
        p-2 md:p-4 flex items-center justify-center w-full h-full relative
      `}
    >
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
        <defs>
          <pattern id="stripe-red" patternUnits="userSpaceOnUse" width="4" height="4">
            <rect width="4" height="4" fill="transparent" />
            <rect width="2" height="4" className="fill-set-red" />
          </pattern>
          <pattern id="stripe-green" patternUnits="userSpaceOnUse" width="4" height="4">
            <rect width="4" height="4" fill="transparent" />
            <rect width="2" height="4" className="fill-set-green" />
          </pattern>
          <pattern id="stripe-purple" patternUnits="userSpaceOnUse" width="4" height="4">
            <rect width="4" height="4" fill="transparent" />
            <rect width="2" height="4" className="fill-set-purple" />
          </pattern>
        </defs>
        {Array.from({ length: card.number }).map((_, i) => renderShape(i))}
      </svg>
      
      {setLabels.length > 0 && (
        <div className="right-1 bottom-1 absolute flex gap-0.5">
          {setLabels.map((label, idx) => (
            <div
              key={idx}
              className="flex justify-center items-center bg-accent shadow-md rounded-full w-5 h-5 font-bold text-xs text-accent-foreground"
            >
              {label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
