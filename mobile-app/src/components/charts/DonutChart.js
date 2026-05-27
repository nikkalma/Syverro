import React from 'react';
import { View, Text } from 'react-native';
import { VictoryPie } from 'victory-native';

export default function DonutChart({ data, title, theme }) {
  // data = [{ x: 'Прочитано', y: 19 }, { x: 'Читаю', y: 5 }, { x: 'В планах', y: 117 }]
  
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
          labelRadius={({ radius }) => radius + 15}
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