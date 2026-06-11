import { apiRequest } from '@/lib/api/client';

export type UserGrowthPoint = {
  date: string;
  totalUsers: number;
  proUsers: number;
};

export type AdminMetrics = {
  totalUsers: number;
  newSignups7d: number;
  newSignups30d: number;
  activeUsers7d: number;
  totalLessonsCompleted: number;
  proSubscribers: number;
  freeUsers: number;
  proConversionRate: number;
  userGrowth: UserGrowthPoint[];
  lessonCompletions: { lessonId: string; title: string; completions: number }[];
  hardestQuizzes: {
    exerciseId: string;
    signWord: string;
    attempts: number;
    failRate: number;
  }[];
};

export type AdminOption = { value: string; isCorrect: boolean };

export type AdminExercise = {
  id: string;
  type: 'demo' | 'quiz' | 'camera';
  signWord: string;
  signDescription: string;
  contentType: 'letter' | 'name' | null;
  imageUrl: string | null;
  options: AdminOption[];
};

export type AdminLesson = {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  youtubeId: string | null;
  exercises: AdminExercise[];
};

export type AdminUnit = {
  id: string;
  title: string;
  description: string;
  lessons: AdminLesson[];
};

export function fetchAdminMetrics(): Promise<AdminMetrics> {
  return apiRequest<AdminMetrics>('/admin/metrics/overview');
}

export async function fetchAdminCurriculum(): Promise<AdminUnit[]> {
  const data = await apiRequest<{ units: AdminUnit[] }>('/admin/curriculum');
  return data.units;
}

// Units
export function createUnit(body: { title: string; description: string }) {
  return apiRequest('/admin/units', { method: 'POST', body });
}
export function updateUnit(id: string, body: { title: string; description: string }) {
  return apiRequest(`/admin/units/${id}`, { method: 'PATCH', body });
}
export function deleteUnit(id: string) {
  return apiRequest(`/admin/units/${id}`, { method: 'DELETE' });
}
export function reorderUnits(orderedIds: string[]) {
  return apiRequest('/admin/units/reorder', { method: 'POST', body: { orderedIds } });
}

// Lessons
export type LessonBody = {
  title: string;
  description: string;
  xpReward: number;
  youtubeId: string | null;
};
export function createLesson(body: LessonBody & { unitId: string }) {
  return apiRequest('/admin/lessons', { method: 'POST', body });
}
export function updateLesson(id: string, body: LessonBody) {
  return apiRequest(`/admin/lessons/${id}`, { method: 'PATCH', body });
}
export function deleteLesson(id: string) {
  return apiRequest(`/admin/lessons/${id}`, { method: 'DELETE' });
}
export function reorderLessons(unitId: string, orderedIds: string[]) {
  return apiRequest(`/admin/units/${unitId}/lessons/reorder`, {
    method: 'POST',
    body: { orderedIds },
  });
}

// Exercises
export type ExerciseBody = {
  type: 'demo' | 'quiz' | 'camera';
  signWord: string;
  signDescription: string;
  contentType: 'letter' | 'name' | null;
  imageUrl: string | null;
};
export function createExercise(body: ExerciseBody & { lessonId: string }) {
  return apiRequest('/admin/exercises', { method: 'POST', body });
}
export function updateExercise(id: string, body: ExerciseBody) {
  return apiRequest(`/admin/exercises/${id}`, { method: 'PATCH', body });
}
export function deleteExercise(id: string) {
  return apiRequest(`/admin/exercises/${id}`, { method: 'DELETE' });
}
export function reorderExercises(lessonId: string, orderedIds: string[]) {
  return apiRequest(`/admin/lessons/${lessonId}/exercises/reorder`, {
    method: 'POST',
    body: { orderedIds },
  });
}
export function setExerciseOptions(id: string, options: AdminOption[]) {
  return apiRequest(`/admin/exercises/${id}/options`, {
    method: 'PUT',
    body: { options },
  });
}
