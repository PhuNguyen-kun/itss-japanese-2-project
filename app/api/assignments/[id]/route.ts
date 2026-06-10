import { NextResponse } from "next/server";
import { getAssignmentById } from "@/lib/db";
import { processOverdueTasks } from "@/lib/overdue";
import { assignmentToDTO } from "@/lib/types";

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
