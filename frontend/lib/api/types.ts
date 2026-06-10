import type { ChallengeProgress } from '@/lib/challenges';
import type { Lesson, Unit } from '@/lib/mock-data';
import type { LevelProgress } from '@/lib/progression';
import type { UserProfile } from '@/lib/profile-data';
import type { UserProgress } from '@/lib/user-progress';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role?: 'user' | 'admin';
};

export type AuthResponse = {
  token: string;
  user: AuthUser;
};

export type GamificationState = {
  totalXp: number;
  level: LevelProgress;
  challenges: ChallengeProgress[];
  activeLessonId: string;
  streak: number;
  completedLessons: number;
  totalLessons: number;
};

export type MeResponse = {
  user: AuthUser;
  profile: UserProfile;
  progress: UserProgress;
  gamification: GamificationState;
  subscription: { plan: 'free' | 'pro' };
};

export type CurriculumResponse = {
  units: Unit[];
};

export type LessonResponse = {
  lesson: Lesson;
  unitId?: string;
};

export type ExerciseAttemptResponse = {
  correct: boolean;
  correctAnswer?: string;
};

export type CompleteLessonResponse = {
  xpEarned: number;
  totalXp: number;
  lessonXp: number;
  completedLessonIds: string[];
  lessonsCompletedToday: number;
  practiceDays: string[];
  activeLessonId: string;
  level: LevelProgress;
};

export type RecognitionResult = {
  success: boolean;
  confidence: number;
  predictedSign?: string | null;
  error?: string | null;
  cameraPasses?: number;
};

export type ClaimChallengeResponse = {
  challengeId: string;
  xpReward: number;
  totalXp: number;
  claimedChallengeIds: string[];
  level: LevelProgress;
};