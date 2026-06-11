import path from "path";
import {
  deleteObject,
  readBytes,
  readJson,
  writeBytes,
  writeJson,
} from "./storage";
import {
  type Assignment,
  type AssignmentDTO,
  assignmentFromDTO,
  assignmentToDTO,
} from "./types";

const ASSIGNMENTS_KEY = "data/assignments.json";

async function ensureDataFile(): Promise<void> {
  const assignments = await readJson<AssignmentDTO[] | null>(ASSIGNMENTS_KEY, null);
  if (assignments === null) {
    await writeJson(ASSIGNMENTS_KEY, []);
  }
}

async function readAssignmentsDTO(): Promise<AssignmentDTO[]> {
  await ensureDataFile();
  return readJson(ASSIGNMENTS_KEY, []);
}

async function writeAssignmentsDTO(assignments: AssignmentDTO[]): Promise<void> {
  await ensureDataFile();
  await writeJson(ASSIGNMENTS_KEY, assignments);
}

export async function getAllAssignments(): Promise<Assignment[]> {
  const dtos = await readAssignmentsDTO();
  return dtos.map(assignmentFromDTO);
}

export async function getAssignmentById(id: number): Promise<Assignment | null> {
  const assignments = await getAllAssignments();
  return assignments.find((a) => a.id === id) ?? null;
}

export async function saveAssignment(assignment: Assignment): Promise<Assignment> {
  const dtos = await readAssignmentsDTO();
  dtos.push(assignmentToDTO(assignment));
  await writeAssignmentsDTO(dtos);
  return assignment;
}

export async function updateAssignment(assignment: Assignment): Promise<Assignment> {
  const dtos = await readAssignmentsDTO();
  const index = dtos.findIndex((a) => a.id === assignment.id);
  if (index === -1) throw new Error("Assignment not found");
  dtos[index] = assignmentToDTO(assignment);
  await writeAssignmentsDTO(dtos);
  return assignment;
}

export async function deleteAssignmentById(id: number): Promise<boolean> {
  const dtos = await readAssignmentsDTO();
  const index = dtos.findIndex((a) => a.id === id);
  if (index === -1) return false;
  dtos.splice(index, 1);
  await writeAssignmentsDTO(dtos);
  return true;
}

export async function saveLecturePdfs(
  assignmentId: number,
  files: File[]
): Promise<string[]> {
  const paths: string[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_") || `lecture-${i}.pdf`;
    const filename = `${assignmentId}-${i}-${safeName}`;
    const key = `uploads/lectures/${filename}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeBytes(key, buffer);
    paths.push(key);
  }

  return paths;
}

/** @deprecated use saveLecturePdfs */
export async function saveLecturePdf(assignmentId: number, file: File): Promise<string> {
  const paths = await saveLecturePdfs(assignmentId, [file]);
  return paths[0];
}

export async function saveNoteFile(
  assignmentId: number,
  taskId: number,
  file: File
): Promise<string> {
  const ext = path.extname(file.name) || ".txt";
  const filename = `${assignmentId}-${taskId}-${Date.now()}${ext}`;
  const key = `uploads/notes/${filename}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeBytes(key, buffer);
  return key;
}

export async function readPdfBase64(relativePath: string): Promise<string> {
  const buffer = await readBytes(relativePath);
  if (!buffer) throw new Error(`File not found: ${relativePath}`);
  return buffer.toString("base64");
}

export async function readPdfsBase64(relativePaths: string[]): Promise<string[]> {
  return Promise.all(relativePaths.map((p) => readPdfBase64(p)));
}

export async function saveQuizSession(
  assignmentId: number,
  taskId: number,
  questions: unknown
): Promise<void> {
  const key = `data/quizzes/${assignmentId}-${taskId}.json`;
  await writeJson(key, {
    assignmentId,
    taskId,
    questions,
    createdAt: new Date().toISOString(),
  });
}

export async function getQuizSession(
  assignmentId: number,
  taskId: number
): Promise<{ questions: { id: number; question: string; options: string[]; correctIndex: number }[] } | null> {
  const key = `data/quizzes/${assignmentId}-${taskId}.json`;
  return readJson(key, null);
}

export function sumAtRiskPoints(assignments: Assignment[]): number {
  return assignments.reduce(
    (sum, a) =>
      sum +
      a.tasks
        .filter((t) => t.status === "active" || t.status === "upcoming")
        .reduce((s, t) => s + t.pointsDeposited, 0),
    0
  );
}

export function sumDepositedPoints(assignments: Assignment[]): number {
  return assignments.reduce(
    (sum, a) =>
      sum +
      a.tasks
        .filter((t) => t.status !== "completed" && t.status !== "forfeited")
        .reduce((s, t) => s + t.pointsDeposited, 0),
    0
  );
}
