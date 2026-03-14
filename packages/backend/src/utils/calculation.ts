import { type ScoreCategory, calculateSportsTotal, calculateTotal } from '../config/scoreRules.js';

export function calculateAcademicScore(gpa: number): number {
  return Math.round((gpa + 2.5) * 8 * 100) / 100;
}

export function calculateSportsBaseScore(rawBase: number): number {
  return Math.round(rawBase * 0.04 * 100) / 100;
}

export function recalculateDerived(scores: Record<string, number>): Record<string, number> {
  const result = { ...scores };
  result.sports_total = calculateSportsTotal(result.sports_base || 0, result.sports_reward || 0);
  result.total = calculateTotal(result);
  return result;
}
