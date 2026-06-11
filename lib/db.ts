import { promises as fs } from "fs";
import path from "path";
import {
  type Assignment,
  type AssignmentDTO,
  assignmentFromDTO,
  assignmentToDTO,
} from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const ASSIGNMENTS_FILE = path.join(DATA_DIR, "assignments.json");
const UPLOADS_DIR = path.join(process.cwd(), "uploads", "lectures");
const NOTES_DIR = path.join(process.cwd(), "uploads", "notes");
const QUIZ_DIR = path.join(process.cwd(), "data", "quizzes");

async function ensureDataFile(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(ASSIGNMENTS_FILE);
  } catch {
    await fs.writeFile(ASSIGNMENTS_FILE, "[]", "utf-8");
  }
}

async function readAssignmentsDTO(): Promise<AssignmentDTO[]> {
  await ensureDataFile();
  const raw = await fs.readFile(ASSIGNMENTS_FILE, "utf-8");
  return JSON.parse(raw) as AssignmentDTO[];
}

async function writeAssignmentsDTO(assignments: AssignmentDTO[]): Promise<void> {
  await ensureDataFile();
  await fs.writeFile(ASSIGNMENTS_FILE, JSON.stringify(assignments, null, 2), "utf-8");
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
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  const paths: string[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_") || `lecture-${i}.pdf`;
    const filename = `${assignmentId}-${i}-${safeName}`;
    const filepath = path.join(UPLOADS_DIR, filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filepath, buffer);
    paths.push(`uploads/lectures/${filename}`);
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
  await fs.mkdir(NOTES_DIR, { recursive: true });
  const ext = path.extname(file.name) || ".txt";
  const filename = `${assignmentId}-${taskId}-${Date.now()}${ext}`;
  const filepath = path.join(NOTES_DIR, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(filepath, buffer);
  return `uploads/notes/${filename}`;
}

export async function readPdfBase64(relativePath: string): Promise<string> {
  const filepath = path.join(process.cwd(), relativePath);
  const buffer = await fs.readFile(filepath);
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
  await fs.mkdir(QUIZ_DIR, { recursive: true });
  const filepath = path.join(QUIZ_DIR, `${assignmentId}-${taskId}.json`);
  await fs.writeFile(
    filepath,
    JSON.stringify({ assignmentId, taskId, questions, createdAt: new Date().toISOString() }, null, 2),
    "utf-8"
  );
}

export async function getQuizSession(
  assignmentId: number,
  taskId: number
): Promise<{ questions: { id: number; question: string; options: string[]; correctIndex: number }[] } | null> {
  const filepath = path.join(QUIZ_DIR, `${assignmentId}-${taskId}.json`);
  try {
    const raw = await fs.readFile(filepath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
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
