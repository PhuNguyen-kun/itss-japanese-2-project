import { promises as fs } from "fs";
import path from "path";
import type { Assignment } from "./types";
import { calculateAssignmentRefund, calculateForfeitedPoints } from "./assignmentUtils";
import { deleteAssignmentById, getAssignmentById } from "./db";
import { refundPoints } from "./wallet";

const UPLOADS_LECTURES = path.join(process.cwd(), "uploads", "lectures");
const UPLOADS_NOTES = path.join(process.cwd(), "uploads", "notes");
const PROGRESS_DIR = path.join(process.cwd(), "data", "task-progress");
const QUIZ_DIR = path.join(process.cwd(), "data", "quizzes");

async function removeMatchingFiles(dir: string, prefix: string): Promise<void> {
  try {
    const files = await fs.readdir(dir);
    await Promise.all(
      files
        .filter((f) => f.startsWith(prefix))
        .map((f) => fs.unlink(path.join(dir, f)).catch(() => {}))
    );
  } catch {
    // directory may not exist
  }
}

async function cleanupAssignmentFiles(assignment: Assignment): Promise<void> {
  await removeMatchingFiles(UPLOADS_LECTURES, `${assignment.id}-`);

  for (const task of assignment.tasks) {
    const progressFile = path.join(PROGRESS_DIR, `${assignment.id}-${task.id}.json`);
    const quizFile = path.join(QUIZ_DIR, `${assignment.id}-${task.id}.json`);
    await fs.unlink(progressFile).catch(() => {});
    await fs.unlink(quizFile).catch(() => {});
  }

  await removeMatchingFiles(UPLOADS_NOTES, `${assignment.id}-`);
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
