import { readJson, writeJson } from "./storage";

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

function progressKey(assignmentId: number, taskId: number): string {
  return `data/task-progress/${assignmentId}-${taskId}.json`;
}

export async function getTaskProgress(
  assignmentId: number,
  taskId: number
): Promise<TaskProgress> {
  const progress = await readJson<TaskProgress | null>(
    progressKey(assignmentId, taskId),
    null
  );
  if (progress) return progress;

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

export async function saveTaskProgress(progress: TaskProgress): Promise<void> {
  progress.updatedAt = new Date().toISOString();
  await writeJson(progressKey(progress.assignmentId, progress.taskId), progress);
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
