export type UserProfile = {
  name: string;
  username: string;
  initials: string;
  photoUrl?: string;
  practiceDays: string[];
};

export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function countPracticeDaysInMonth(
  practiceDays: string[],
  year: number,
  month: number,
): number {
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}-`;
  return practiceDays.filter((day) => day.startsWith(prefix)).length;
}

export function getCurrentStreak(practiceDays: string[]): number {
  if (practiceDays.length === 0) return 0;

  const sorted = [...practiceDays].sort().reverse();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = 0;
  let checkDate = new Date(today);

  for (let i = 0; i < 365; i++) {
    const key = toDateKey(checkDate);
    if (sorted.includes(key)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (i === 0) {
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}
