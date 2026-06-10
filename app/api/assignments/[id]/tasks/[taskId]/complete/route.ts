import { NextResponse } from "next/server";
import {
  getAssignmentById,
  getQuizSession,
  saveNoteFile,
  updateAssignment,
} from "@/lib/db";
import { gradeQuiz } from "@/lib/gemini";
import { completeTask } from "@/lib/overdue";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const { id, taskId } = await params;
    const assignmentId = parseInt(id, 10);
    const taskIdNum = parseInt(taskId, 10);

    const assignment = await getAssignmentById(assignmentId);
    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    const task = assignment.tasks.find((t) => t.id === taskIdNum);
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    if (task.status !== "active") {
      return NextResponse.json({ error: "Task is not active" }, { status: 400 });
    }

    if (new Date() > task.deadline) {
      return NextResponse.json({ error: "Task is overdue" }, { status: 400 });
    }

    const formData = await request.formData();
    const answersRaw = formData.get("answers") as string;
    const noteFiles = formData.getAll("notes") as File[];

    if (!noteFiles.length || noteFiles.every((f) => !f.size)) {
      return NextResponse.json({ error: "Upload at least one note file" }, { status: 400 });
    }

    if (!answersRaw) {
      return NextResponse.json({ error: "Quiz answers required" }, { status: 400 });
    }

    const answers: number[] = JSON.parse(answersRaw);
    const quiz = await getQuizSession(assignmentId, taskIdNum);
    if (!quiz?.questions?.length) {
      return NextResponse.json({ error: "Quiz not found. Generate quiz first." }, { status: 400 });
    }

    const { correct, passed } = gradeQuiz(quiz.questions, answers);
    if (!passed) {
      return NextResponse.json(
        { error: `Need 7/10 correct. You got ${correct}/10.`, correct, passed: false },
        { status: 400 }
      );
    }

    for (const file of noteFiles) {
      if (file.size > 0) {
        await saveNoteFile(assignmentId, taskIdNum, file);
      }
    }

    const updated = await completeTask(assignment, taskIdNum);
    await updateAssignment(updated);

    return NextResponse.json({
      success: true,
      correct,
      passed: true,
      pointsReclaimed: task.pointsDeposited,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to complete task";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
