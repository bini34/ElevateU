import type { StreakDay } from '../ui/StreakCard';

// Explicit presentation fixtures. Never import these into product pages.
export const sampleDays: StreakDay[] = ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((label, index) => ({
  date: `2026-09-${14 + index}`, label, status: index < 5 ? 'completed' : index === 5 ? 'missed' : 'upcoming', today: index === 6,
}));
