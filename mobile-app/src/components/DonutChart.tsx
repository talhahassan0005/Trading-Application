import React from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

interface Props {
  slices: DonutSlice[];
  size?: number;
  thickness?: number;
}

/** Simple donut chart built from stroked circle arcs (no chart library). */
export function DonutChart({ slices, size = 160, thickness = 26 }: Props) {
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  const r = (size - thickness) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;

  let offset = 0;
  const arcs = slices.map((s) => {
    const frac = total > 0 ? s.value / total : 0;
    const len = frac * circumference;
    const dashoffset = -offset;
    offset += len;
    return { ...s, len, dashoffset };
  });

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {/* rotate -90deg so the first slice starts at 12 o'clock */}
        <Circle cx={cx} cy={cy} r={r} stroke="#00000000" strokeWidth={thickness} fill="none" />
        {arcs.map((a, i) => (
          <Circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            stroke={a.color}
            strokeWidth={thickness}
            fill="none"
            strokeDasharray={`${a.len} ${circumference - a.len}`}
            strokeDashoffset={a.dashoffset}
            strokeLinecap="butt"
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        ))}
      </Svg>
    </View>
  );
}
