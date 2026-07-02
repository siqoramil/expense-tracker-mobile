import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

export const Sparkline: React.FC<{
  data: number[];
  color: string;
  width?: number;
  height?: number;
}> = ({ data, color, width = 320, height = 50 }) => {
  const max = Math.max(...data, 1);
  const n = data.length;
  const step = width / Math.max(n - 1, 1);
  const pts = data.map((v, i) => [i * step, height - (v / max) * height + 4] as const);
  const path = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p[0] + ',' + p[1]).join(' ');
  const area = path + ` L${width},${height} L0,${height} Z`;
  const last = pts[pts.length - 1];
  return (
    <Svg viewBox={`0 0 ${width} ${height + 6}`} width="100%" height={height + 6}>
      <Path d={area} fill={color} opacity={0.12} />
      <Path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {last ? <Circle cx={last[0]} cy={last[1]} r={3.5} fill={color} /> : null}
    </Svg>
  );
};
