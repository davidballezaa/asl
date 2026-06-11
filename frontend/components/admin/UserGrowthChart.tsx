import { useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polyline, Text as SvgText } from 'react-native-svg';

import { colors } from '@/constants/colors';

export type UserGrowthPoint = {
  date: string;
  totalUsers: number;
  proUsers: number;
};

type UserGrowthChartProps = {
  data: UserGrowthPoint[];
};

const CHART_HEIGHT = 200;
const PADDING = { top: 16, right: 12, bottom: 32, left: 40 };

function buildPolyline(
  values: number[],
  maxValue: number,
  chartWidth: number,
  chartHeight: number,
): string {
  if (values.length === 0) return '';

  const xStep = values.length > 1 ? chartWidth / (values.length - 1) : 0;

  return values
    .map((value, index) => {
      const x = PADDING.left + index * xStep;
      const y =
        PADDING.top +
        chartHeight -
        (maxValue > 0 ? (value / maxValue) * chartHeight : 0);
      return `${x},${y}`;
    })
    .join(' ');
}

function formatAxisDate(dateKey: string): string {
  const date = new Date(`${dateKey}T12:00:00`);
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(
    date,
  );
}

export function UserGrowthChart({ data }: UserGrowthChartProps) {
  const [width, setWidth] = useState(320);

  const onLayout = (event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  };

  const chartWidth = Math.max(width - PADDING.left - PADDING.right, 1);
  const chartHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;

  const { maxValue, yTicks, xLabels, totalLine, proLine } = useMemo(() => {
    const peak = Math.max(
      ...data.map((point) => Math.max(point.totalUsers, point.proUsers)),
      1,
    );
    const roundedMax = Math.max(Math.ceil(peak / 5) * 5, 5);
    const ticks = [0, Math.round(roundedMax / 2), roundedMax];

    const labelCount = 5;
    const labelIndexes =
      data.length <= labelCount
        ? data.map((_, index) => index)
        : Array.from({ length: labelCount }, (_, index) =>
            Math.round((index / (labelCount - 1)) * (data.length - 1)),
          );

    return {
      maxValue: roundedMax,
      yTicks: ticks,
      xLabels: labelIndexes.map((index) => ({
        index,
        label: formatAxisDate(data[index]?.date ?? ''),
      })),
      totalLine: buildPolyline(
        data.map((point) => point.totalUsers),
        roundedMax,
        chartWidth,
        chartHeight,
      ),
      proLine: buildPolyline(
        data.map((point) => point.proUsers),
        roundedMax,
        chartWidth,
        chartHeight,
      ),
    };
  }, [chartHeight, chartWidth, data]);

  if (data.length === 0) {
    return <Text style={styles.empty}>No signup data yet.</Text>;
  }

  const lastPoint = data[data.length - 1];

  return (
    <View onLayout={onLayout} style={styles.container}>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
          <Text style={styles.legendText}>
            Total users ({lastPoint.totalUsers})
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.purple }]} />
          <Text style={styles.legendText}>Pro users ({lastPoint.proUsers})</Text>
        </View>
      </View>

      <Svg width={width} height={CHART_HEIGHT}>
        {yTicks.map((tick) => {
          const y =
            PADDING.top +
            chartHeight -
            (maxValue > 0 ? (tick / maxValue) * chartHeight : 0);
          return (
            <Line
              key={tick}
              x1={PADDING.left}
              y1={y}
              x2={width - PADDING.right}
              y2={y}
              stroke={colors.border}
              strokeOpacity={0.12}
              strokeWidth={1}
            />
          );
        })}

        {yTicks.map((tick) => {
          const y =
            PADDING.top +
            chartHeight -
            (maxValue > 0 ? (tick / maxValue) * chartHeight : 0);
          return (
            <SvgText
              key={`label-${tick}`}
              x={PADDING.left - 8}
              y={y + 4}
              fontSize={11}
              fill={colors.muted}
              textAnchor="end"
            >
              {tick}
            </SvgText>
          );
        })}

        {totalLine ? (
          <Polyline
            points={totalLine}
            fill="none"
            stroke={colors.primary}
            strokeWidth={3}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ) : null}

        {proLine ? (
          <Polyline
            points={proLine}
            fill="none"
            stroke={colors.purple}
            strokeWidth={3}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ) : null}

        {data.length > 0 && (
          <>
            <Circle
              cx={
                PADDING.left +
                (data.length > 1 ? chartWidth : 0)
              }
              cy={
                PADDING.top +
                chartHeight -
                (maxValue > 0
                  ? (lastPoint.totalUsers / maxValue) * chartHeight
                  : 0)
              }
              r={4}
              fill={colors.primary}
            />
            <Circle
              cx={
                PADDING.left +
                (data.length > 1 ? chartWidth : 0)
              }
              cy={
                PADDING.top +
                chartHeight -
                (maxValue > 0
                  ? (lastPoint.proUsers / maxValue) * chartHeight
                  : 0)
              }
              r={4}
              fill={colors.purple}
            />
          </>
        )}

        {xLabels.map(({ index, label }) => {
          const x =
            PADDING.left +
            (data.length > 1 ? (index / (data.length - 1)) * chartWidth : 0);
          return (
            <SvgText
              key={`${index}-${label}`}
              x={x}
              y={CHART_HEIGHT - 8}
              fontSize={11}
              fill={colors.muted}
              textAnchor="middle"
            >
              {label}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
    width: '100%',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  legendItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  legendDot: {
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  legendText: {
    color: colors.muted,
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 13,
  },
  empty: {
    color: colors.muted,
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 14,
  },
});
