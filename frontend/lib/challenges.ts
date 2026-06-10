export type Challenge = {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  icon: string;
  category: 'streak' | 'alphabet' | 'practice' | 'mastery';
};

export type ChallengeContext = {
  streakDays: number;
  lettersLearned: number;
  lessonsCompletedToday: number;
  cameraPasses: number;
};

export type ChallengeProgress = Challenge & {
  progress: number;
  target: number;
  completed: boolean;
  claimed: boolean;
};