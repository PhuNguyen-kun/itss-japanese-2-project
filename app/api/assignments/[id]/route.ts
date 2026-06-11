import { NextResponse } from "next/server";
import { getAssignmentById } from "@/lib/db";
import { processOverdueTasks } from "@/lib/overdue";
import { assignmentToDTO } from "@/lib/types";
import { deleteAssignmentWithRefund } from "@/lib/assignmentDelete";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await processOverdueTasks();
  const { id } = await params;
  const assignment = await getAssignmentById(parseInt(id, 10));

  if (!assignment) {
    return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
  }

  return NextResponse.json(assignmentToDTO(assignment));
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await processOverdueTasks();
    const { id } = await params;
    const assignmentId = parseInt(id, 10);
    if (isNaN(assignmentId)) {
      return NextResponse.json({ error: "Invalid assignment id" }, { status: 400 });
    }

    const result = await deleteAssignmentWithRefund(assignmentId);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete assignment";
    const status = message === "Assignment not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
