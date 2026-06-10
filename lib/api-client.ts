import {
  type Assignment,
  type AssignmentDTO,
  assignmentFromDTO,
} from "./types";

export async function getAssignments(): Promise<Assignment[]> {
  const res = await fetch("/api/assignments", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch assignments");
  const dtos: AssignmentDTO[] = await res.json();
  return dtos.map(assignmentFromDTO);
}

export async function getAssignment(id: number): Promise<Assignment | null> {
  const res = await fetch(`/api/assignments/${id}`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch assignment");
  const dto: AssignmentDTO = await res.json();
  return assignmentFromDTO(dto);
}

export async function createAssignment(formData: FormData): Promise<Assignment> {
  const res = await fetch("/api/assignments", {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to create assignment");
  }
  const dto: AssignmentDTO = await res.json();
  return assignmentFromDTO(dto);
}

export interface WalletStats {
  totalBalance: number;
  deposited: number;
  atRisk: number;
  lost: number;
  reclaimed: number;
  recentTransactions: {
    id: number;
    type: "deposit" | "reclaim" | "loss";
    task: string;
    amount: number;
    date: string;
  }[];
}

export async function getWalletStats(): Promise<WalletStats> {
  const res = await fetch("/api/wallet", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch wallet");
  return res.json();
}

export interface QuizQuestionClient {
  id: number;
  question: string;
  options: string[];
}

export async function generateQuiz(
  assignmentId: number,
  taskId: number
): Promise<{ questions: QuizQuestionClient[] }> {
  const res = await fetch(`/api/assignments/${assignmentId}/tasks/${taskId}/quiz`, {
    method: "POST",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to generate quiz");
  }
  return res.json();
}

export async function completeTaskRequest(
  assignmentId: number,
  taskId: number,
  notes: File[],
  answers: number[]
): Promise<{ success: boolean; pointsReclaimed: number; correct: number }> {
  const formData = new FormData();
  formData.set("answers", JSON.stringify(answers));
  notes.forEach((file) => formData.append("notes", file));

  const res = await fetch(
    `/api/assignments/${assignmentId}/tasks/${taskId}/complete`,
    { method: "POST", body: formData }
  );

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to complete task");
  return data;
}
