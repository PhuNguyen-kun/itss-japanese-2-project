import { NextResponse } from "next/server";
import {
  getAllAssignments,
  saveAssignment,
  saveLecturePdfs,
  readPdfsBase64,
} from "@/lib/db";
import { generateRoadmapWithGemini } from "@/lib/gemini";
import { deductDeposit } from "@/lib/wallet";
import { processOverdueTasks } from "@/lib/overdue";
import { assignmentToDTO } from "@/lib/types";

export const maxDuration = 120;

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
    const pdfFiles = formData.getAll("lecturePdfs") as File[];

    const validFiles = pdfFiles.filter((f) => f.size > 0);

    if (!subject || !finalDeadline || !validFiles.length || !difficulty || !depositPoints) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    for (const file of validFiles) {
      if (file.type && file.type !== "application/pdf") {
        return NextResponse.json(
          { error: `"${file.name}" is not a PDF. All lecture files must be PDF.` },
          { status: 400 }
        );
      }
    }

    if (difficulty < 1 || difficulty > 5) {
      return NextResponse.json({ error: "Difficulty must be 1-5" }, { status: 400 });
    }

    const deadline = new Date(finalDeadline + "T23:59:59");
    if (isNaN(deadline.getTime())) {
      return NextResponse.json({ error: "Invalid deadline" }, { status: 400 });
    }

    const assignmentId = Date.now();
    const pdfPaths = await saveLecturePdfs(assignmentId, validFiles);
    const pdfBase64List = await readPdfsBase64(pdfPaths);

    const tasks = await generateRoadmapWithGemini({
      pdfBase64List,
      subject,
      finalDeadline: deadline,
      difficulty,
      depositPoints,
    });

    await deductDeposit(depositPoints, subject);

    const assignment = {
      id: assignmentId,
      subject,
      title: subject,
      finalDeadline: deadline,
      difficulty,
      depositPoints,
      totalPoints: depositPoints,
      lecturePdfPaths: pdfPaths,
      tasks,
      createdAt: new Date(),
    };

    await saveAssignment(assignment);
    return NextResponse.json(assignmentToDTO(assignment), { status: 201 });
  } catch (error) {
    console.error("[POST /api/assignments] Gemini error:", error);

    const message =
      error instanceof Error ? error.message : "Failed to create assignment";

    const isGemini =
      message.includes("Gemini") ||
      message.includes("GoogleGenerativeAI") ||
      message.includes("generativelanguage");

    return NextResponse.json(
      {
        error: isGemini
          ? `AI roadmap generation failed: ${message}. Check GEMINI_API_KEY and try again.`
          : message,
      },
      { status: isGemini ? 502 : 500 }
    );
  }
}
