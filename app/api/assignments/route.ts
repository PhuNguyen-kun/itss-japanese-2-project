import { NextResponse } from "next/server";
import {
  getAllAssignments,
  saveAssignment,
  saveLecturePdf,
  readPdfBase64,
} from "@/lib/db";
import { generateRoadmapWithGemini } from "@/lib/gemini";
import { deductDeposit } from "@/lib/wallet";
import { processOverdueTasks } from "@/lib/overdue";
import { assignmentToDTO } from "@/lib/types";

export async function GET() {
  await processOverdueTasks();
  const assignments = await getAllAssignments();
  return NextResponse.json(assignments.map(assignmentToDTO));
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const subject = formData.get("subject") as string;
    const finalDeadline = formData.get("finalDeadline") as string;
    const difficulty = parseInt(formData.get("difficulty") as string, 10);
    const depositPoints = parseInt(formData.get("depositPoints") as string, 10);
    const pdfFile = formData.get("lecturePdf") as File | null;

    if (!subject || !finalDeadline || !pdfFile || !difficulty || !depositPoints) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (difficulty < 1 || difficulty > 5) {
      return NextResponse.json({ error: "Difficulty must be 1-5" }, { status: 400 });
    }

    const deadline = new Date(finalDeadline + "T23:59:59");
    if (isNaN(deadline.getTime())) {
      return NextResponse.json({ error: "Invalid deadline" }, { status: 400 });
    }

    await deductDeposit(depositPoints, subject);

    const assignmentId = Date.now();
    const pdfPath = await saveLecturePdf(assignmentId, pdfFile);
    const pdfBase64 = await readPdfBase64(pdfPath);

    const tasks = await generateRoadmapWithGemini({
      pdfBase64,
      subject,
      finalDeadline: deadline,
      difficulty,
      depositPoints,
    });

    const assignment = {
      id: assignmentId,
      subject,
      title: subject,
      finalDeadline: deadline,
      difficulty,
      depositPoints,
      totalPoints: depositPoints,
      lecturePdfPath: pdfPath,
      tasks,
      createdAt: new Date(),
    };

    await saveAssignment(assignment);
    return NextResponse.json(assignmentToDTO(assignment), { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create assignment";
    const status = message === "Insufficient balance" ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function HEAD() {
  return NextResponse.json({ ok: true });
}
