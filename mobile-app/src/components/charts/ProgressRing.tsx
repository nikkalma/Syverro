// src/components/charts/ProgressRing.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { VictoryPie } from 'victory-native';

interface ProgressRingProps {
  finished: number;
  total: number;
  theme: any;
}

export default function ProgressRing({ finished, total, theme }: ProgressRingProps) {
  const percent = total > 0 ? Math.round((finished / total) * 100) : 0;
  const remaining = total - finished;
  
  const data = [
    { x: 'Прочитано', y: finished },
    { x: 'Осталось', y: remaining },
  ];
  
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
      <Text style={{ color: theme.textPrimary, fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>
        Прогресс чтения
      </Text>
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        <VictoryPie
          data={data}
          width={160}
          height={160}
          innerRadius={55}
          colorScale={[theme.primary, theme.surface]}
          style={{
            data: {
              stroke: theme.background,
              strokeWidth: 2,
            },
          }}
          labels={() => null}
        />
        <Text style={{ 
          position: 'absolute', 
          color: theme.textPrimary,
          fontSize: 22,
          fontWeight: 'bold',
        }}>
          {percent}%
        </Text>
      </View>
      <View style={{ flexDirection: 'row', marginTop: 10, gap: 15 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 12, height: 12, backgroundColor: theme.primary, borderRadius: 2, marginRight: 6 }} />
          <Text style={{ color: theme.textSecondary, fontSize: 10 }}>Прочитано: {finished}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 12, height: 12, backgroundColor: theme.surface, borderRadius: 2, marginRight: 6, borderWidth: 1, borderColor: theme.border }} />
          <Text style={{ color: theme.textSecondary, fontSize: 10 }}>Осталось: {remaining}</Text>
        </View>
      </View>
    </View>
  );
}