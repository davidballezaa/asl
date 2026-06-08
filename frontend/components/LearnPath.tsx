import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { ScreenContainer } from '@/components/ScreenContainer';
import { colors } from '@/constants/colors';
import { useAppData } from '@/context/AppDataContext';
import { useLang } from '@/context/LangContext';
import { getAllLessonIdsInOrder, getAllLessons } from '@/lib/mock-data';
import { isLessonCompleted, isLessonLocked } from '@/lib/user-progress';
// Fractions along the full track: left edge, center, right edge, center
const ZIGZAG = [0, 0.5, 1, 0.5] as const;

type NodeState = 'completed' | 'current' | 'locked';

function getNodeState(
  completed: boolean,
  isActive: boolean,
  locked: boolean,
): NodeState {
  if (completed) return 'completed';
  if (isActive) return 'current';
  if (locked) return 'locked';
  return 'current';
}

function usePathMetrics(pathWidth: number) {
  return useMemo(() => {
    if (pathWidth <= 0) {
      return null;
    }

    const compact = pathWidth < 400;
    const nodeSize = compact ? 64 : pathWidth < 520 ? 76 : 88;
    const labelWidth = compact ? 100 : 112;
    const columnWidth = labelWidth;
    const halfColumn = columnWidth / 2;

    const nodeTop = compact ? 12 : 16;
    const labelGap = compact ? 8 : 10;
    const connectorTop = compact ? 96 : 108;
    const connectorHeight = compact ? 48 : 56;
    const rowHeight = connectorTop + connectorHeight;
    const titleSize = compact ? 28 : 32;

    // Inset so columns at 0% / 100% stay inside the container
    const inset = halfColumn;
    const trackWidth = pathWidth - 2 * inset;
    const nodeX = (index: number) =>
      inset + ZIGZAG[index % 4] * trackWidth;

    return {
      nodeSize,
      rowHeight,
      titleSize,
      compact,
      labelWidth,
      columnWidth,
      halfColumn,
      labelGap,
      connectorTop,
      connectorHeight,
      nodeTop,
      nodeX,
    };
  }, [pathWidth]);
}

export function LearnPath() {
  const router = useRouter();
  const { i18n } = useLang();
  const { width: screenWidth } = useWindowDimensions();
  const [pathWidth, setPathWidth] = useState(0);
  const layoutWidth = pathWidth || screenWidth - 32;
  const metrics = usePathMetrics(layoutWidth);
  const { me, units } = useAppData();
  const allLessons = useMemo(() => getAllLessons(units), [units]);
  const allLessonIds = useMemo(() => getAllLessonIdsInOrder(units), [units]);
  const completedLessonIds = me?.progress.completedLessonIds ?? [];
  const activeLessonId = me?.gamification.activeLessonId ?? 'lesson-1';
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.06,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pulseAnim]);

  if (!metrics) {
    return null;
  }

  const {
    nodeSize,
    rowHeight,
    titleSize,
    compact,
    labelWidth,
    columnWidth,
    halfColumn,
    labelGap,
    connectorTop,
    connectorHeight,
    nodeTop,
    nodeX,
  } = metrics;
  const halfNode = nodeSize / 2;

  return (
    <ScreenContainer size="narrow" style={styles.section}>
      <View style={styles.header}>
        <Text style={[styles.title, { fontSize: titleSize }]}>
          {i18n.learn.title}
        </Text>
        <Text style={styles.subtitle}>{i18n.learn.subtitle}</Text>
      </View>

      <View
        style={styles.path}
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          if (w > 0 && w !== pathWidth) setPathWidth(w);
        }}
      >
        {allLessons.map((lesson, index) => {
          const completed = isLessonCompleted(lesson.id, completedLessonIds);
          const isActive = lesson.id === activeLessonId;
          const locked = isLessonLocked(
            lesson.id,
            completedLessonIds,
            allLessonIds,
          );
          const nodeState = getNodeState(completed, isActive, locked);

          return (
            <View key={lesson.id} style={[styles.row, { height: rowHeight }]}>
              {index < allLessons.length - 1 && (
                <Svg
                  width={layoutWidth}
                  height={connectorHeight}
                  style={[styles.connector, { top: connectorTop }]}
                  pointerEvents="none"
                >
                  <Path
                    d={`M ${nodeX(index)} 0 Q ${(nodeX(index) + nodeX(index + 1)) / 2} ${connectorHeight / 2}, ${nodeX(index + 1)} ${connectorHeight}`}
                    stroke={colors.border}
                    strokeWidth={compact ? 3 : 4}
                    strokeDasharray="8 10"
                    fill="none"
                  />
                </Svg>
              )}

              <View
                style={[
                  styles.nodeColumn,
                  {
                    left: nodeX(index),
                    top: nodeTop,
                    transform: [{ translateX: -halfColumn }],
                    width: columnWidth,
                    gap: labelGap,
                  },
                ]}
              >
                <Pressable
                  disabled={locked}
                  onPress={() => router.push(`/lesson/${lesson.id}`)}
                >
                  <Animated.View
                    style={[
                      styles.node,
                      {
                        borderRadius: halfNode,
                        height: nodeSize,
                        width: nodeSize,
                      },
                      nodeState === 'completed' && styles.nodeCompleted,
                      nodeState === 'current' && styles.nodeCurrent,
                      nodeState === 'locked' && styles.nodeLocked,
                      nodeState === 'current' && {
                        transform: [{ scale: pulseAnim }],
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.nodeIcon,
                        compact && styles.nodeIconCompact,
                        nodeState === 'locked' && styles.nodeIconLocked,
                      ]}
                    >
                      {nodeState === 'completed'
                        ? '✓'
                        : nodeState === 'current'
                          ? '▶'
                          : '🔒'}
                    </Text>
                  </Animated.View>
                </Pressable>

                <View
                  style={[
                    styles.labelCard,
                    { width: labelWidth },
                    compact && styles.labelCardCompact,
                    locked && styles.labelCardLocked,
                  ]}
                >
                  <Text
                    style={[
                      styles.labelTitle,
                      compact && styles.labelTitleCompact,
                      locked && styles.labelTitleLocked,
                    ]}
                  >
                    {lesson.title}
                  </Text>
                  <View style={styles.xpRow}>
                    <Text style={styles.starIcon}>⭐</Text>
                    <Text style={styles.labelXp}>
                      {lesson.xpReward} {i18n.learn.xpLabel}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          );
        })}
        <View style={styles.pathFooter} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 12,
    paddingBottom: 16,
    paddingTop: 8,
  },
  header: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  title: {
    color: colors.text,
    fontFamily: 'Fredoka_700Bold',
    textAlign: 'center',
  },
  subtitle: {
    color: colors.muted,
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 15,
    lineHeight: 22,
    paddingHorizontal: 8,
    textAlign: 'center',
  },
  path: {
    overflow: 'visible',
    width: '100%',
  },
  row: {
    overflow: 'visible',
    position: 'relative',
    width: '100%',
  },
  nodeColumn: {
    alignItems: 'center',
    position: 'absolute',
    zIndex: 1,
  },
  node: {
    alignItems: 'center',
    borderWidth: 4,
    justifyContent: 'center',
  },
  nodeCurrent: {
    backgroundColor: colors.primary,
    borderColor: colors.border,
    shadowColor: colors.border,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
  },
  nodeCompleted: {
    backgroundColor: colors.secondary,
    borderColor: colors.border,
    shadowColor: colors.border,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  nodeLocked: {
    backgroundColor: '#E2E8F0',
    borderColor: '#94A3B8',
    shadowColor: '#94A3B8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  nodeIcon: {
    color: '#FFFFFF',
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 26,
  },
  nodeIconCompact: {
    fontSize: 20,
  },
  nodeIconLocked: {
    color: '#94A3B8',
    fontSize: 18,
  },
  labelCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 3,
    paddingHorizontal: 8,
    paddingVertical: 5,
    shadowColor: colors.border,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  labelCardCompact: {
    paddingHorizontal: 6,
  },
  labelCardLocked: {
    opacity: 0.85,
  },
  labelTitle: {
    color: colors.text,
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 13,
    textAlign: 'center',
    width: '100%',
  },
  labelTitleCompact: {
    fontSize: 12,
  },
  labelTitleLocked: {
    color: colors.muted,
  },
  xpRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 3,
    marginTop: 1,
  },
  starIcon: {
    fontSize: 9,
  },
  labelXp: {
    color: colors.secondary,
    fontFamily: 'Nunito_700Bold',
    fontSize: 11,
  },
  connector: {
    left: 0,
    position: 'absolute',
    zIndex: 0,
  },
  pathFooter: {
    height: 100,
  },
});
