import type { Assignment } from "./types";

/** Points from tasks not yet forfeited or reclaimed (completed) */
export function calculateAssignmentRefund(assignment: Assignment): number {
  return assignment.tasks
    .filter((t) => t.status !== "forfeited" && t.status !== "completed")
    .reduce((sum, t) => sum + t.pointsDeposited, 0);
}

export function calculateForfeitedPoints(assignment: Assignment): number {
  return assignment.tasks
    .filter((t) => t.status === "forfeited")
    .reduce((sum, t) => sum + t.pointsDeposited, 0);
}
