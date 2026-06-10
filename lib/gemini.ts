import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Milestone } from "./types";
import {
  difficultyToMilestoneCount,
  distributePoints,
  scheduleDeadlines,
} from "./pointDistribution";

const MODEL = "gemini-2.0-flash";

interface GeminiMilestone {
  title: string;
  description: string;
}

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");
  return new GoogleGenerativeAI(apiKey);
}

function parseJsonFromText(text: string): unknown {
  const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  return JSON.parse(cleaned);
}

export async function generateMilestonesFromPdf(
  pdfBase64: string,
  subject: string,
  difficulty: number,
  milestoneCount: number
): Promise<GeminiMilestone[]> {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({ model: MODEL });

  const prompt = `You are an academic planning assistant. Analyze this lecture PDF for the course "${subject}".
The subject difficulty level is ${difficulty}/5 (1=easiest, 5=hardest).

Break the material into exactly ${milestoneCount} sequential study milestones a student must complete before their final assignment deadline.
Each milestone should map to concrete sections/topics from the PDF.

Return ONLY valid JSON in this exact shape (no markdown):
{
  "milestones": [
    { "title": "Short milestone title", "description": "What the student should accomplish" }
  ]
}`;

  const result = await model.generateContent([
    { inlineData: { mimeType: "application/pdf", data: pdfBase64 } },
    { text: prompt },
  ]);

  const text = result.response.text();
  const parsed = parseJsonFromText(text) as { milestones: GeminiMilestone[] };

  if (!parsed.milestones?.length) {
    throw new Error("Gemini returned no milestones");
  }

  return parsed.milestones.slice(0, milestoneCount);
}

export async function generateQuizQuestions(
  pdfBase64: string,
  subject: string,
  taskTitle: string,
  taskDescription: string
): Promise<{ id: number; question: string; options: string[]; correctIndex: number }[]> {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({ model: MODEL });

  const prompt = `Based on this lecture PDF for "${subject}", create exactly 10 multiple-choice quiz questions to verify the student understood the milestone: "${taskTitle}" — ${taskDescription}.

Each question must have exactly 4 options with one correct answer.

Return ONLY valid JSON (no markdown):
{
  "questions": [
    {
      "id": 1,
      "question": "...",
      "options": ["A", "B", "C", "D"],
      "correctIndex": 0
    }
  ]
}`;

  const result = await model.generateContent([
    { inlineData: { mimeType: "application/pdf", data: pdfBase64 } },
    { text: prompt },
  ]);

  const text = result.response.text();
  const parsed = parseJsonFromText(text) as {
    questions: { id: number; question: string; options: string[]; correctIndex: number }[];
  };

  return parsed.questions.slice(0, 10).map((q, i) => ({ ...q, id: i + 1 }));
}

/** Fallback milestones when Gemini fails */
function fallbackMilestones(subject: string, count: number): GeminiMilestone[] {
  const templates = [
    { title: "Initial Research & Planning", description: `Review core concepts for ${subject}` },
    { title: "Core Content Study", description: "Study main chapters and take notes" },
    { title: "Practice & Application", description: "Apply concepts through exercises" },
    { title: "Draft & Review", description: "Draft work and self-review" },
    { title: "Deep Dive Analysis", description: "Analyze advanced topics in depth" },
    { title: "Integration Phase", description: "Connect ideas across modules" },
    { title: "Revision Round", description: "Revise weak areas identified" },
    { title: "Final Preparation", description: "Final review before submission" },
  ];
  return templates.slice(0, count);
}

export function buildTasksFromMilestones(
  milestones: GeminiMilestone[],
  finalDeadline: Date,
  depositPoints: number,
  difficulty: number
): Milestone[] {
  const count = milestones.length;
  const pointValues = distributePoints(depositPoints, count);
  const deadlines = scheduleDeadlines(count, finalDeadline);

  return milestones.map((m, index) => {
    let status: Milestone["status"] = "locked";
    if (index === 0) status = "active";
    else if (index === 1) status = "upcoming";

    return {
      id: index + 1,
      title: m.title,
      description: m.description,
      deadline: deadlines[index],
      pointsDeposited: pointValues[index],
      status,
      progress: 0,
    };
  });
}

export async function generateRoadmapWithGemini(params: {
  pdfBase64: string;
  subject: string;
  finalDeadline: Date;
  difficulty: number;
  depositPoints: number;
}): Promise<Milestone[]> {
  const milestoneCount = difficultyToMilestoneCount(params.difficulty);

  let milestones: GeminiMilestone[];
  try {
    milestones = await generateMilestonesFromPdf(
      params.pdfBase64,
      params.subject,
      params.difficulty,
      milestoneCount
    );
  } catch {
    milestones = fallbackMilestones(params.subject, milestoneCount);
  }

  if (milestones.length < milestoneCount) {
    const extras = fallbackMilestones(params.subject, milestoneCount - milestones.length);
    milestones = [...milestones, ...extras].slice(0, milestoneCount);
  }

  return buildTasksFromMilestones(
    milestones,
    params.finalDeadline,
    params.depositPoints,
    params.difficulty
  );
}

export function gradeQuiz(
  questions: { correctIndex: number }[],
  answers: number[]
): { correct: number; passed: boolean } {
  let correct = 0;
  questions.forEach((q, i) => {
    if (answers[i] === q.correctIndex) correct++;
  });
  return { correct, passed: correct >= 7 };
}
