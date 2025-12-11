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
  const getColor = () => {
    switch (card.color) {
      case 'red': return '#EF4444';
      case 'green': return '#10B981';
      case 'purple': return '#8B5CF6';
    }
  };

  const renderShape = (shapeIndex: number) => {
    const color = getColor();
    const shading = card.shading;
    
    let fillColor = 'none';
    let strokeWidth = 2;
    let pattern = '';

    if (shading === 'solid') {
      fillColor = color;
    } else if (shading === 'striped') {
      pattern = `url(#stripe-${card.color})`;
      fillColor = pattern;
    } else {
      fillColor = 'none';
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
            fill={fillColor}
            stroke={color}
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
            fill={fillColor}
            stroke={color}
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
            fill={fillColor}
            stroke={color}
            strokeWidth={strokeWidth}
          />
        );
    }
  };

  return (
    <div
      onClick={onClick}
      className={`
        bg-white rounded-lg shadow-md cursor-pointer transition-all duration-200
        hover:shadow-xl hover:scale-105
        ${isSelected ? 'ring-4 ring-blue-500 scale-105' : ''}
        ${isInSet && !isSelected ? 'ring-4 ring-purple-400' : ''}
        p-2 md:p-4 flex items-center justify-center w-full h-full relative
      `}
    >
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
        <defs>
          <pattern id="stripe-red" patternUnits="userSpaceOnUse" width="4" height="4">
            <rect width="4" height="4" fill="white" />
            <rect width="2" height="4" fill="#EF4444" />
          </pattern>
          <pattern id="stripe-green" patternUnits="userSpaceOnUse" width="4" height="4">
            <rect width="4" height="4" fill="white" />
            <rect width="2" height="4" fill="#10B981" />
          </pattern>
          <pattern id="stripe-purple" patternUnits="userSpaceOnUse" width="4" height="4">
            <rect width="4" height="4" fill="white" />
            <rect width="2" height="4" fill="#8B5CF6" />
          </pattern>
        </defs>
        {Array.from({ length: card.number }).map((_, i) => renderShape(i))}
      </svg>
      
      {setLabels.length > 0 && (
        <div className="right-1 bottom-1 absolute flex gap-0.5">
          {setLabels.map((label, idx) => (
            <div
              key={idx}
              className="flex justify-center items-center bg-purple-600 shadow-md rounded-full w-5 h-5 font-bold text-white text-xs"
            >
              {label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
