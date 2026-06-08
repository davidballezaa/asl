import { apiRequest } from '@/lib/api/client';
import type { CurriculumResponse, LessonResponse } from '@/lib/api/types';

export async function fetchUnits(): Promise<CurriculumResponse> {
  return apiRequest<CurriculumResponse>('/curriculum/units');
}

export async function fetchLesson(lessonId: string): Promise<LessonResponse> {
  return apiRequest<LessonResponse>(`/lessons/${lessonId}`);
}
