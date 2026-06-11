import { apiRequest } from '@/lib/api/client';
import type {
  CompleteLessonResponse,
  ExerciseAttemptResponse,
} from '@/lib/api/types';

export async function attemptExercise(
  lessonId: string,
  exerciseId: string,
  answer: string,
): Promise<ExerciseAttemptResponse> {
  return apiRequest<ExerciseAttemptResponse>(
    `/lessons/${lessonId}/exercises/${exerciseId}/attempt`,
    { method: 'POST', body: { answer } },
  );
}

export async function skipCameraExercise(
  lessonId: string,
  exerciseId: string,
): Promise<{ skipped: boolean }> {
  return apiRequest<{ skipped: boolean }>(
    `/lessons/${lessonId}/exercises/${exerciseId}/skip`,
    { method: 'POST', body: {} },
  );
}

export async function completeLesson(
  lessonId: string,
): Promise<CompleteLessonResponse> {
  return apiRequest<CompleteLessonResponse>(`/lessons/${lessonId}/complete`, {
    method: 'POST',
    body: {},
  });
}