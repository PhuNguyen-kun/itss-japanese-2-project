import type { Assignment } from "./types";
import { calculateAssignmentRefund, calculateForfeitedPoints } from "./assignmentUtils";
import { deleteAssignmentById, getAssignmentById } from "./db";
import { deleteByPrefix, deleteObject } from "./storage";
import { refundPoints } from "./wallet";

async function cleanupAssignmentFiles(assignment: Assignment): Promise<void> {
  await deleteByPrefix(`uploads/lectures/${assignment.id}-`);

  for (const task of assignment.tasks) {
    await deleteObject(`data/task-progress/${assignment.id}-${task.id}.json`);
    await deleteObject(`data/quizzes/${assignment.id}-${task.id}.json`);
  }

  await deleteByPrefix(`uploads/notes/${assignment.id}-`);
}

export async function deleteAssignmentWithRefund(assignmentId: number): Promise<{
  refundedPoints: number;
  forfeitedPointsKept: number;
}> {
  const assignment = await getAssignmentById(assignmentId);
  if (!assignment) {
    throw new Error("Assignment not found");
  }

  const refundedPoints = calculateAssignmentRefund(assignment);
  const forfeitedPointsKept = calculateForfeitedPoints(assignment);

  if (refundedPoints > 0) {
    await refundPoints(refundedPoints, `Xóa lộ trình: ${assignment.subject}`);
  }

  await cleanupAssignmentFiles(assignment);
  await deleteAssignmentById(assignmentId);

  return { refundedPoints, forfeitedPointsKept };
}
