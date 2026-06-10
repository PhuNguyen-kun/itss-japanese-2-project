import { getAllAssignments, updateAssignment } from "./db";
import { forfeitPoints, reclaimPoints } from "./wallet";
import type { Assignment, Milestone } from "./types";

function activateNextTask(tasks: Milestone[], completedIndex: number): void {
  const next = tasks[completedIndex + 1];
  if (next && (next.status === "locked" || next.status === "upcoming")) {
    next.status = "active";
  }
}

export async function processOverdueTasks(): Promise<void> {
  const assignments = await getAllAssignments();
  const now = new Date();

  for (const assignment of assignments) {
    let changed = false;

    for (let i = 0; i < assignment.tasks.length; i++) {
      const task = assignment.tasks[i];
      if (
        (task.status === "active" || task.status === "upcoming") &&
        now > task.deadline
      ) {
        task.status = "forfeited";
        await forfeitPoints(task.pointsDeposited, task.title);
        changed = true;

        const next = assignment.tasks[i + 1];
        if (next && next.status === "locked") {
          next.status = "upcoming";
        }
      }
    }

    if (changed) {
      await updateAssignment(assignment);
    }
  }
}

export async function completeTask(
  assignment: Assignment,
  taskId: number
): Promise<Assignment> {
  const taskIndex = assignment.tasks.findIndex((t) => t.id === taskId);
  if (taskIndex === -1) throw new Error("Task not found");

  const task = assignment.tasks[taskIndex];
  if (task.status !== "active") throw new Error("Task is not active");
  if (new Date() > task.deadline) throw new Error("Task is overdue");

  task.status = "completed";
  task.progress = 100;
  activateNextTask(assignment.tasks, taskIndex);

  await reclaimPoints(task.pointsDeposited, task.title);
  return assignment;
}

export { activateNextTask };
