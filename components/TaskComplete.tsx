"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  Sparkles,
  Upload,
  FileText,
} from "lucide-react";
import {
  getAssignment,
  generateQuiz,
  completeTaskRequest,
  type QuizQuestionClient,
} from "@/lib/api-client";
import { useLanguage } from "@/context/LanguageContext";
import type { Assignment, Milestone } from "@/lib/types";

interface TaskCompleteProps {
  assignmentId: string;
  taskId: string;
}

export function TaskComplete({ assignmentId, taskId }: TaskCompleteProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [task, setTask] = useState<Milestone | null>(null);
  const [notes, setNotes] = useState<File[]>([]);
  const [questions, setQuestions] = useState<QuizQuestionClient[]>([]);
  const [answers, setAnswers] = useState<number[]>([]);
  const [quizStarted, setQuizStarted] = useState(false);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    getAssignment(parseInt(assignmentId, 10)).then((a) => {
      if (!a) return;
      setAssignment(a);
      const found = a.tasks.find((t) => t.id === parseInt(taskId, 10));
      setTask(found ?? null);
    });
  }, [assignmentId, taskId]);

  if (!task || !assignment) {
    return <div className="p-8 text-gray-500">Loading...</div>;
  }

  const getTimeRemaining = (deadline: Date) => {
    const now = new Date();
    const diff = deadline.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours < 0) return { text: t.overdue, color: "text-red-600" };
    if (hours < 24) return { text: `${hours}h ${minutes}m remaining`, color: "text-red-600" };
    const days = Math.floor(hours / 24);
    return { text: `${days}d ${hours % 24}h remaining`, color: "text-orange-600" };
  };

  const timeInfo = getTimeRemaining(task.deadline);
  const canTakeQuiz = notes.length > 0;

  const handleStartQuiz = async () => {
    if (!canTakeQuiz) {
      setError(t.noteRequired);
      return;
    }
    setError("");
    setLoadingQuiz(true);
    try {
      const { questions: qs } = await generateQuiz(assignment.id, task.id);
      setQuestions(qs);
      setAnswers(new Array(qs.length).fill(-1));
      setQuizStarted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Quiz failed");
    } finally {
      setLoadingQuiz(false);
    }
  };

  const handleComplete = async () => {
    if (answers.some((a) => a < 0)) {
      setError(t.answerAllQuestions);
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const result = await completeTaskRequest(assignment.id, task.id, notes, answers);
      setShowSuccess(true);
      setTimeout(() => router.push(`/roadmap/${assignment.id}`), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 space-y-6 relative max-w-3xl">
      {showSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 text-center space-y-4 max-w-sm mx-4">
            <div className="text-6xl">🎉</div>
            <h2 className="text-2xl font-bold text-gray-900">{t.taskComplete}</h2>
            <div className="flex items-center justify-center space-x-2 text-green-600">
              <TrendingUp size={24} />
              <span className="text-3xl font-bold">+{task.pointsDeposited}</span>
            </div>
            <p className="text-gray-600">{t.pointsReclaimedMsg}</p>
          </div>
        </div>
      )}

      <div>
        <button
          onClick={() => router.push(`/roadmap/${assignment.id}`)}
          className="text-indigo-600 font-semibold mb-4"
        >
          {t.back}
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{task.title}</h1>
        <p className="text-gray-600 mt-1">{assignment.subject}</p>
      </div>

      <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl p-5 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock size={24} />
            <div>
              <p className="text-sm opacity-90">{t.deadline}</p>
              <p className="font-bold">{timeInfo.text}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center justify-end space-x-2">
              <TrendingDown size={24} />
              <span className="text-3xl font-bold">{task.pointsDeposited}</span>
            </div>
            <p className="text-sm opacity-90">{t.pointsAtRiskLabel}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-5 shadow-md border border-gray-200">
        <h2 className="font-bold text-gray-900 mb-3">{t.description}</h2>
        <p className="text-gray-700">{task.description}</p>
      </div>

      {/* Step 1: Upload notes */}
      <div className="bg-white rounded-xl p-5 shadow-md border border-gray-200">
        <h2 className="font-bold text-gray-900 mb-3">{t.uploadNotes}</h2>
        <p className="text-sm text-gray-600 mb-4">{t.uploadNotesDesc}</p>
        <label className="flex flex-col items-center border-2 border-dashed border-gray-300 rounded-xl p-6 cursor-pointer hover:border-indigo-400">
          <Upload className="text-gray-400 mb-2" size={32} />
          <span className="text-sm font-semibold text-gray-700">{t.uploadNotesBtn}</span>
          <input
            type="file"
            multiple
            className="hidden"
            onChange={(e) => setNotes(Array.from(e.target.files ?? []))}
          />
        </label>
        {notes.length > 0 && (
          <div className="mt-3 space-y-2">
            {notes.map((f, i) => (
              <div key={i} className="flex items-center space-x-2 text-sm text-gray-700">
                <FileText size={16} className="text-indigo-600" />
                <span>{f.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Step 2: Quiz */}
      <div className="bg-white rounded-xl p-5 shadow-md border border-gray-200">
        <h2 className="font-bold text-gray-900 mb-2">{t.quizTitle}</h2>
        <p className="text-sm text-gray-600 mb-4">{t.quizDesc}</p>

        {!quizStarted ? (
          <button
            onClick={handleStartQuiz}
            disabled={!canTakeQuiz || loadingQuiz}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold disabled:opacity-50"
          >
            {loadingQuiz ? t.generatingQuiz : t.startQuiz}
          </button>
        ) : (
          <div className="space-y-6">
            {questions.map((q, qi) => (
              <div key={q.id} className="border-b border-gray-100 pb-4">
                <p className="font-semibold text-gray-900 mb-3">
                  {qi + 1}. {q.question}
                </p>
                <div className="space-y-2">
                  {q.options.map((opt, oi) => (
                    <label
                      key={oi}
                      className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer border ${
                        answers[qi] === oi
                          ? "border-indigo-500 bg-indigo-50"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`q-${qi}`}
                        checked={answers[qi] === oi}
                        onChange={() => {
                          const next = [...answers];
                          next[qi] = oi;
                          setAnswers(next);
                        }}
                        className="text-indigo-600"
                      />
                      <span className="text-sm text-gray-800">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 flex items-start space-x-3">
        <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
        <div>
          <p className="text-sm font-semibold text-amber-900">{t.warningPointLoss}</p>
          <p className="text-xs text-amber-700 mt-1">
            {t.warningDesc1} {task.pointsDeposited} {t.warningDesc2}
          </p>
        </div>
      </div>

      {quizStarted && (
        <button
          onClick={handleComplete}
          disabled={submitting}
          className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center space-x-2 hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg disabled:opacity-50"
        >
          <CheckCircle2 size={24} />
          <span>{t.completeTaskBtn} {task.pointsDeposited} {t.pointsSuffix}</span>
          <Sparkles size={20} />
        </button>
      )}
    </div>
  );
}
