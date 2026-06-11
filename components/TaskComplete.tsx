"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  History,
} from "lucide-react";
import {
  getAssignment,
  getTaskProgress,
  uploadTaskNotes,
  saveQuizAnswers,
  generateQuiz,
  completeTaskRequest,
  type QuizQuestionClient,
  type TaskProgressClient,
} from "@/lib/api-client";
import { useLanguage } from "@/context/LanguageContext";
import { formatTimeRemaining } from "@/lib/timeFormat";
import { TaskDescription } from "./TaskDescription";
import { MathText } from "./MathText";
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
  const [progress, setProgress] = useState<TaskProgressClient | null>(null);
  const [questions, setQuestions] = useState<QuizQuestionClient[]>([]);
  const [answers, setAnswers] = useState<number[]>([]);
  const [quizStarted, setQuizStarted] = useState(false);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [uploadingNotes, setUploadingNotes] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const aid = parseInt(assignmentId, 10);
  const tid = parseInt(taskId, 10);

  useEffect(() => {
    Promise.all([getAssignment(aid), getTaskProgress(aid, tid)]).then(([a, p]) => {
      if (!a) return;
      setAssignment(a);
      const found = a.tasks.find((t) => t.id === tid);
      setTask(found ?? null);
      setProgress(p);

      if (p.quiz?.questions?.length) {
        setQuestions(p.quiz.questions);
        setAnswers(p.quiz.answers ?? new Array(p.quiz.questions.length).fill(-1));
        setQuizStarted(true);
      }
    });
  }, [assignmentId, taskId, aid, tid]);

  const persistAnswers = useCallback(
    (next: number[]) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        saveQuizAnswers(aid, tid, next).catch(console.error);
      }, 400);
    },
    [aid, tid]
  );

  const handleAnswerChange = (qi: number, oi: number) => {
    const next = [...answers];
    next[qi] = oi;
    setAnswers(next);
    persistAnswers(next);
  };

  const handleNotesUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploadingNotes(true);
    setError("");
    try {
      const updated = await uploadTaskNotes(aid, tid, Array.from(files));
      setProgress(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingNotes(false);
    }
  };

  if (!task || !assignment) {
    return <div className="p-8 text-gray-500">Loading...</div>;
  }

  const isCompleted = task.status === "completed" || !!progress?.completedAt;
  const timeInfo = formatTimeRemaining(task.deadline, t.overdue);
  const canTakeQuiz = (progress?.notes.length ?? 0) > 0;

  const handleStartQuiz = async (regenerate = false) => {
    if (!canTakeQuiz) {
      setError(t.noteRequired);
      return;
    }
    setError("");
    setLoadingQuiz(true);
    try {
      const result = await generateQuiz(aid, tid, regenerate);
      setQuestions(result.questions);
      setAnswers(result.answers ?? new Array(result.questions.length).fill(-1));
      setQuizStarted(true);
      const p = await getTaskProgress(aid, tid);
      setProgress(p);
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
      await completeTaskRequest(aid, tid, answers);
      setShowSuccess(true);
      setTimeout(() => router.push(`/roadmap/${assignment.id}`), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
      const p = await getTaskProgress(aid, tid);
      setProgress(p);
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
        <TaskDescription text={task.description} />
      </div>

      {/* Notes */}
      <div className="bg-white rounded-xl p-5 shadow-md border border-gray-200">
        <h2 className="font-bold text-gray-900 mb-3">{t.uploadNotes}</h2>
        <p className="text-sm text-gray-600 mb-4">{t.uploadNotesDesc}</p>

        {!isCompleted && (
          <label className="flex flex-col items-center border-2 border-dashed border-gray-300 rounded-xl p-6 cursor-pointer hover:border-indigo-400">
            <Upload className="text-gray-400 mb-2" size={32} />
            <span className="text-sm font-semibold text-gray-700">
              {uploadingNotes ? t.uploading : t.uploadNotesBtn}
            </span>
            <input
              type="file"
              multiple
              className="hidden"
              disabled={uploadingNotes}
              onChange={(e) => {
                handleNotesUpload(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
        )}

        {(progress?.notes.length ?? 0) > 0 && (
          <div className="mt-3 space-y-2">
            {progress!.notes.map((n, i) => (
              <div key={i} className="flex items-center justify-between text-sm text-gray-700 bg-gray-50 p-2 rounded-lg">
                <div className="flex items-center space-x-2">
                  <FileText size={16} className="text-indigo-600" />
                  <span>{n.originalName}</span>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(n.uploadedAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quiz */}
      <div className="bg-white rounded-xl p-5 shadow-md border border-gray-200">
        <h2 className="font-bold text-gray-900 mb-2">{t.quizTitle}</h2>
        <p className="text-sm text-gray-600 mb-4">{t.quizDesc}</p>

        {!quizStarted && !isCompleted ? (
          <button
            onClick={() => handleStartQuiz(false)}
            disabled={!canTakeQuiz || loadingQuiz}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold disabled:opacity-50"
          >
            {loadingQuiz ? t.generatingQuiz : t.startQuiz}
          </button>
        ) : (
          <div className="space-y-6">
            {quizStarted && !isCompleted && (
              <button
                onClick={() => handleStartQuiz(true)}
                disabled={loadingQuiz}
                className="text-sm text-indigo-600 hover:underline"
              >
                {t.regenerateQuiz}
              </button>
            )}
            {questions.map((q, qi) => (
              <div key={q.id} className="border-b border-gray-100 pb-4">
                <div className="font-semibold text-gray-900 mb-3">
                  <span>{qi + 1}. </span>
                  <MathText text={q.question} />
                </div>
                <div className="space-y-2">
                  {q.options.map((opt, oi) => {
                    const selected = answers[qi] === oi;
                    return (
                      <label
                        key={oi}
                        className={`flex items-start space-x-3 p-3 rounded-lg border ${
                          isCompleted
                            ? "border-gray-200 bg-gray-50 cursor-default"
                            : selected
                            ? "border-indigo-500 bg-indigo-50 cursor-pointer"
                            : "border-gray-200 hover:bg-gray-50 cursor-pointer"
                        }`}
                      >
                        {!isCompleted && (
                          <input
                            type="radio"
                            name={`q-${qi}`}
                            checked={selected}
                            onChange={() => handleAnswerChange(qi, oi)}
                            className="text-indigo-600 mt-1"
                          />
                        )}
                        <MathText text={opt} className="text-sm text-gray-800 flex-1" />
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* History */}
      {(progress?.history.length ?? 0) > 0 && (
        <div className="bg-white rounded-xl p-5 shadow-md border border-gray-200">
          <div className="flex items-center space-x-2 mb-4">
            <History size={20} className="text-indigo-600" />
            <h2 className="font-bold text-gray-900">{t.quizHistory}</h2>
          </div>
          <div className="space-y-3">
            {progress!.history.map((h, i) => (
              <div key={i} className="p-3 bg-gray-50 rounded-lg text-sm">
                <div className="flex justify-between mb-1">
                  <span className="font-semibold">
                    {h.passed ? "✅" : "❌"} {h.correct}/10
                  </span>
                  <span className="text-gray-500">
                    {new Date(h.submittedAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  {t.answersSaved}: [{h.answers.join(", ")}]
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {!isCompleted && (
        <>
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
              <span>
                {t.completeTaskBtn} {task.pointsDeposited} {t.pointsSuffix}
              </span>
              <Sparkles size={20} />
            </button>
          )}
        </>
      )}
    </div>
  );
}
