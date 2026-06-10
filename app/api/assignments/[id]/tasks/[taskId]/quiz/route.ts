import { NextResponse } from "next/server";
import { getAssignmentById, readPdfBase64, saveQuizSession } from "@/lib/db";
import { generateQuizQuestions } from "@/lib/gemini";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const { id, taskId } = await params;
    const assignment = await getAssignmentById(parseInt(id, 10));
    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    const task = assignment.tasks.find((t) => t.id === parseInt(taskId, 10));
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const pdfBase64 = await readPdfBase64(assignment.lecturePdfPath);
    const questions = await generateQuizQuestions(
      pdfBase64,
      assignment.subject,
      task.title,
      task.description
    );

    await saveQuizSession(assignment.id, task.id, questions);

    const clientQuestions = questions.map(({ id, question, options }) => ({
      id,
      question,
      options,
    }));

    return NextResponse.json({ questions: clientQuestions });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate quiz";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
