
import React from 'react';

interface DataPoint {
  label: string;
  value: number;
}

interface Props {
  data: DataPoint[];
  width?: number;
  height?: number;
  color?: string;
  strokeWidth?: number;
}

const LineChart: React.FC<Props> = ({ data, width = 400, height = 200, color = '#06b6d4', strokeWidth = 2 }) => {
  if (data.length < 2) {
    return (
      <div style={{ width, height }} className="flex items-center justify-center text-slate-500 bg-slate-900/50 rounded-lg">
        Adicione pelo menos 2 registros de peso para ver o gráfico.
      </div>
    );
  }

  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const values = data.map(d => d.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const valueRange = maxVal - minVal === 0 ? 1 : maxVal - minVal;

  const getX = (index: number) => (index / (data.length - 1)) * chartWidth + padding;
  const getY = (value: number) => chartHeight - ((value - minVal) / valueRange) * chartHeight + padding;

  const pathD = data.map((point, index) => {
    const x = getX(index);
    const y = getY(point.value);
    return `${index === 0 ? 'M' : 'L'} ${x},${y}`;
  }).join(' ');

  const yAxisLabels = [maxVal, minVal + (valueRange * 0.75), minVal + (valueRange * 0.5), minVal + (valueRange * 0.25), minVal];
  const xAxisLabels = data.length > 5 ? [data[0], data[Math.floor(data.length/2)], data[data.length-1]] : data;


  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
      {/* Y-axis grid lines and labels */}
      {yAxisLabels.map((label, i) => {
        if (valueRange === 0 && i > 0) return null; // Avoid duplicate labels if range is 0
        const y = getY(label);
        return (
          <g key={i}>
            <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#334155" strokeWidth="1" />
            <text x={padding - 10} y={y + 4} fill="#94a3b8" fontSize="10" textAnchor="end">
              {label.toFixed(1)}
            </text>
          </g>
        )
      })}

      {/* X-axis labels */}
      {xAxisLabels.map((point, i) => {
          let index = data.findIndex(d => d.label === point.label);
          if (index === -1) return null;
          const x = getX(index);
          const date = new Date(point.label);
          // Use UTC to avoid timezone shifts affecting the displayed date
          const formattedDate = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' });

          return (
               <text key={i} x={x} y={height - padding + 15} fill="#94a3b8" fontSize="10" textAnchor="middle">
                 {formattedDate}
               </text>
          )
      })}
      
      {/* Gradient */}
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.4 }} />
            <stop offset="100%" style={{ stopColor: color, stopOpacity: 0.05 }} />
        </linearGradient>
      </defs>
      <path d={`${pathD} L ${getX(data.length-1)},${height-padding} L ${padding},${height-padding} Z`} fill="url(#gradient)" />

      {/* Line */}
      <path d={pathD} fill="none" stroke={color} strokeWidth={strokeWidth} />
      
      {/* Points */}
      {data.map((point, index) => (
        <circle key={index} cx={getX(index)} cy={getY(point.value)} r={strokeWidth+1} fill={color} />
      ))}
    </svg>
  );
};

export default LineChart;