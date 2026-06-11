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

export async function deleteAssignment(
  id: number
): Promise<{ success: boolean; refundedPoints: number; forfeitedPointsKept: number }> {
  const res = await fetch(`/api/assignments/${id}`, { method: "DELETE" });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to delete assignment");
  return data;
}

export interface WalletStats {
  totalBalance: number;
  deposited: number;
  atRisk: number;
  lost: number;
  reclaimed: number;
  recentTransactions: {
    id: number;
    type: "deposit" | "reclaim" | "loss" | "topup" | "refund";
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

export interface UploadedNoteClient {
  path: string;
  originalName: string;
  uploadedAt: string;
}

export interface QuizAttemptClient {
  submittedAt: string;
  answers: number[];
  correct: number;
  passed: boolean;
  notePaths: string[];
}

export interface TaskProgressClient {
  assignmentId: number;
  taskId: number;
  notes: UploadedNoteClient[];
  quiz: {
    questions: QuizQuestionClient[];
    answers: number[];
    generatedAt: string;
  } | null;
  history: QuizAttemptClient[];
  completedAt: string | null;
}

export async function getTaskProgress(
  assignmentId: number,
  taskId: number
): Promise<TaskProgressClient> {
  const res = await fetch(
    `/api/assignments/${assignmentId}/tasks/${taskId}/progress`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error("Failed to load progress");
  return res.json();
}

export async function uploadTaskNotes(
  assignmentId: number,
  taskId: number,
  files: File[]
): Promise<TaskProgressClient> {
  const formData = new FormData();
  files.forEach((f) => formData.append("notes", f));
  const res = await fetch(
    `/api/assignments/${assignmentId}/tasks/${taskId}/notes`,
    { method: "POST", body: formData }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Upload failed");
  }
  return res.json();
}

export async function saveQuizAnswers(
  assignmentId: number,
  taskId: number,
  answers: number[]
): Promise<void> {
  const res = await fetch(
    `/api/assignments/${assignmentId}/tasks/${taskId}/progress`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    }
  );
  if (!res.ok) throw new Error("Failed to save answers");
}

export async function generateQuiz(
  assignmentId: number,
  taskId: number,
  regenerate = false
): Promise<{ questions: QuizQuestionClient[]; answers: number[]; cached: boolean }> {
  const url = `/api/assignments/${assignmentId}/tasks/${taskId}/quiz${
    regenerate ? "?regenerate=true" : ""
  }`;
  const res = await fetch(url, { method: "POST" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to generate quiz");
  }
  return res.json();
}

export async function completeTaskRequest(
  assignmentId: number,
  taskId: number,
  answers: number[]
): Promise<{ success: boolean; pointsReclaimed: number; correct: number }> {
  const res = await fetch(
    `/api/assignments/${assignmentId}/tasks/${taskId}/complete`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    }
  );

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to complete task");
  return data;
}

export interface SepayCheckoutResult {
  checkoutUrl: string;
  formFields: Record<string, string | number>;
  orderId: string;
}

export interface BillingConfig {
  sepay: { enabled: boolean; vndPerPoint: number };
  plans: { id: string; points: number; amountVnd: number }[];
}

export interface PaymentOrderStatus {
  orderInvoiceNumber: string;
  status: "PENDING" | "PAID" | "CANCELLED" | "FAILED";
  points: number;
  amountVnd: number;
  paidAt: string | null;
}

export async function getBillingConfig(): Promise<BillingConfig> {
  const res = await fetch("/api/billing/config", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load billing config");
  return res.json();
}

export async function createSepayCheckout(planId: string): Promise<SepayCheckoutResult> {
  const res = await fetch("/api/billing/sepay/create-checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ planId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to create checkout");
  return data;
}

export async function getPaymentOrderStatus(
  orderInvoiceNumber: string
): Promise<PaymentOrderStatus> {
  const res = await fetch(
    `/api/billing/orders/${encodeURIComponent(orderInvoiceNumber)}`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error("Failed to load order status");
  return res.json();
}

/** Query SePay API and fulfill order when IPN has not arrived (e.g. localhost dev) */
export async function syncPaymentOrder(
  orderInvoiceNumber: string
): Promise<PaymentOrderStatus & { syncResult: "paid" | "pending" }> {
  const res = await fetch(
    `/api/billing/orders/${encodeURIComponent(orderInvoiceNumber)}`,
    { method: "POST", cache: "no-store" }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to sync order");
  return data;
}
