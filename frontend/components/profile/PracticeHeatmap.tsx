import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SectionBlock } from '@/components/SectionBlock';
import { colors } from '@/constants/colors';
import { useLang } from '@/context/LangContext';
import { toDateKey } from '@/lib/profile-data';

type PracticeHeatmapProps = {
  practiceDays: string[];
};

const WEEKDAYS = {
  es: ['D', 'L', 'Ma', 'Mi', 'J', 'V', 'S'],
  en: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
} as const;

function getMonthWeeks(year: number, month: number): (number | null)[][] {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = new Date(year, month, 1).getDay();

  const cells: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(day);
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}

function isStreakNeighbor(
  day: number,
  offset: number,
  year: number,
  month: number,
  daySet: Set<string>,
  today: Date,
): boolean {
  const neighbor = new Date(year, month, day + offset);
  if (neighbor.getMonth() !== month) return false;
  if (neighbor > today) return false;
  return daySet.has(toDateKey(neighbor));
}

export function PracticeHeatmap({ practiceDays }: PracticeHeatmapProps) {
  const { lang, i18n } = useLang();
  const today = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  }, []);
  const todayKey = toDateKey(today);

  const [viewDate, setViewDate] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daySet = useMemo(() => new Set(practiceDays), [practiceDays]);
  const weeks = useMemo(() => getMonthWeeks(year, month), [year, month]);

  const monthLabel = new Intl.DateTimeFormat(lang === 'es' ? 'es' : 'en', {
    month: 'long',
    year: 'numeric',
  }).format(viewDate);

  const canGoNext =
    year < today.getFullYear() ||
    (year === today.getFullYear() && month < today.getMonth());

  const goToPrevMonth = () => {
    setViewDate((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    if (!canGoNext) return;
    setViewDate((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1));
  };

  return (
    <SectionBlock title={i18n.profile.activity}>
      <View style={styles.monthNav}>
        <Pressable
          onPress={goToPrevMonth}
          style={({ pressed }) => [styles.navBtn, pressed && styles.navBtnPressed]}
          accessibilityLabel={i18n.profile.prevMonth}
        >
          <Text style={styles.navBtnText}>‹</Text>
        </Pressable>
        <Text style={styles.monthLabel}>{monthLabel}</Text>
        <Pressable
          onPress={goToNextMonth}
          disabled={!canGoNext}
          style={({ pressed }) => [
            styles.navBtn,
            !canGoNext && styles.navBtnDisabled,
            pressed && canGoNext && styles.navBtnPressed,
          ]}
          accessibilityLabel={i18n.profile.nextMonth}
        >
          <Text style={[styles.navBtnText, !canGoNext && styles.navBtnTextDisabled]}>›</Text>
        </Pressable>
      </View>

      <View style={styles.calendarWrapper}>
        <View style={styles.weekdayRow}>
          {WEEKDAYS[lang].map((label, index) => (
            <Text key={`${label}-${index}`} style={styles.weekdayLabel}>
              {label}
            </Text>
          ))}
        </View>

        {weeks.map((week, weekIndex) => (
          <View key={weekIndex} style={styles.weekRow}>
            {week.map((day, dayIndex) => {
              if (day === null) {
                return <View key={`empty-${dayIndex}`} style={styles.dayCell} />;
              }

              const dateKey = toDateKey(new Date(year, month, day));
              const practiced = daySet.has(dateKey);
              const isToday = dateKey === todayKey;
              const cellDate = new Date(year, month, day);
              const isFuture = cellDate > today;
              const hasLeftNeighbor = isStreakNeighbor(day, -1, year, month, daySet, today);
              const hasRightNeighbor = isStreakNeighbor(day, 1, year, month, daySet, today);

              return (
                <View key={dateKey} style={styles.dayCell}>
                  {practiced && (
                    <View
                      style={[
                        styles.streakBand,
                        !hasLeftNeighbor && styles.streakBandStart,
                        !hasRightNeighbor && styles.streakBandEnd,
                        hasLeftNeighbor && styles.streakBandMiddleLeft,
                        hasRightNeighbor && styles.streakBandMiddleRight,
                      ]}
                    />
                  )}
                  <View
                    style={[
                      styles.dayMarker,
                      practiced && styles.dayMarkerPracticed,
                      isToday && !practiced && styles.dayMarkerToday,
                      isToday && practiced && styles.dayMarkerTodayPracticed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        practiced && styles.dayTextPracticed,
                        isFuture && styles.dayTextFuture,
                        !practiced && !isFuture && !isToday && styles.dayTextInactive,
                        isToday && !practiced && styles.dayTextToday,
                      ]}
                    >
                      {day}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        ))}
      </View>
    </SectionBlock>
  );
}

const styles = StyleSheet.create({
  monthNav: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  navBtn: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 3,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  navBtnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
  navBtnDisabled: {
    opacity: 0.35,
  },
  navBtnText: {
    color: colors.text,
    fontFamily: 'Fredoka_700Bold',
    fontSize: 24,
    lineHeight: 28,
    marginTop: -2,
  },
  navBtnTextDisabled: {
    color: colors.muted,
  },
  monthLabel: {
    color: colors.text,
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 16,
    textTransform: 'capitalize',
  },
  calendarWrapper: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 3,
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 14,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  weekdayLabel: {
    color: colors.muted,
    flex: 1,
    fontFamily: 'Nunito_700Bold',
    fontSize: 11,
    textAlign: 'center',
  },
  weekRow: {
    flexDirection: 'row',
  },
  dayCell: {
    alignItems: 'center',
    flex: 1,
    height: 36,
    justifyContent: 'center',
    position: 'relative',
  },
  streakBand: {
    backgroundColor: colors.secondaryLight,
    height: 28,
    left: '12%',
    position: 'absolute',
    right: '12%',
    top: 4,
    zIndex: 0,
  },
  streakBandStart: {
    borderBottomLeftRadius: 14,
    borderTopLeftRadius: 14,
  },
  streakBandEnd: {
    borderBottomRightRadius: 14,
    borderTopRightRadius: 14,
  },
  streakBandMiddleLeft: {
    borderBottomLeftRadius: 0,
    borderTopLeftRadius: 0,
    left: 0,
  },
  streakBandMiddleRight: {
    borderBottomRightRadius: 0,
    borderTopRightRadius: 0,
    right: 0,
  },
  dayMarker: {
    alignItems: 'center',
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    width: 32,
    zIndex: 1,
  },
  dayMarkerPracticed: {
    backgroundColor: colors.secondary,
  },
  dayMarkerToday: {
    backgroundColor: '#E2E8F0',
  },
  dayMarkerTodayPracticed: {
    backgroundColor: colors.secondary,
    borderColor: colors.border,
    borderWidth: 2,
  },
  dayText: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 13,
  },
  dayTextPracticed: {
    color: colors.text,
  },
  dayTextFuture: {
    color: '#CBD5E1',
  },
  dayTextInactive: {
    color: colors.muted,
  },
  dayTextToday: {
    color: colors.muted,
  },
});
