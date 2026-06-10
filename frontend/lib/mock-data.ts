export type ContentType = 'letter' | 'name';

export type ExerciseType = 'demo' | 'camera' | 'quiz';

export type Exercise = {
  id: string;
  type: ExerciseType;
  signWord: string;
  signDescription: string;
  contentType?: ContentType;
  options?: string[];
  correctAnswer?: string;
};

export type Lesson = {
  id: string;
  title: string;
  description: string;
  exercises: Exercise[];
  xpReward: number;
  youtubeId?: string;
};

export type Unit = {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
};

export function getAllLessonIdsInOrder(units: Unit[]): string[] {
  return units.flatMap((unit) => unit.lessons.map((l) => l.id));
}

export function getAllLessons(units: Unit[]): Lesson[] {
  return units.flatMap((unit) => unit.lessons);
}