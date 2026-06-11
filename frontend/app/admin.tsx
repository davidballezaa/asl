import { Redirect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CurriculumBrowser } from '@/components/admin/CurriculumBrowser';
import { UserGrowthChart } from '@/components/admin/UserGrowthChart';
import { NBButton } from '@/components/NBButton';
import { NBCard } from '@/components/NBCard';
import { colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { useAppData } from '@/context/AppDataContext';
import { ApiError } from '@/lib/api/client';
import {
  AdminExercise,
  AdminLesson,
  AdminMetrics,
  AdminOption,
  AdminUnit,
  createExercise,
  createLesson,
  createUnit,
  deleteExercise,
  deleteLesson,
  deleteUnit,
  fetchAdminCurriculum,
  fetchAdminMetrics,
  reorderExercises,
  reorderLessons,
  reorderUnits,
  setExerciseOptions,
  updateExercise,
  updateLesson,
  updateUnit,
} from '@/lib/api/admin';

type FieldDef = {
  key: string;
  label: string;
  placeholder?: string;
  multiline?: boolean;
  numeric?: boolean;
};

type FormState = {
  title: string;
  fields: FieldDef[];
  values: Record<string, string>;
  onSubmit: (values: Record<string, string>) => Promise<unknown>;
};

export default function AdminScreen() {
  const { isSignedIn, isLoading: authLoading } = useAuth();
  const { me, isLoading: appDataLoading } = useAppData();
  const router = useRouter();
  const isAdmin = me?.user.role === 'admin';

  const goHome = useCallback(() => {
    router.navigate('/home');
  }, [router]);
  const [section, setSection] = useState<'metrics' | 'curriculum'>('metrics');
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [units, setUnits] = useState<AdminUnit[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<FormState | null>(null);
  const [optionsFor, setOptionsFor] = useState<AdminExercise | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [m, c] = await Promise.all([
        fetchAdminMetrics(),
        fetchAdminCurriculum(),
      ]);
      setMetrics(m);
      setUnits(c);
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        goHome();
        return;
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, [goHome]);

  useEffect(() => {
    if (!isAdmin) return;
    void load();
  }, [isAdmin, load]);

  const run = useCallback(
    async (fn: () => Promise<unknown>) => {
      try {
        await fn();
        await load();
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : 'Something went wrong';
        Alert.alert('Error', message);
      }
    },
    [load],
  );

  const confirmDelete = useCallback(
    (label: string, fn: () => Promise<unknown>) => {
      Alert.alert('Delete', `Delete ${label}?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => void run(fn),
        },
      ]);
    },
    [run],
  );

  const checkingAccess =
    authLoading || appDataLoading || (isSignedIn && !me);

  if (checkingAccess) {
    return (
      <SafeAreaView style={styles.loading}>
        <ActivityIndicator color={colors.primary} size="large" />
      </SafeAreaView>
    );
  }

  if (!isAdmin) {
    return <Redirect href="/home" />;
  }

  const submitForm = async (values: Record<string, string>) => {
    if (form) {
      await run(() => form.onSubmit(values));
      setForm(null);
    }
  };

  // --- Form openers ---
  const unitForm = (unit?: AdminUnit) =>
    setForm({
      title: unit ? 'Edit unit' : 'New unit',
      fields: [
        { key: 'title', label: 'Title' },
        { key: 'description', label: 'Description', multiline: true },
      ],
      values: { title: unit?.title ?? '', description: unit?.description ?? '' },
      onSubmit: (v) =>
        unit
          ? updateUnit(unit.id, { title: v.title, description: v.description })
          : createUnit({ title: v.title, description: v.description }),
    });

  const lessonForm = (unitId: string, lesson?: AdminLesson) =>
    setForm({
      title: lesson ? 'Edit lesson' : 'New lesson',
      fields: [
        { key: 'title', label: 'Title' },
        { key: 'description', label: 'Description', multiline: true },
        { key: 'xpReward', label: 'XP reward', numeric: true },
        { key: 'youtubeId', label: 'YouTube ID (optional)' },
      ],
      values: {
        title: lesson?.title ?? '',
        description: lesson?.description ?? '',
        xpReward: String(lesson?.xpReward ?? 10),
        youtubeId: lesson?.youtubeId ?? '',
      },
      onSubmit: (v) => {
        const body = {
          title: v.title,
          description: v.description,
          xpReward: Number(v.xpReward) || 0,
          youtubeId: v.youtubeId.trim() ? v.youtubeId.trim() : null,
        };
        return lesson
          ? updateLesson(lesson.id, body)
          : createLesson({ ...body, unitId });
      },
    });

  const exerciseForm = (lessonId: string, exercise?: AdminExercise) =>
    setForm({
      title: exercise ? 'Edit exercise' : 'New exercise',
      fields: [
        { key: 'type', label: 'Type (demo / quiz / camera)' },
        { key: 'signWord', label: 'Sign word' },
        { key: 'signDescription', label: 'Description', multiline: true },
        { key: 'contentType', label: 'Content type (letter / name / blank)' },
        { key: 'imageUrl', label: 'Image URL (optional)' },
      ],
      values: {
        type: exercise?.type ?? 'quiz',
        signWord: exercise?.signWord ?? '',
        signDescription: exercise?.signDescription ?? '',
        contentType: exercise?.contentType ?? '',
        imageUrl: exercise?.imageUrl ?? '',
      },
      onSubmit: (v) => {
        const body = {
          type: v.type.trim() as AdminExercise['type'],
          signWord: v.signWord,
          signDescription: v.signDescription,
          contentType: (v.contentType.trim() || null) as
            | 'letter'
            | 'name'
            | null,
          imageUrl: v.imageUrl.trim() ? v.imageUrl.trim() : null,
        };
        return exercise
          ? updateExercise(exercise.id, body)
          : createExercise({ ...body, lessonId });
      },
    });

  const move = <T extends { id: string }>(
    items: T[],
    index: number,
    dir: -1 | 1,
    apply: (ids: string[]) => Promise<unknown>,
  ) => {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    const ids = items.map((i) => i.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    void run(() => apply(ids));
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={goHome} hitSlop={8}>
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Admin</Text>
        <View style={{ width: 48 }} />
      </View>

      <View style={styles.tabs}>
        {(['metrics', 'curriculum'] as const).map((s) => (
          <Pressable
            key={s}
            onPress={() => setSection(s)}
            style={[styles.tab, section === s && styles.tabActive]}
          >
            <Text style={[styles.tabText, section === s && styles.tabTextActive]}>
              {s === 'metrics' ? 'Metrics' : 'Curriculum'}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {section === 'metrics'
            ? metrics && <Metrics metrics={metrics} />
            : (
              <CurriculumBrowser
                units={units}
                onAddUnit={() => unitForm()}
                onEditUnit={(u) => unitForm(u)}
                onDeleteUnit={(u) =>
                  confirmDelete(`unit "${u.title}"`, () => deleteUnit(u.id))
                }
                onReorderUnit={(i, d) =>
                  move(units, i, d, reorderUnits)
                }
                onAddLesson={(unitId) => lessonForm(unitId)}
                onEditLesson={(unitId, l) => lessonForm(unitId, l)}
                onDeleteLesson={(l) =>
                  confirmDelete(`lesson "${l.title}"`, () => deleteLesson(l.id))
                }
                onReorderLesson={(unitId, lessons, i, d) =>
                  move(lessons, i, d, (ids) => reorderLessons(unitId, ids))
                }
                onAddExercise={(lessonId) => exerciseForm(lessonId)}
                onEditExercise={(lessonId, e) => exerciseForm(lessonId, e)}
                onDeleteExercise={(e) =>
                  confirmDelete(`exercise "${e.signWord}"`, () =>
                    deleteExercise(e.id),
                  )
                }
                onReorderExercise={(lessonId, exercises, i, d) =>
                  move(exercises, i, d, (ids) => reorderExercises(lessonId, ids))
                }
                onEditOptions={(e) => setOptionsFor(e)}
              />
            )}
        </ScrollView>
      )}

      {form && (
        <FormModal
          key={form.title}
          state={form}
          onCancel={() => setForm(null)}
          onSubmit={submitForm}
        />
      )}
      {optionsFor && (
        <OptionsModal
          key={optionsFor.id}
          exercise={optionsFor}
          onCancel={() => setOptionsFor(null)}
          onSave={(opts) =>
            run(() => setExerciseOptions(optionsFor.id, opts)).then(() =>
              setOptionsFor(null),
            )
          }
        />
      )}
    </SafeAreaView>
  );
}

function Metrics({ metrics }: { metrics: AdminMetrics }) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const cards: { label: string; value: string }[] = [
    { label: 'Total users', value: String(metrics.totalUsers) },
    { label: 'Active (7d)', value: String(metrics.activeUsers7d) },
    { label: 'New (7d)', value: String(metrics.newSignups7d) },
    { label: 'New (30d)', value: String(metrics.newSignups30d) },
    { label: 'Lessons completed', value: String(metrics.totalLessonsCompleted) },
    { label: 'Pro subscribers', value: String(metrics.proSubscribers) },
    { label: 'Free users', value: String(metrics.freeUsers) },
    { label: 'Pro conversion', value: `${metrics.proConversionRate}%` },
  ];
  return (
    <View style={{ gap: 16 }}>
      <View style={styles.metricGrid}>
        {cards.map((c) => (
          <NBCard
            key={c.label}
            style={[styles.metricCard, isDesktop && styles.metricCardDesktop]}
          >
            <Text style={styles.metricValue}>{c.value}</Text>
            <Text style={styles.metricLabel}>{c.label}</Text>
          </NBCard>
        ))}
      </View>

      <NBCard style={{ gap: 12 }}>
        <Text style={styles.sectionTitle}>User growth (90 days)</Text>
        <UserGrowthChart data={metrics.userGrowth} />
      </NBCard>

      <NBCard style={{ gap: 8 }}>
        <Text style={styles.sectionTitle}>Lesson completions</Text>
        {metrics.lessonCompletions.map((l) => (
          <View key={l.lessonId} style={styles.row}>
            <Text style={styles.rowText} numberOfLines={1}>
              {l.title}
            </Text>
            <Text style={styles.rowValue}>{l.completions}</Text>
          </View>
        ))}
      </NBCard>

      <NBCard style={{ gap: 8 }}>
        <Text style={styles.sectionTitle}>Hardest quizzes (fail rate)</Text>
        {metrics.hardestQuizzes.length === 0 ? (
          <Text style={styles.muted}>No quiz attempts yet.</Text>
        ) : (
          metrics.hardestQuizzes.map((q) => (
            <View key={q.exerciseId} style={styles.row}>
              <Text style={styles.rowText} numberOfLines={1}>
                {q.signWord} · {q.attempts} attempts
              </Text>
              <Text style={styles.rowValue}>{q.failRate}%</Text>
            </View>
          ))
        )}
      </NBCard>
    </View>
  );
}

function FormModal({
  state,
  onCancel,
  onSubmit,
}: {
  state: FormState;
  onCancel: () => void;
  onSubmit: (values: Record<string, string>) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>(state.values);
  return (
    <Overlay>
      <Text style={styles.modalTitle}>{state.title}</Text>
      <ScrollView style={{ maxHeight: 380 }}>
        {state.fields.map((f) => (
          <View key={f.key} style={{ marginBottom: 10 }}>
            <Text style={styles.fieldLabel}>{f.label}</Text>
            <TextInput
              value={values[f.key]}
              onChangeText={(t) => setValues((v) => ({ ...v, [f.key]: t }))}
              placeholder={f.placeholder}
              multiline={f.multiline}
              keyboardType={f.numeric ? 'numeric' : 'default'}
              autoCapitalize="none"
              style={[styles.input, f.multiline && styles.inputMultiline]}
            />
          </View>
        ))}
      </ScrollView>
      <View style={styles.modalActions}>
        <NBButton title="Cancel" variant="ghost" onPress={onCancel} />
        <NBButton title="Save" variant="primary" onPress={() => onSubmit(values)} />
      </View>
    </Overlay>
  );
}

function OptionsModal({
  exercise,
  onCancel,
  onSave,
}: {
  exercise: AdminExercise;
  onCancel: () => void;
  onSave: (options: AdminOption[]) => void;
}) {
  const [options, setOptions] = useState<AdminOption[]>(
    exercise.options.length
      ? exercise.options
      : [{ value: '', isCorrect: true }],
  );
  const update = (i: number, patch: Partial<AdminOption>) =>
    setOptions((prev) =>
      prev.map((o, idx) => (idx === i ? { ...o, ...patch } : o)),
    );
  const setCorrect = (i: number) =>
    setOptions((prev) => prev.map((o, idx) => ({ ...o, isCorrect: idx === i })));
  return (
    <Overlay>
      <Text style={styles.modalTitle}>Options · {exercise.signWord}</Text>
      <ScrollView style={{ maxHeight: 360 }}>
        {options.map((o, i) => (
          <View key={i} style={styles.optionRow}>
            <Pressable onPress={() => setCorrect(i)} hitSlop={6}>
              <Text style={styles.radio}>{o.isCorrect ? '🟢' : '⚪'}</Text>
            </Pressable>
            <TextInput
              value={o.value}
              onChangeText={(t) => update(i, { value: t })}
              placeholder="Answer value"
              autoCapitalize="characters"
              style={[styles.input, { flex: 1 }]}
            />
            <Pressable
              onPress={() =>
                setOptions((prev) => prev.filter((_, idx) => idx !== i))
              }
              hitSlop={6}
            >
              <Text style={styles.actionDelete}>✕</Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>
      <Pressable
        onPress={() =>
          setOptions((prev) => [...prev, { value: '', isCorrect: false }])
        }
      >
        <Text style={styles.addLink}>+ Add option</Text>
      </Pressable>
      <View style={styles.modalActions}>
        <NBButton title="Cancel" variant="ghost" onPress={onCancel} />
        <NBButton
          title="Save"
          variant="primary"
          onPress={() => onSave(options.filter((o) => o.value.trim()))}
        />
      </View>
    </Overlay>
  );
}

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.overlay}>
      <View style={styles.modal}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.background, flex: 1 },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  back: { color: colors.primary, fontFamily: 'Nunito_800ExtraBold', fontSize: 16 },
  headerTitle: { color: colors.text, fontFamily: 'Fredoka_700Bold', fontSize: 22 },
  tabs: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 8 },
  tab: {
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 3,
    flex: 1,
    paddingVertical: 8,
  },
  tabActive: { backgroundColor: colors.primaryLight },
  tabText: {
    color: colors.muted,
    fontFamily: 'Nunito_800ExtraBold',
    textAlign: 'center',
  },
  tabTextActive: { color: colors.primary },
  loading: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  scroll: { padding: 16, paddingBottom: 48 },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metricCard: { alignItems: 'center', flexBasis: '47%', flexGrow: 1, gap: 2, minWidth: '46%' },
  metricCardDesktop: { flexBasis: '23%', maxWidth: '24%', minWidth: '22%' },
  metricValue: { color: colors.text, fontFamily: 'Fredoka_700Bold', fontSize: 26 },
  metricLabel: { color: colors.muted, fontFamily: 'Nunito_600SemiBold', fontSize: 12 },
  sectionTitle: { color: colors.text, fontFamily: 'Fredoka_700Bold', fontSize: 16 },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  rowText: { color: colors.text, flex: 1, fontFamily: 'Nunito_600SemiBold', fontSize: 13 },
  rowValue: { color: colors.primary, fontFamily: 'Nunito_800ExtraBold', fontSize: 13 },
  muted: { color: colors.muted, fontFamily: 'Nunito_600SemiBold', fontSize: 13 },
  addLink: { color: colors.primary, fontFamily: 'Nunito_800ExtraBold', fontSize: 13 },
  actionDelete: { color: '#DC2626', fontFamily: 'Nunito_800ExtraBold', fontSize: 13 },
  overlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(15,23,42,0.55)',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    padding: 20,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  modal: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 4,
    maxWidth: 440,
    padding: 18,
    width: '100%',
  },
  modalTitle: {
    color: colors.text,
    fontFamily: 'Fredoka_700Bold',
    fontSize: 18,
    marginBottom: 12,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  fieldLabel: {
    color: colors.muted,
    fontFamily: 'Nunito_700Bold',
    fontSize: 12,
    marginBottom: 4,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 2,
    color: colors.text,
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  inputMultiline: { height: 70, textAlignVertical: 'top' },
  optionRow: { alignItems: 'center', flexDirection: 'row', gap: 8, marginBottom: 8 },
  radio: { fontSize: 18 },
});
