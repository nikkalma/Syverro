import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import Svg, { Circle, G, Text as SvgText } from 'react-native-svg';
import { spacing } from '../../theme/spacing';
import { getTypography } from '../../theme/typography';

const { width } = Dimensions.get('window');

interface Props {
  theme: any;
  totalBooks: number;
  finishedBooks: number;
  completionPercentage: number;
  locale: string;
}

export default function ReadingProgress({ theme, totalBooks, finishedBooks, completionPercentage, locale }: Props) {
  const typography = getTypography(locale);
  const ringSize = Math.min(width - 120, 140);
  const strokeWidth = 4;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (completionPercentage / 100) * circumference;

  return (
    <View style={{ marginBottom: spacing.xl, alignItems: 'center' }}>
      <View style={{ position: 'relative', alignItems: 'center' }}>
        <Svg width={ringSize} height={ringSize}>
          <G rotation="-90" origin={`${ringSize / 2}, ${ringSize / 2}`}>
            <Circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={radius}
              stroke={theme.border}
              strokeWidth={strokeWidth}
              fill="none"
            />
            <Circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={radius}
              stroke={theme.primary}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="none"
            />
          </G>
          <SvgText
            x={ringSize / 2}
            y={ringSize / 2 + 5}
            textAnchor="middle"
            fontSize={18}
            fontWeight="300"
            fill={theme.textPrimary}
          >
            {Math.round(completionPercentage)}%
          </SvgText>
        </Svg>
      </View>
      
      <View style={{ flexDirection: 'row', gap: spacing.xl, marginTop: spacing.md }}>
        <View>
          <Text style={[typography.h3, { color: theme.textPrimary, textAlign: 'center' }]}>
            {totalBooks}
          </Text>
          <Text style={[typography.caption, { color: theme.textMuted }]}>
            {locale === 'ru' ? 'всего' : 'total'}
          </Text>
        </View>
        <View>
          <Text style={[typography.h3, { color: theme.primary, textAlign: 'center' }]}>
            {finishedBooks}
          </Text>
          <Text style={[typography.caption, { color: theme.textMuted }]}>
            {locale === 'ru' ? 'прочитано' : 'read'}
          </Text>
        </View>
      </View>
    </View>
  );
}