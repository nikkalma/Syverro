// src/components/charts/DonutChart.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { VictoryPie } from 'victory-native';

interface DonutChartProps {
  data: Array<{ x: string; y: number }>;
  title: string;
  theme: any;
}

export default function DonutChart({ data, title, theme }: DonutChartProps) {
  const total = data.reduce((sum, item) => sum + item.y, 0);
  
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
      <Text style={{ color: theme.textPrimary, fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>
        {title}
      </Text>
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        <VictoryPie
          data={data}
          width={200}
          height={200}
          innerRadius={65}
          colorScale={[theme.primary, theme.accent, theme.surface, '#ff6b6b', '#4ecdc4']}
          style={{
            labels: { 
              fill: theme.textPrimary, 
              fontSize: 10,
              fontWeight: 'bold',
            },
            data: {
              stroke: theme.background,
              strokeWidth: 2,
            },
          }}
          labelRadius={({ radius }) => (radius || 0) + 15}
          labels={({ datum }) => `${datum.x}: ${datum.y}`}
        />
        <Text style={{ 
          position: 'absolute', 
          color: theme.textPrimary,
          fontSize: 18,
          fontWeight: 'bold',
        }}>
          {total}
        </Text>
      </View>
    </View>
  );
}