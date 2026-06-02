// src/screens/ProfileScreen/components/ReadingProgress.js
import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import Svg, { Circle, G, Text as SvgText } from 'react-native-svg';
import GlassCard from '../../components/GlassCard';
import { spacing, radii } from '../../theme/spacing';
import { getTypography } from '../../theme/typography';

const { width } = Dimensions.get('window');

export default function ReadingProgress({ theme, totalBooks, finishedBooks, completionPercentage, locale }) {
  const typography = getTypography(locale);
  const ringSize = Math.min(width - 120, 160);
  const strokeWidth = 10;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const innerStrokeDashoffset = circumference - (completionPercentage / 100) * circumference;

  return (
    <GlassCard style={{ marginBottom: spacing.lg, padding: spacing.lg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' }}>
        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
          <Svg width={ringSize} height={ringSize} viewBox={`0 0 ${ringSize} ${ringSize}`}>
            <G rotation="-90" origin={`${ringSize / 2}, ${ringSize / 2}`}>
              <Circle cx={ringSize / 2} cy={ringSize / 2} r={radius} stroke={theme.border} strokeWidth={strokeWidth} fill="none" />
              <Circle cx={ringSize / 2} cy={ringSize / 2} r={radius} stroke={theme.primary} strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={0} strokeLinecap="round" fill="none" opacity={0.3} />
              <Circle cx={ringSize / 2} cy={ringSize / 2} r={radius - strokeWidth} stroke={theme.border} strokeWidth={strokeWidth - 2} fill="none" />
              <Circle cx={ringSize / 2} cy={ringSize / 2} r={radius - strokeWidth} stroke={theme.primary} strokeWidth={strokeWidth - 2} strokeDasharray={circumference} strokeDashoffset={innerStrokeDashoffset} strokeLinecap="round" fill="none" />
            </G>
            <SvgText x={ringSize / 2} y={ringSize / 2 + 5} textAnchor="middle" fontSize={22} fontWeight="bold" fill={theme.primary}>
              {Math.round(completionPercentage)}%
            </SvgText>
          </Svg>
        </View>
        
        <View style={{ gap: spacing.md }}>
          <View style={{ alignItems: 'flex-start' }}>
            <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: theme.primary, opacity: 0.3, marginBottom: 4 }} />
            <Text style={[typography.caption, { color: theme.textMuted }]}>{locale === 'ru' ? 'Всего книг' : 'Total books'}</Text>
            <Text style={[typography.h3, { color: theme.textPrimary }]}>{totalBooks}</Text>
          </View>
          <View style={{ alignItems: 'flex-start' }}>
            <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: theme.primary, marginBottom: 4 }} />
            <Text style={[typography.caption, { color: theme.textMuted }]}>{locale === 'ru' ? 'Прочитано' : 'Read'}</Text>
            <Text style={[typography.h3, { color: theme.primary }]}>{finishedBooks}</Text>
          </View>
        </View>
      </View>
    </GlassCard>
  );
}