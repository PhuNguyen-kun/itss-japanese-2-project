export interface Milestone {
  id: number;
  title: string;
  description: string;
  deadline: Date;
  pointsDeposited: number;
  status: "locked" | "upcoming" | "active" | "completed";
  progress: number;
}

export interface Assignment {
  id: number;
  subject: string;
  title: string;
  description: string;
  finalDeadline: Date;
  difficulty: string;
  totalPoints: number;
  tasks: Milestone[];
  createdAt: Date;
}

interface TaskTemplate {
  title: string;
  description: string;
}

const taskTemplates: Record<string, TaskTemplate[]> = {
  default: [
    { title: "Initial Research & Planning", description: "Gather sources and create outline" },
    { title: "Draft First Section", description: "Complete introduction and context" },
    { title: "Core Content Development", description: "Write main body and key arguments" },
    { title: "Analysis & Evidence", description: "Add supporting data and citations" },
    { title: "Draft Completion", description: "Finish all sections and connect ideas" },
    { title: "Review & Refinement", description: "Edit for clarity and coherence" },
    { title: "Final Polish", description: "Proofread and format" },
    { title: "Submit Assignment", description: "Final check and submission" },
  ],
  programming: [
    { title: "Problem Analysis", description: "Understand requirements and constraints" },
    { title: "Design Architecture", description: "Plan data structures and algorithms" },
    { title: "Core Implementation", description: "Write main functionality" },
    { title: "Feature Development", description: "Add required features" },
    { title: "Testing & Debugging", description: "Write tests and fix bugs" },
    { title: "Documentation", description: "Add comments and README" },
    { title: "Code Review", description: "Refactor and optimize" },
    { title: "Final Submission", description: "Package and submit" },
  ],
  lab: [
    { title: "Preparation & Setup", description: "Read lab manual and prepare materials" },
    { title: "Experiment Execution", description: "Conduct experiments and collect data" },
    { title: "Data Analysis", description: "Process and analyze results" },
    { title: "Draft Report", description: "Write methods and results sections" },
    { title: "Discussion & Conclusion", description: "Interpret findings" },
    { title: "Final Report", description: "Complete and submit lab report" },
  ],
};

export function generateRoadmap(
  subject: string,
  description: string,
  finalDeadline: Date,
  difficulty: "easy" | "medium" | "hard"
): Assignment {
  const now = new Date();
  const timeUntilDeadline = finalDeadline.getTime() - now.getTime();

  // Determine number of milestones based on difficulty
  const milestoneCount = {
    easy: 4,
    medium: 6,
    hard: 8,
  }[difficulty];

  // Choose appropriate task template
  const subjectLower = subject.toLowerCase();
  let templateKey = "default";
  if (subjectLower.includes("programming") || subjectLower.includes("code") ||
      subjectLower.includes("software") || subjectLower.includes("cs")) {
    templateKey = "programming";
  } else if (subjectLower.includes("lab") || subjectLower.includes("experiment") ||
             subjectLower.includes("physics") || subjectLower.includes("chemistry")) {
    templateKey = "lab";
  }

  const templates = taskTemplates[templateKey];
  const selectedTemplates = templates.slice(0, milestoneCount);

  // Base points scale with difficulty
  const basePoints = {
    easy: 100,
    medium: 120,
    hard: 150,
  }[difficulty];

  // Generate milestones with progressive deadlines and increasing points
  const tasks: Milestone[] = selectedTemplates.map((template, index) => {
    // Progressive deadline distribution (not linear - more time early, compressed later)
    const progressionFactor = Math.pow((index + 1) / milestoneCount, 0.8);
    const milestoneDeadline = new Date(
      now.getTime() + timeUntilDeadline * progressionFactor
    );

    // Increasing point pressure (exponential growth toward deadline)
    // Early tasks: lower points, Later tasks: much higher points
    const pointMultiplier = 1 + (index / milestoneCount) * 2.5;
    const points = Math.round(basePoints * pointMultiplier);

    // Determine initial status
    let status: Milestone["status"] = "locked";
    if (index === 0) {
      status = "active"; // First task is always active
    } else if (index === 1) {
      status = "upcoming"; // Second task is upcoming
    }

    return {
      id: index + 1,
      title: template.title,
      description: template.description,
      deadline: milestoneDeadline,
      pointsDeposited: points,
      status,
      progress: 0,
    };
  });

  const totalPoints = tasks.reduce((sum, task) => sum + task.pointsDeposited, 0);

  return {
    id: Date.now(),
    subject,
    title: description,
    description,
    finalDeadline,
    difficulty,
    totalPoints,
    tasks,
    createdAt: now,
  };
}

export function saveAssignment(assignment: Assignment): void {
  const assignments = getAssignments();
  assignments.push(assignment);
  localStorage.setItem("assignments", JSON.stringify(assignments));
}

export function getAssignments(): Assignment[] {
  const stored = localStorage.getItem("assignments");
  if (!stored) return [];

  const assignments = JSON.parse(stored);
  // Parse date strings back to Date objects
  return assignments.map((a: any) => ({
    ...a,
    finalDeadline: new Date(a.finalDeadline),
    createdAt: new Date(a.createdAt),
    tasks: a.tasks.map((t: any) => ({
      ...t,
      deadline: new Date(t.deadline),
    })),
  }));
}

export function getAssignment(id: number): Assignment | null {
  const assignments = getAssignments();
  return assignments.find(a => a.id === id) || null;
}
