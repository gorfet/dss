import type {
  CategoryScore,
  EvaluationAggregateInput,
  EvaluationAggregateResult,
  EvaluatorGroupWeight,
} from '../types';

const MAX_LIKERT_SCORE = 5;
const MIN_LIKERT_SCORE = 1;

const normalizeLikertScore = (score: number): number => {
  const boundedScore = Math.min(Math.max(score, MIN_LIKERT_SCORE), MAX_LIKERT_SCORE);
  return ((boundedScore - MIN_LIKERT_SCORE) / (MAX_LIKERT_SCORE - MIN_LIKERT_SCORE)) * 100;
};

const validateWeights = (weights: EvaluatorGroupWeight[]): void => {
  const total = weights.reduce((sum, weight) => sum + weight.weightPercent, 0);
  if (Math.round(total * 100) / 100 !== 100) {
    throw new Error('Evaluator weights must total 100%.');
  }
};

const validateScoreRange = (score: number): void => {
  if (Number.isNaN(score)) {
    throw new Error('Scores must be numeric.');
  }
};

export const aggregateEvaluationScores = (
  input: EvaluationAggregateInput,
): EvaluationAggregateResult => {
  validateWeights(input.weights);

  const normalizedScores = input.categoryScores.map((score) => {
    validateScoreRange(score.rawScore);
    return {
      ...score,
      normalizedScore: normalizeLikertScore(score.rawScore),
    };
  });

  const weightedByGroup = normalizedScores.reduce((acc, score) => {
    const groupWeight = input.weights.find((weight) => weight.evaluatorGroupId === score.evaluatorGroupId);
    if (!groupWeight) {
      throw new Error(`Missing weight for evaluator group ${score.evaluatorGroupId}.`);
    }
    const weightedScore = (score.normalizedScore * groupWeight.weightPercent) / 100;
    return acc + weightedScore;
  }, 0);

  return {
    categoryScores: normalizedScores,
    overallScore: Math.round(weightedByGroup * 100) / 100,
  };
};

export const aggregateCategoryScores = (scores: CategoryScore[]): Record<string, number> => {
  const totals = new Map<string, { sum: number; count: number }>();

  scores.forEach((score) => {
    validateScoreRange(score.rawScore);
    const normalizedScore = normalizeLikertScore(score.rawScore);
    const existing = totals.get(score.categoryKey) ?? { sum: 0, count: 0 };
    totals.set(score.categoryKey, {
      sum: existing.sum + normalizedScore,
      count: existing.count + 1,
    });
  });

  return Array.from(totals.entries()).reduce<Record<string, number>>((acc, [key, value]) => {
    acc[key] = Math.round((value.sum / value.count) * 100) / 100;
    return acc;
  }, {});
};
