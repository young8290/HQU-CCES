// Score category rules: limits and editability
// editableBy: 'all' = everyone can edit, 'admin' = admin only, 'none' = computed/readonly
export const SCORE_CATEGORIES = {
  moral: { label: '德育测评', maxValue: 100, editable: true, editableBy: 'all' as const },
  academic: { label: '学业学术素质', maxValue: 60, editable: true, editableBy: 'admin' as const },
  innovation: { label: '创新与实践能力', maxValue: 13, editable: true, editableBy: 'all' as const },
  sports_base: { label: '体育基础分', maxValue: null, editable: true, editableBy: 'admin' as const },
  sports_reward: { label: '体育奖励分', maxValue: 3, editable: true, editableBy: 'all' as const },
  sports_total: { label: '体育总分', maxValue: 7, editable: false, editableBy: 'none' as const },
  aesthetics: { label: '美育', maxValue: 6, editable: true, editableBy: 'all' as const },
  labor: { label: '劳动教育', maxValue: 4, editable: true, editableBy: 'all' as const },
  public_service: { label: '公益服务与社会工作', maxValue: 10, editable: true, editableBy: 'all' as const },
  bonus: { label: '附加分', maxValue: 5, editable: true, editableBy: 'all' as const },
  total: { label: '总分', maxValue: null, editable: false, editableBy: 'none' as const },
} as const;

export type ScoreCategory = keyof typeof SCORE_CATEGORIES;

export const EDITABLE_CATEGORIES: ScoreCategory[] = Object.entries(SCORE_CATEGORIES)
  .filter(([, v]) => v.editable)
  .map(([k]) => k as ScoreCategory);

export const ALL_CATEGORIES: ScoreCategory[] = Object.keys(SCORE_CATEGORIES) as ScoreCategory[];

export function validateScoreValue(category: ScoreCategory, value: number): string | null {
  if (isNaN(value)) return `${SCORE_CATEGORIES[category].label}必须为有效数字`;
  if (value < 0) return `${SCORE_CATEGORIES[category].label}不能为负数`;
  const max = SCORE_CATEGORIES[category].maxValue;
  if (max !== null && value > max) {
    return `${SCORE_CATEGORIES[category].label}不能超过${max}`;
  }
  return null;
}

export function calculateSportsTotal(sportsBase: number, sportsReward: number): number {
  return Math.round((sportsBase + sportsReward) * 100) / 100;
}

export function calculateTotal(scores: Record<string, number>): number {
  // 总分不包含德育测评(moral)
  const total = (scores.academic || 0)
    + (scores.innovation || 0)
    + (scores.sports_total || 0)
    + (scores.aesthetics || 0)
    + (scores.labor || 0)
    + (scores.public_service || 0)
    + (scores.bonus || 0);
  return Math.round(total * 100) / 100;
}
