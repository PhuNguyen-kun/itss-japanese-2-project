export type MilestoneStatus =
  | "locked"
  | "upcoming"
  | "active"
  | "completed"
  | "forfeited";

export interface Milestone {
  id: number;
  title: string;
  description: string;
  deadline: Date;
  pointsDeposited: number;
  status: MilestoneStatus;
  progress: number;
}

export interface Assignment {
  id: number;
  subject: string;
  title: string;
  finalDeadline: Date;
  difficulty: number;
  depositPoints: number;
  totalPoints: number;
  lecturePdfPath: string;
  tasks: Milestone[];
  createdAt: Date;
}

export interface MilestoneDTO {
  id: number;
  title: string;
  description: string;
  deadline: string;
  pointsDeposited: number;
  status: MilestoneStatus;
  progress: number;
}

export interface AssignmentDTO {
  id: number;
  subject: string;
  title: string;
  finalDeadline: string;
  difficulty: number;
  depositPoints: number;
  totalPoints: number;
  lecturePdfPath: string;
  tasks: MilestoneDTO[];
  createdAt: string;
}

export interface WalletTransaction {
  id: number;
  type: "deposit" | "reclaim" | "loss";
  task: string;
  amount: number;
  date: string;
}

export interface Wallet {
  balance: number;
  lost: number;
  reclaimed: number;
  transactions: WalletTransaction[];
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
}

export interface QuizSession {
  assignmentId: number;
  taskId: number;
  questions: QuizQuestion[];
  createdAt: string;
}

export function assignmentToDTO(assignment: Assignment): AssignmentDTO {
  return {
    ...assignment,
    finalDeadline: assignment.finalDeadline.toISOString(),
    createdAt: assignment.createdAt.toISOString(),
    tasks: assignment.tasks.map((task) => ({
      ...task,
      deadline: task.deadline.toISOString(),
    })),
  };
}

export function assignmentFromDTO(dto: AssignmentDTO): Assignment {
  return {
    id: dto.id,
    subject: dto.subject,
    title: dto.title,
    finalDeadline: new Date(dto.finalDeadline),
    difficulty: typeof dto.difficulty === "number" ? dto.difficulty : 3,
    depositPoints: dto.depositPoints ?? dto.totalPoints ?? 0,
    totalPoints: dto.totalPoints,
    lecturePdfPath: dto.lecturePdfPath ?? "",
    createdAt: new Date(dto.createdAt),
    tasks: dto.tasks.map((task) => ({
      ...task,
      deadline: new Date(task.deadline),
    })),
  };
}
