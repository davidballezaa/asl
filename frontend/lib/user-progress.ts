export type UserProgress = {
  completedLessonIds: string[];
  lessonXp: number;
  lessonsCompletedToday: number;
  claimedChallengeIds: string[];
  hearts: number;
};

export function getActiveLessonId(
  completedLessonIds: string[],
  allLessonIds: string[],
): string {
  for (const id of allLessonIds) {
    if (!completedLessonIds.includes(id)) {
      return id;
    }
  }
  return allLessonIds[allLessonIds.length - 1] ?? 'lesson-1';
}

export function isLessonCompleted(
  lessonId: string,
  completedLessonIds: string[],
): boolean {
  return completedLessonIds.includes(lessonId);
}

export function isLessonLocked(
  lessonId: string,
  completedLessonIds: string[],
  allLessonIds: string[],
): boolean {
  const index = allLessonIds.indexOf(lessonId);
  if (index <= 0) return false;
  const previousId = allLessonIds[index - 1];
  return !completedLessonIds.includes(previousId);
}
