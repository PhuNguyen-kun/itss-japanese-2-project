import { NextResponse } from "next/server";
import { getAssignmentById, saveNoteFile } from "@/lib/db";
import { addNoteToProgress } from "@/lib/taskProgress";

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

    const formData = await request.formData();
    const files = formData.getAll("notes") as File[];

    if (!files.length || files.every((f) => !f.size)) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    let progress = null;
    for (const file of files) {
      if (file.size > 0) {
        const path = await saveNoteFile(assignmentId, taskIdNum, file);
        progress = await addNoteToProgress(assignmentId, taskIdNum, {
          path,
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
        });
      }
    }

    return NextResponse.json(progress);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
