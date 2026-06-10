/** Map subject difficulty 1–5 to expected milestone count for Gemini / preview */
export function difficultyToMilestoneCount(difficulty: number): number {
  const map: Record<number, number> = { 1: 3, 2: 4, 3: 5, 4: 6, 5: 8 };
  return map[Math.min(5, Math.max(1, Math.round(difficulty)))] ?? 5;
}

/** Distribute total deposit across milestones with progressively increasing weights */
export function distributePoints(totalDeposit: number, milestoneCount: number): number[] {
  if (milestoneCount <= 0) return [];
  if (milestoneCount === 1) return [totalDeposit];

  const weights = Array.from({ length: milestoneCount }, (_, i) => Math.pow(i + 1, 1.4));
  const weightSum = weights.reduce((a, b) => a + b, 0);

  const points = weights.map((w) => Math.floor((totalDeposit * w) / weightSum));
  const allocated = points.reduce((a, b) => a + b, 0);
  points[points.length - 1] += totalDeposit - allocated;

  return points;
}

/** Schedule milestone deadlines between now and final deadline */
export function scheduleDeadlines(
  milestoneCount: number,
  finalDeadline: Date,
  from: Date = new Date()
): Date[] {
  const timeUntil = finalDeadline.getTime() - from.getTime();
  return Array.from({ length: milestoneCount }, (_, index) => {
    const factor = Math.pow((index + 1) / milestoneCount, 0.8);
    return new Date(from.getTime() + timeUntil * factor);
  });
}
