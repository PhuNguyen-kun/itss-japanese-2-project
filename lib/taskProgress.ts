import { promises as fs } from "fs";
import path from "path";

const PROGRESS_DIR = path.join(process.cwd(), "data", "task-progress");

export interface UploadedNote {
  path: string;
  originalName: string;
  uploadedAt: string;
}

export interface QuizAttemptRecord {
  submittedAt: string;
  answers: number[];
  correct: number;
  passed: boolean;
  notePaths: string[];
}

export interface TaskProgress {
  assignmentId: number;
  taskId: number;
  notes: UploadedNote[];
  quiz: {
    questions: { id: number; question: string; options: string[] }[];
    answers: number[];
    generatedAt: string;
  } | null;
  history: QuizAttemptRecord[];
  completedAt: string | null;
  updatedAt: string;
}

function progressPath(assignmentId: number, taskId: number): string {
  return path.join(PROGRESS_DIR, `${assignmentId}-${taskId}.json`);
}

export async function getTaskProgress(
  assignmentId: number,
  taskId: number
): Promise<TaskProgress> {
  await fs.mkdir(PROGRESS_DIR, { recursive: true });
  try {
    const raw = await fs.readFile(progressPath(assignmentId, taskId), "utf-8");
    return JSON.parse(raw) as TaskProgress;
  } catch {
    return {
      assignmentId,
      taskId,
      notes: [],
      quiz: null,
      history: [],
      completedAt: null,
      updatedAt: new Date().toISOString(),
    };
  }
}

export async function saveTaskProgress(progress: TaskProgress): Promise<void> {
  await fs.mkdir(PROGRESS_DIR, { recursive: true });
  progress.updatedAt = new Date().toISOString();
  await fs.writeFile(
    progressPath(progress.assignmentId, progress.taskId),
    JSON.stringify(progress, null, 2),
    "utf-8"
  );
}

export async function addNoteToProgress(
  assignmentId: number,
  taskId: number,
  note: UploadedNote
): Promise<TaskProgress> {
  const progress = await getTaskProgress(assignmentId, taskId);
  progress.notes.push(note);
  await saveTaskProgress(progress);
  return progress;
}

export async function saveQuizToProgress(
  assignmentId: number,
  taskId: number,
  questions: { id: number; question: string; options: string[] }[]
): Promise<TaskProgress> {
  const progress = await getTaskProgress(assignmentId, taskId);
  progress.quiz = {
    questions,
    answers: new Array(questions.length).fill(-1),
    generatedAt: new Date().toISOString(),
  };
  await saveTaskProgress(progress);
  return progress;
}

export async function saveDraftAnswers(
  assignmentId: number,
  taskId: number,
  answers: number[]
): Promise<TaskProgress> {
  const progress = await getTaskProgress(assignmentId, taskId);
  if (!progress.quiz) throw new Error("No quiz session");
  progress.quiz.answers = answers;
  await saveTaskProgress(progress);
  return progress;
}

export async function recordQuizAttempt(
  assignmentId: number,
  taskId: number,
  attempt: QuizAttemptRecord,
  completed: boolean
): Promise<TaskProgress> {
  const progress = await getTaskProgress(assignmentId, taskId);
  progress.history.unshift(attempt);
  if (completed) {
    progress.completedAt = attempt.submittedAt;
  }
  await saveTaskProgress(progress);
  return progress;
}
