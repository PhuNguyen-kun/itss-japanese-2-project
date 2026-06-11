import { NextResponse } from "next/server";
import {
  getTaskProgress,
  saveDraftAnswers,
} from "@/lib/taskProgress";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  const { id, taskId } = await params;
  const progress = await getTaskProgress(parseInt(id, 10), parseInt(taskId, 10));
  return NextResponse.json(progress);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const { id, taskId } = await params;
    const assignmentId = parseInt(id, 10);
    const taskIdNum = parseInt(taskId, 10);
    const body = await request.json();
    const answers = body.answers as number[];

    if (!Array.isArray(answers)) {
      return NextResponse.json({ error: "Invalid answers" }, { status: 400 });
    }

    const progress = await saveDraftAnswers(assignmentId, taskIdNum, answers);
    return NextResponse.json(progress);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save progress";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
