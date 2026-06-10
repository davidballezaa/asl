import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { NBCard } from '@/components/NBCard';
import { colors } from '@/constants/colors';
import type {
  AdminExercise,
  AdminLesson,
  AdminUnit,
} from '@/lib/api/admin';

type CurriculumPath =
  | { view: 'units' }
  | { view: 'lessons'; unitId: string }
  | { view: 'exercises'; unitId: string; lessonId: string };

type CurriculumBrowserProps = {
  units: AdminUnit[];
  onAddUnit: () => void;
  onEditUnit: (u: AdminUnit) => void;
  onDeleteUnit: (u: AdminUnit) => void;
  onReorderUnit: (index: number, dir: -1 | 1) => void;
  onAddLesson: (unitId: string) => void;
  onEditLesson: (unitId: string, l: AdminLesson) => void;
  onDeleteLesson: (l: AdminLesson) => void;
  onReorderLesson: (
    unitId: string,
    lessons: AdminLesson[],
    index: number,
    dir: -1 | 1,
  ) => void;
  onAddExercise: (lessonId: string) => void;
  onEditExercise: (lessonId: string, e: AdminExercise) => void;
  onDeleteExercise: (e: AdminExercise) => void;
  onReorderExercise: (
    lessonId: string,
    exercises: AdminExercise[],
    index: number,
    dir: -1 | 1,
  ) => void;
  onEditOptions: (e: AdminExercise) => void;
};

const EXERCISE_META: Record<
  AdminExercise['type'],
  { label: string; icon: string; tint: string; bg: string }
> = {
  demo: { label: 'Demo', icon: '▶', tint: colors.cyan, bg: '#CFFAFE' },
  quiz: { label: 'Quiz', icon: '✓', tint: colors.purple, bg: '#EDE9FE' },
  camera: { label: 'Camera', icon: '📷', tint: colors.pink, bg: '#FCE7F3' },
};

export function CurriculumBrowser(props: CurriculumBrowserProps) {
  const [path, setPath] = useState<CurriculumPath>({ view: 'units' });

  const unit = useMemo(
    () =>
      path.view === 'units'
        ? null
        : props.units.find((item) => item.id === path.unitId) ?? null,
    [path, props.units],
  );

  const lesson = useMemo(
    () =>
      path.view !== 'exercises' || !unit
        ? null
        : unit.lessons.find((item) => item.id === path.lessonId) ?? null,
    [path, unit],
  );

  const crumbs = useMemo(() => {
    const items: { label: string; onPress?: () => void }[] = [
      {
        label: 'Curriculum',
        onPress:
          path.view !== 'units' ? () => setPath({ view: 'units' }) : undefined,
      },
    ];

    if (unit) {
      items.push({
        label: unit.title,
        onPress:
          path.view === 'exercises'
            ? () => setPath({ view: 'lessons', unitId: unit.id })
            : undefined,
      });
    }

    if (lesson) {
      items.push({ label: lesson.title });
    }

    return items;
  }, [lesson, path.view, unit]);

  const handleAdd = () => {
    if (path.view === 'units') {
      props.onAddUnit();
      return;
    }
    if (path.view === 'lessons') {
      props.onAddLesson(path.unitId);
      return;
    }
    props.onAddExercise(path.lessonId);
  };

  const addLabel =
    path.view === 'units'
      ? 'Add unit'
      : path.view === 'lessons'
        ? 'Add lesson'
        : 'Add exercise';

  return (
    <View style={styles.root}>
      <View style={styles.toolbar}>
        <View style={styles.breadcrumbs}>
          {crumbs.map((crumb, index) => (
            <View key={`${crumb.label}-${index}`} style={styles.crumbWrap}>
              {index > 0 && <Text style={styles.crumbSep}>›</Text>}
              {crumb.onPress ? (
                <Pressable onPress={crumb.onPress} hitSlop={6}>
                  <Text style={styles.crumbLink} numberOfLines={1}>
                    {crumb.label}
                  </Text>
                </Pressable>
              ) : (
                <Text style={styles.crumbCurrent} numberOfLines={1}>
                  {crumb.label}
                </Text>
              )}
            </View>
          ))}
        </View>

        <Pressable style={styles.addButton} onPress={handleAdd}>
          <Text style={styles.addButtonText}>+ {addLabel}</Text>
        </Pressable>
      </View>

      {path.view === 'units' && (
        <UnitsView
          units={props.units}
          onOpen={(unitId) => setPath({ view: 'lessons', unitId })}
          onEdit={props.onEditUnit}
          onDelete={props.onDeleteUnit}
          onReorder={props.onReorderUnit}
          onAdd={props.onAddUnit}
        />
      )}

      {path.view === 'lessons' && unit && (
        <LessonsView
          unit={unit}
          onOpen={(lessonId) =>
            setPath({ view: 'exercises', unitId: unit.id, lessonId })
          }
          onEditUnit={() => props.onEditUnit(unit)}
          onEditLesson={(lesson) => props.onEditLesson(unit.id, lesson)}
          onDelete={props.onDeleteLesson}
          onReorder={(index, dir) =>
            props.onReorderLesson(unit.id, unit.lessons, index, dir)
          }
          onAdd={() => props.onAddLesson(unit.id)}
        />
      )}

      {path.view === 'exercises' && unit && lesson && (
        <ExercisesView
          unit={unit}
          lesson={lesson}
          onEditLesson={() => props.onEditLesson(unit.id, lesson)}
          onEditExercise={(exercise) => props.onEditExercise(lesson.id, exercise)}
          onDelete={props.onDeleteExercise}
          onEditOptions={props.onEditOptions}
          onReorder={(index, dir) =>
            props.onReorderExercise(lesson.id, lesson.exercises, index, dir)
          }
          onAdd={() => props.onAddExercise(lesson.id)}
        />
      )}
    </View>
  );
}

function UnitsView({
  units,
  onOpen,
  onEdit,
  onDelete,
  onReorder,
  onAdd,
}: {
  units: AdminUnit[];
  onOpen: (unitId: string) => void;
  onEdit: (unit: AdminUnit) => void;
  onDelete: (unit: AdminUnit) => void;
  onReorder: (index: number, dir: -1 | 1) => void;
  onAdd: () => void;
}) {
  if (units.length === 0) {
    return (
      <EmptyState
        icon="📚"
        title="No units yet"
        hint="Create your first learning unit to organize lessons."
        actionLabel="+ Add unit"
        onAction={onAdd}
      />
    );
  }

  return (
    <View style={styles.list}>
      {units.map((unit, index) => (
        <FolderRow
          key={unit.id}
          icon="📁"
          title={unit.title}
          subtitle={`${unit.lessons.length} lesson${unit.lessons.length === 1 ? '' : 's'}`}
          meta={unit.description}
          onOpen={() => onOpen(unit.id)}
          onEdit={() => onEdit(unit)}
          onDelete={() => onDelete(unit)}
          onMoveUp={() => onReorder(index, -1)}
          onMoveDown={() => onReorder(index, 1)}
          canMoveUp={index > 0}
          canMoveDown={index < units.length - 1}
        />
      ))}
    </View>
  );
}

function LessonsView({
  unit,
  onOpen,
  onEditUnit,
  onEditLesson,
  onDelete,
  onReorder,
  onAdd,
}: {
  unit: AdminUnit;
  onOpen: (lessonId: string) => void;
  onEditUnit: () => void;
  onEditLesson: (lesson: AdminLesson) => void;
  onDelete: (lesson: AdminLesson) => void;
  onReorder: (index: number, dir: -1 | 1) => void;
  onAdd: () => void;
}) {
  return (
    <View style={styles.list}>
      <NBCard style={styles.contextCard}>
        <View style={styles.contextHeader}>
          <View style={styles.contextIcon}>
            <Text style={styles.contextIconText}>📁</Text>
          </View>
          <View style={styles.contextBody}>
            <Text style={styles.contextTitle}>{unit.title}</Text>
            <Text style={styles.contextMeta}>{unit.description}</Text>
          </View>
          <Pressable onPress={onEditUnit} hitSlop={8} style={styles.contextEdit}>
            <Text style={styles.contextEditText}>Edit</Text>
          </Pressable>
        </View>
      </NBCard>

      {unit.lessons.length === 0 ? (
        <EmptyState
          icon="📖"
          title="No lessons in this unit"
          hint="Add lessons to build the learning path."
          actionLabel="+ Add lesson"
          onAction={onAdd}
        />
      ) : (
        unit.lessons.map((lesson, index) => (
          <FolderRow
            key={lesson.id}
            icon="📖"
            title={lesson.title}
            subtitle={`${lesson.exercises.length} exercise${lesson.exercises.length === 1 ? '' : 's'} · ${lesson.xpReward} XP`}
            meta={
              lesson.youtubeId
                ? `Video ${lesson.youtubeId}`
                : lesson.description
            }
            onOpen={() => onOpen(lesson.id)}
            onEdit={() => onEditLesson(lesson)}
            onDelete={() => onDelete(lesson)}
            onMoveUp={() => onReorder(index, -1)}
            onMoveDown={() => onReorder(index, 1)}
            canMoveUp={index > 0}
            canMoveDown={index < unit.lessons.length - 1}
          />
        ))
      )}
    </View>
  );
}

function ExercisesView({
  unit,
  lesson,
  onEditLesson,
  onEditExercise,
  onDelete,
  onEditOptions,
  onReorder,
  onAdd,
}: {
  unit: AdminUnit;
  lesson: AdminLesson;
  onEditLesson: () => void;
  onEditExercise: (exercise: AdminExercise) => void;
  onDelete: (exercise: AdminExercise) => void;
  onEditOptions: (exercise: AdminExercise) => void;
  onReorder: (index: number, dir: -1 | 1) => void;
  onAdd: () => void;
}) {
  return (
    <View style={styles.list}>
      <NBCard style={styles.contextCard}>
        <View style={styles.contextHeader}>
          <View style={styles.contextIcon}>
            <Text style={styles.contextIconText}>📖</Text>
          </View>
          <View style={styles.contextBody}>
            <Text style={styles.contextEyebrow}>{unit.title}</Text>
            <Text style={styles.contextTitle}>{lesson.title}</Text>
            <Text style={styles.contextMeta}>
              {lesson.xpReward} XP
              {lesson.youtubeId ? ` · ▶ ${lesson.youtubeId}` : ''}
            </Text>
          </View>
          <Pressable onPress={onEditLesson} hitSlop={8} style={styles.contextEdit}>
            <Text style={styles.contextEditText}>Edit</Text>
          </Pressable>
        </View>
      </NBCard>

      {lesson.exercises.length === 0 ? (
        <EmptyState
          icon="✋"
          title="No exercises yet"
          hint="Add demos, quizzes, or camera practice steps."
          actionLabel="+ Add exercise"
          onAction={onAdd}
        />
      ) : (
        lesson.exercises.map((exercise, index) => {
          const meta = EXERCISE_META[exercise.type];
          return (
            <ExerciseRow
              key={exercise.id}
              exercise={exercise}
              meta={meta}
              onEdit={() => onEditExercise(exercise)}
              onDelete={() => onDelete(exercise)}
              onOptions={
                exercise.type === 'quiz'
                  ? () => onEditOptions(exercise)
                  : undefined
              }
              onMoveUp={() => onReorder(index, -1)}
              onMoveDown={() => onReorder(index, 1)}
              canMoveUp={index > 0}
              canMoveDown={index < lesson.exercises.length - 1}
            />
          );
        })
      )}
    </View>
  );
}

function FolderRow({
  icon,
  title,
  subtitle,
  meta,
  onOpen,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: {
  icon: string;
  title: string;
  subtitle: string;
  meta?: string;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  return (
    <NBCard style={styles.rowCard}>
      <Pressable onPress={onOpen} style={styles.rowMain}>
        <View style={styles.folderIcon}>
          <Text style={styles.folderIconText}>{icon}</Text>
        </View>

        <View style={styles.rowContent}>
          <Text style={styles.rowTitle} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.rowSubtitle} numberOfLines={1}>
            {subtitle}
          </Text>
          {meta ? (
            <Text style={styles.rowMeta} numberOfLines={2}>
              {meta}
            </Text>
          ) : null}
        </View>

        <Text style={styles.chevron}>›</Text>
      </Pressable>

      <RowActions
        onEdit={onEdit}
        onDelete={onDelete}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        canMoveUp={canMoveUp}
        canMoveDown={canMoveDown}
      />
    </NBCard>
  );
}

function ExerciseRow({
  exercise,
  meta,
  onEdit,
  onDelete,
  onOptions,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: {
  exercise: AdminExercise;
  meta: (typeof EXERCISE_META)[AdminExercise['type']];
  onEdit: () => void;
  onDelete: () => void;
  onOptions?: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  const optionsLabel =
    exercise.type === 'quiz'
      ? `${exercise.options.length} option${exercise.options.length === 1 ? '' : 's'}`
      : exercise.signDescription;

  return (
    <NBCard style={styles.rowCard}>
      <Pressable onPress={onEdit} style={styles.rowMain}>
        <View style={[styles.typeBadge, { backgroundColor: meta.bg }]}>
          <Text style={[styles.typeBadgeText, { color: meta.tint }]}>
            {meta.icon} {meta.label}
          </Text>
        </View>

        <View style={styles.rowContent}>
          <Text style={styles.rowTitle} numberOfLines={1}>
            {exercise.signWord}
          </Text>
          <Text style={styles.rowSubtitle} numberOfLines={2}>
            {optionsLabel}
          </Text>
          {exercise.imageUrl ? (
            <Text style={styles.rowMeta} numberOfLines={1}>
              Image attached
            </Text>
          ) : null}
        </View>
      </Pressable>

      <RowActions
        onEdit={onEdit}
        onDelete={onDelete}
        onExtra={onOptions}
        extraLabel={onOptions ? 'Options' : undefined}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        canMoveUp={canMoveUp}
        canMoveDown={canMoveDown}
      />
    </NBCard>
  );
}

function RowActions({
  onEdit,
  onDelete,
  onExtra,
  extraLabel,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: {
  onEdit: () => void;
  onDelete: () => void;
  onExtra?: () => void;
  extraLabel?: string;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  return (
    <View style={styles.rowActions}>
      <View style={styles.reorderGroup}>
        <ActionChip
          label="↑"
          onPress={onMoveUp}
          disabled={!canMoveUp}
        />
        <ActionChip
          label="↓"
          onPress={onMoveDown}
          disabled={!canMoveDown}
        />
      </View>

      <View style={styles.actionGroup}>
        <ActionChip label="Edit" onPress={onEdit} />
        {extraLabel && onExtra ? (
          <ActionChip label={extraLabel} onPress={onExtra} />
        ) : null}
        <ActionChip label="Delete" onPress={onDelete} danger />
      </View>
    </View>
  );
}

function ActionChip({
  label,
  onPress,
  disabled,
  danger,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={4}
      style={[
        styles.actionChip,
        disabled && styles.actionChipDisabled,
        danger && styles.actionChipDanger,
      ]}
    >
      <Text
        style={[
          styles.actionChipText,
          disabled && styles.actionChipTextDisabled,
          danger && styles.actionChipTextDanger,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function EmptyState({
  icon,
  title,
  hint,
  actionLabel,
  onAction,
}: {
  icon: string;
  title: string;
  hint: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <NBCard style={styles.emptyCard}>
      <Text style={styles.emptyIcon}>{icon}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyHint}>{hint}</Text>
      <Pressable onPress={onAction} style={styles.emptyButton}>
        <Text style={styles.emptyButtonText}>{actionLabel}</Text>
      </Pressable>
    </NBCard>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 16,
  },
  toolbar: {
    gap: 12,
  },
  breadcrumbs: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  crumbWrap: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    maxWidth: '100%',
  },
  crumbSep: {
    color: colors.muted,
    fontFamily: 'Nunito_700Bold',
    fontSize: 14,
  },
  crumbLink: {
    color: colors.primary,
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 14,
    maxWidth: 180,
  },
  crumbCurrent: {
    color: colors.text,
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 14,
    maxWidth: 220,
  },
  addButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 3,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: colors.border,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  addButtonText: {
    color: colors.surface,
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 14,
  },
  list: {
    gap: 12,
  },
  contextCard: {
    gap: 0,
    padding: 14,
  },
  contextHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  contextIcon: {
    alignItems: 'center',
    backgroundColor: colors.secondaryLight,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 3,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  contextIconText: {
    fontSize: 22,
  },
  contextBody: {
    flex: 1,
    gap: 2,
  },
  contextEyebrow: {
    color: colors.muted,
    fontFamily: 'Nunito_700Bold',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  contextTitle: {
    color: colors.text,
    fontFamily: 'Fredoka_700Bold',
    fontSize: 18,
  },
  contextMeta: {
    color: colors.muted,
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 13,
  },
  contextEdit: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 2,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  contextEditText: {
    color: colors.primary,
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 12,
  },
  rowCard: {
    gap: 10,
    padding: 14,
  },
  rowMain: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  folderIcon: {
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 3,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  folderIconText: {
    fontSize: 20,
  },
  typeBadge: {
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 2,
    minWidth: 88,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  typeBadgeText: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 12,
    textAlign: 'center',
  },
  rowContent: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    color: colors.text,
    fontFamily: 'Fredoka_700Bold',
    fontSize: 17,
  },
  rowSubtitle: {
    color: colors.muted,
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 13,
  },
  rowMeta: {
    color: colors.muted,
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 12,
    marginTop: 2,
  },
  chevron: {
    color: colors.muted,
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 24,
    marginTop: -2,
  },
  rowActions: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  reorderGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  actionGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'flex-end',
  },
  actionChip: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 2,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  actionChipDisabled: {
    opacity: 0.35,
  },
  actionChipDanger: {
    backgroundColor: colors.errorLight,
  },
  actionChipText: {
    color: colors.primary,
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 12,
  },
  actionChipTextDisabled: {
    color: colors.muted,
  },
  actionChipTextDanger: {
    color: colors.error,
  },
  emptyCard: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 28,
  },
  emptyIcon: {
    fontSize: 32,
  },
  emptyTitle: {
    color: colors.text,
    fontFamily: 'Fredoka_700Bold',
    fontSize: 18,
  },
  emptyHint: {
    color: colors.muted,
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 14,
    lineHeight: 20,
    maxWidth: 280,
    textAlign: 'center',
  },
  emptyButton: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 2,
    marginTop: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  emptyButtonText: {
    color: colors.primary,
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 13,
  },
});
