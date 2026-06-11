import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Milestone } from "./types";
import {
  difficultyToMilestoneCount,
  distributePoints,
  scheduleDeadlines,
} from "./pointDistribution";

const DEFAULT_MODEL = "gemini-2.5-flash";

interface GeminiMilestone {
  title: string;
  description: string;
}

function getModelName(): string {
  return process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
}

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");
  return new GoogleGenerativeAI(apiKey);
}

function getModel() {
  return getClient().getGenerativeModel({
    model: getModelName(),
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.4,
    },
  });
}

function parseJsonFromText(text: string): unknown {
  const cleaned = text
    .replace(/```json\n?/gi, "")
    .replace(/```\n?/g, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Gemini response is not valid JSON");
    return JSON.parse(match[0]);
  }
}

function pdfContentParts(pdfBase64List: string[]) {
  return pdfBase64List.map((data) => ({
    inlineData: { mimeType: "application/pdf" as const, data },
  }));
}

export async function generateMilestonesFromPdf(
  pdfBase64List: string[],
  subject: string,
  difficulty: number,
  milestoneCount: number,
  finalDeadline: Date
): Promise<GeminiMilestone[]> {
  const model = getModel();
  const docCount = pdfBase64List.length;

  const prompt = `You are an academic planning assistant. Analyze ALL ${docCount} attached lecture PDF document(s) for the course "${subject}".

Context:
- Subject difficulty: ${difficulty}/5 (1 = introductory, 5 = very advanced)
- Number of milestones required: exactly ${milestoneCount}
- Final assignment deadline: ${finalDeadline.toISOString().split("T")[0]}

Task:
Using content from ALL attached documents, break the material into exactly ${milestoneCount} sequential study milestones a student must complete BEFORE the final deadline.
Each milestone MUST reference specific topics, chapters, sections, or concepts found in the PDFs (not generic study advice).
Order milestones from foundational topics to advanced topics.
Write titles and descriptions in the same language as the PDFs (Vietnamese if the PDFs are Vietnamese).

For each milestone "description":
- Write 3–6 bullet points, each on its own line separated by \\n (newline character)
- Each line is one focused study objective with PDF references (e.g. "Bài 1, trang 8-12: ...")
- Keep each line concise (under 150 characters)
- Do NOT write one long paragraph

Return JSON only:
{
  "milestones": [
    { "title": "...", "description": "..." }
  ]
}`;

  const result = await model.generateContent([
    ...pdfContentParts(pdfBase64List),
    { text: prompt },
  ]);

  const text = result.response.text();
  const parsed = parseJsonFromText(text) as { milestones?: GeminiMilestone[] };

  if (!parsed.milestones?.length) {
    throw new Error("Gemini returned no milestones");
  }

  if (parsed.milestones.length !== milestoneCount) {
    throw new Error(
      `Gemini returned ${parsed.milestones.length} milestones, expected ${milestoneCount}`
    );
  }

  return parsed.milestones.map((m) => ({
    ...m,
    description: normalizeDescription(m.description),
  }));
}

function normalizeDescription(description: string): string {
  const trimmed = description.trim();
  if (trimmed.includes("\n")) return trimmed;
  return trimmed
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .join("\n");
}

export async function generateQuizQuestions(
  pdfBase64List: string[],
  subject: string,
  taskTitle: string,
  taskDescription: string
): Promise<{ id: number; question: string; options: string[]; correctIndex: number }[]> {
  const model = getModel();
  const docCount = pdfBase64List.length;

  const prompt = `Based on ALL ${docCount} attached lecture PDF(s) for "${subject}", create exactly 10 multiple-choice quiz questions to verify the student understood this milestone:

Title: ${taskTitle}
Description: ${taskDescription}

Rules:
- Questions must test content from the PDF related to this milestone
- Each question has exactly 4 options and one correct answer (correctIndex 0-3)
- Use the same language as the PDF
- For ALL mathematical expressions, use LaTeX wrapped in dollar signs $...$
  Examples: $\\sum_{n=1}^{\\infty} \\frac{1}{n(n+1)}$ , $\\int_0^1 x^2\\,dx$ , $\\lim_{x \\to 0} \\frac{\\sin x}{x}$
- Do NOT use Unicode subscripts like Σ_{n=1}^{∞} — always use LaTeX inside $...$

Return JSON only:
{
  "questions": [
    { "id": 1, "question": "...", "options": ["...", "...", "...", "..."], "correctIndex": 0 }
  ]
}`;

  const result = await model.generateContent([
    ...pdfContentParts(pdfBase64List),
    { text: prompt },
  ]);

  const text = result.response.text();
  const parsed = parseJsonFromText(text) as {
    questions?: { id: number; question: string; options: string[]; correctIndex: number }[];
  };

  if (!parsed.questions?.length) {
    throw new Error("Gemini returned no quiz questions");
  }

  if (parsed.questions.length < 10) {
    throw new Error(`Gemini returned ${parsed.questions.length} questions, expected 10`);
  }

  return parsed.questions.slice(0, 10).map((q, i) => ({
    id: i + 1,
    question: q.question,
    options: q.options,
    correctIndex: q.correctIndex,
  }));
}

export function buildTasksFromMilestones(
  milestones: GeminiMilestone[],
  finalDeadline: Date,
  depositPoints: number
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
  pdfBase64List: string[];
  subject: string;
  finalDeadline: Date;
  difficulty: number;
  depositPoints: number;
}): Promise<Milestone[]> {
  const milestoneCount = difficultyToMilestoneCount(params.difficulty);

  const milestones = await generateMilestonesFromPdf(
    params.pdfBase64List,
    params.subject,
    params.difficulty,
    milestoneCount,
    params.finalDeadline
  );

  return buildTasksFromMilestones(
    milestones,
    params.finalDeadline,
    params.depositPoints
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
