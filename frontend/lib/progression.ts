import type { ImageSourcePropType } from "react-native";
import { level_rewards } from "@/lib/levels";

export type LevelTier = {
  level: number;
  title: string;
  minXp: number;
  medal: ImageSourcePropType;
  medalLabel: string;
};

export const levelTiers: LevelTier[] = [
  {
    level: 1,
    title: 'Newbie',
    minXp: 0,
    medal: level_rewards.Newbie,
    medalLabel: 'Bronze starter',
  },
  {
    level: 2,
    title: 'Beginner',
    minXp: 50,
    medal: level_rewards.Beginner,
    medalLabel: 'Silver beginner',
  },
  {
    level: 3,
    title: 'Apprentice',
    minXp: 150,
    medal: level_rewards.Apprentice,
    medalLabel: 'Gold apprentice',
  },
  {
    level: 4,
    title: 'Explorer',
    minXp: 300,
    medal: level_rewards.Explorer,
    medalLabel: 'Explorer medal',
  },
  {
    level: 5,
    title: 'Scholar',
    minXp: 500,
    medal: level_rewards.Scholar,
    medalLabel: 'Scholar medal',
  },
  {
    level: 6,
    title: 'Adept',
    minXp: 800,
    medal: level_rewards.Adept,
    medalLabel: 'Adept star',
  },
  {
    level: 7,
    title: 'Expert',
    minXp: 1200,
    medal: level_rewards.Expert,
    medalLabel: 'Expert gem',
  },
  {
    level: 8,
    title: 'Master',
    minXp: 1800,
    medal: level_rewards.Master,
    medalLabel: 'Master crown',
  },
  {
    level: 9,
    title: 'Grandmaster',
    minXp: 2500,
    medal: level_rewards.Grandmaster,
    medalLabel: 'Grandmaster flame',
  },
  {
    level: 10,
    title: 'Legend',
    minXp: 3500,
    medal: level_rewards.Legend,
    medalLabel: 'Legend star',
  },
];

export type LevelProgress = {
  current: LevelTier;
  next: LevelTier | null;
  totalXp: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  progressPercent: number;
};

export function isLevelUnlocked(level: number, totalXp: number): boolean {
  const tier = levelTiers.find((t) => t.level === level);
  return tier ? totalXp >= tier.minXp : false;
}
