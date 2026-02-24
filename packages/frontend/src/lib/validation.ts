// Score validation rules matching the backend
// editableBy: 'all' = everyone can edit, 'admin' = admin only, 'none' = computed/readonly
export const SCORE_RULES: Record<string, { label: string; max: number | null; editable: boolean; editableBy: 'all' | 'admin' | 'none' }> = {
  moral: { label: '德育测评', max: 100, editable: true, editableBy: 'all' },
  academic: { label: '学业学术素质', max: 60, editable: true, editableBy: 'admin' },
  innovation: { label: '创新与实践能力', max: 13, editable: true, editableBy: 'all' },
  sports_base: { label: '体育基础分', max: null, editable: true, editableBy: 'admin' },
  sports_reward: { label: '体育奖励分', max: 3, editable: true, editableBy: 'all' },
  sports_total: { label: '体育总分', max: 7, editable: false, editableBy: 'none' },
  aesthetics: { label: '美育', max: 6, editable: true, editableBy: 'all' },
  labor: { label: '劳动教育', max: 4, editable: true, editableBy: 'all' },
  public_service: { label: '公益服务与社会工作', max: 10, editable: true, editableBy: 'all' },
  bonus: { label: '附加分', max: 5, editable: true, editableBy: 'all' },
  total: { label: '总分', max: null, editable: false, editableBy: 'none' },
};

// Check if a category is editable for a given role
export function isCategoryEditable(category: string, role: string): boolean {
  const rule = SCORE_RULES[category];
  if (!rule) return false;
  if (rule.editableBy === 'none') return false;
  if (rule.editableBy === 'admin') return role === 'admin';
  return true; // 'all'
}

export const SCORE_CATEGORIES_ORDER = [
  'moral', 'academic', 'innovation', 'sports_base', 'sports_reward',
  'sports_total', 'aesthetics', 'labor', 'public_service', 'bonus', 'total',
];

export function validateScore(category: string, value: number): string | null {
  const rule = SCORE_RULES[category];
  if (!rule) return '未知分数类别';
  if (isNaN(value)) return `${rule.label}必须为有效数字`;
  if (value < 0) return `${rule.label}不能为负数`;
  if (rule.max !== null && value > rule.max) return `${rule.label}不能超过${rule.max}`;
  return null;
}
