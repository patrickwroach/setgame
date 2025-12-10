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

    // Calculate vertical centering based on number of shapes
    const shapeHeight = 20;
    const spacing = 8;
    const totalHeight = card.number * shapeHeight + (card.number - 1) * spacing;
    const startY = (100 - totalHeight) / 2;
    const baseY = startY + shapeIndex * (shapeHeight + spacing) + shapeHeight / 2;

    switch (card.shape) {
      case 'diamond':
        return (
          <polygon
            key={shapeIndex}
            points={`50,${baseY} 70,${baseY + 10} 50,${baseY + 20} 30,${baseY + 10}`}
            fill={fillColor}
            stroke={color}
            strokeWidth={strokeWidth}
          />
        );
      case 'oval':
        return (
          <ellipse
            key={shapeIndex}
            cx="50"
            cy={baseY + 10}
            rx="20"
            ry="10"
            fill={fillColor}
            stroke={color}
            strokeWidth={strokeWidth}
          />
        );
      case 'squiggle':
        // Centered squiggle path - horizontal orientation
        return (
          <path
            key={shapeIndex}
            d={`M 30 ${baseY + 10} 
                c -7.2 0 -9 -4.95 -12.7 -4.77 
                c -4.1 0.23 -5.5 9.5 -1.7 15 
                c 4 5.8 9.5 7.1 17.1 4.2 
                c 3.4 -1.7 6.3 -2.2 9 -2.2 
                c 7.2 0 9 4.95 12.7 4.77 
                c 4.1 -0.23 5.5 -9.5 1.7 -15 
                c -4 -5.8 -9.5 -7.1 -17.1 -4.2 
                c -3.4 1.7 -6.3 2.2 -9 2.2 z`}
            fill={fillColor}
            stroke={color}
            strokeWidth={strokeWidth}
            transform={`translate(20, 0)`}
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
        p-2 md:p-4 aspect-[2/3] flex items-center justify-center w-full max-h-full relative
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
