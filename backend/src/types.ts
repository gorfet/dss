export type EvaluatorGroupKey =
  | 'students'
  | 'peers'
  | 'department_head'
  | 'self'
  | 'alumni';

export type QuestionType = 'likert' | 'multiple_choice' | 'short_text' | 'long_text';

export interface EvaluatorGroupWeight {
  evaluatorGroupId: number;
  evaluatorGroupKey: EvaluatorGroupKey;
  weightPercent: number;
}

export interface CategoryScore {
  categoryKey: string;
  evaluatorGroupId: number;
  rawScore: number;
  normalizedScore: number;
}

export interface EvaluationAggregateInput {
  categoryScores: CategoryScore[];
  weights: EvaluatorGroupWeight[];
}

export interface EvaluationAggregateResult {
  categoryScores: CategoryScore[];
  overallScore: number;
}
