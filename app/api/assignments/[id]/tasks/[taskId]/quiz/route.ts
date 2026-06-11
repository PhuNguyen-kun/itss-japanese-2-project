import { NextResponse } from "next/server";
import { getAssignmentById, readPdfsBase64, saveQuizSession } from "@/lib/db";
import { generateQuizQuestions } from "@/lib/gemini";
import { getTaskProgress, saveQuizToProgress } from "@/lib/taskProgress";
import { getLecturePaths } from "@/lib/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  const { id, taskId } = await params;
  const progress = await getTaskProgress(parseInt(id, 10), parseInt(taskId, 10));

  if (!progress.quiz?.questions?.length) {
    return NextResponse.json({ questions: null, answers: null });
  }

  return NextResponse.json({
    questions: progress.quiz.questions,
    answers: progress.quiz.answers,
    generatedAt: progress.quiz.generatedAt,
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const { id, taskId } = await params;
    const assignmentId = parseInt(id, 10);
    const taskIdNum = parseInt(taskId, 10);
    const regenerate = new URL(request.url).searchParams.get("regenerate") === "true";

    const assignment = await getAssignmentById(assignmentId);
    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    const task = assignment.tasks.find((t) => t.id === taskIdNum);
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const lecturePaths = getLecturePaths(assignment);
    if (!lecturePaths.length) {
      return NextResponse.json({ error: "No lecture materials found" }, { status: 400 });
    }

    const existing = await getTaskProgress(assignmentId, taskIdNum);
    if (!regenerate && existing.quiz?.questions?.length) {
      return NextResponse.json({
        questions: existing.quiz.questions,
        answers: existing.quiz.answers,
        cached: true,
      });
    }

    const pdfBase64List = await readPdfsBase64(lecturePaths);
    const questions = await generateQuizQuestions(
      pdfBase64List,
      assignment.subject,
      task.title,
      task.description
    );

    await saveQuizSession(assignmentId, taskIdNum, questions);

    const clientQuestions = questions.map(({ id, question, options }) => ({
      id,
      question,
      options,
    }));

    const progress = await saveQuizToProgress(assignmentId, taskIdNum, clientQuestions);

    return NextResponse.json({
      questions: clientQuestions,
      answers: progress.quiz?.answers ?? new Array(clientQuestions.length).fill(-1),
      cached: false,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate quiz";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
