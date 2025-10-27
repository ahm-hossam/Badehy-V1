'use client';

interface PieChartData {
  label: string;
  value: number;
  color: string;
}

interface PieChartProps {
  data: PieChartData[];
  size?: number;
}

export function PieChart({ data, size = 120 }: PieChartProps) {
  // Calculate percentages
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  if (total === 0) {
    return (
      <div style={{ width: size, height: size }} className="flex items-center justify-center">
        <p className="text-xs text-zinc-500">No data</p>
      </div>
    );
  }

  let currentAngle = 0;
  
  return (
    <div className="relative inline-block">
      <svg width={size} height={size} viewBox="0 0 100 100" className="transform -rotate-90">
        {data.map((item, index) => {
          const percentage = (item.value / total) * 100;
          const angle = (item.value / total) * 360;
          
          // Special case: full circle
          if (angle >= 360) {
            return (
              <circle
                key={index}
                cx="50"
                cy="50"
                r="50"
                fill={item.color}
                stroke="#fff"
                strokeWidth="2"
              />
            );
          }
          
          const largeArcFlag = angle > 180 ? 1 : 0;
          
          // Calculate arc path
          const x1 = 50 + 50 * Math.cos((currentAngle * Math.PI) / 180);
          const y1 = 50 + 50 * Math.sin((currentAngle * Math.PI) / 180);
          const x2 = 50 + 50 * Math.cos(((currentAngle + angle) * Math.PI) / 180);
          const y2 = 50 + 50 * Math.sin(((currentAngle + angle) * Math.PI) / 180);
          
          const pathData = [
            `M 50 50`,
            `L ${x1} ${y1}`,
            `A 50 50 0 ${largeArcFlag} 1 ${x2} ${y2}`,
            `Z`
          ].join(' ');
          
          currentAngle += angle;
          
          return (
            <path
              key={index}
              d={pathData}
              fill={item.color}
              stroke="#fff"
              strokeWidth="2"
            />
          );
        })}
        {/* Inner circle for donut effect */}
        <circle
          cx="50"
          cy="50"
          r="25"
          fill="white"
        />
      </svg>
      
      {/* Legend */}
      <div className="mt-3 flex flex-col gap-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <div className="flex items-center justify-between flex-1 text-xs">
              <span className="text-zinc-700">{item.label}</span>
              <span className="text-zinc-600 font-medium">
                {item.value} ({((item.value / total) * 100).toFixed(1)}%)
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

