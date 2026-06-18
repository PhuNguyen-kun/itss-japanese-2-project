"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TrendingDown, TrendingUp, AlertTriangle, Calendar, ArrowLeft, Trash2, Loader2 } from "lucide-react";
import { deleteAssignment, getAssignment, getAssignments } from "@/lib/api-client";
import { calculateAssignmentRefund, calculateForfeitedPoints } from "@/lib/assignmentUtils";
import { RoadmapTimeline } from "./RoadmapTimeline";
import { PageLoading } from "@/components/Loading";
import { useLanguage } from "@/context/LanguageContext";
import { useWallet } from "@/context/WalletContext";
import type { Assignment } from "@/lib/types";

interface RoadmapViewProps {
  assignmentId: string;
}

export function RoadmapView({ assignmentId }: RoadmapViewProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const { refreshWallet } = useWallet();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [roadmap, setRoadmap] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Assignment | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (assignmentId === "all") {
      getAssignments()
        .then(setAssignments)
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      getAssignment(parseInt(assignmentId, 10))
        .then(setRoadmap)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [assignmentId]);

  const handleDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteAssignment(deleteTarget.id);
      await refreshWallet();
      setAssignments((prev) => prev.filter((a) => a.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  if (assignmentId === "all") {
    if (loading) {
      return <PageLoading variant="list" />;
    }

    const refundPreview = deleteTarget ? calculateAssignmentRefund(deleteTarget) : 0;
    const lostPreview = deleteTarget ? calculateForfeitedPoints(deleteTarget) : 0;

    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{t.allRoadmaps}</h1>
          <p className="text-sm sm:text-base text-gray-600">{t.allRoadmapsSubtitle}</p>
        </div>

        {assignments.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 sm:p-16 text-center">
            <div className="text-6xl mb-4">🗺️</div>
            <p className="text-gray-500 mb-6">{t.noAssignments}</p>
            <button
              onClick={() => router.push("/create")}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700"
            >
              {t.createFirstAssignment}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {assignments.map((assignment) => {
              const completed = assignment.tasks.filter((task) => task.status === "completed").length;
              const prog = (completed / assignment.tasks.length) * 100;

              return (
                <div
                  key={assignment.id}
                  className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-6 hover:border-indigo-400 hover:shadow-lg transition-all relative group"
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteError(null);
                      setDeleteTarget(assignment);
                    }}
                    className="absolute top-4 right-4 p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title={t.deleteRoadmap}
                  >
                    <Trash2 size={18} />
                  </button>

                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => router.push(`/roadmap/${assignment.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        router.push(`/roadmap/${assignment.id}`);
                      }
                    }}
                    className="cursor-pointer pr-10"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">{assignment.title}</h3>
                        <p className="text-sm text-gray-600">{assignment.subject}</p>
                      </div>
                      <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold">
                        {assignment.difficulty}/5
                      </span>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="text-gray-600">{t.progress}</span>
                        <span className="font-bold text-indigo-600">{Math.round(prog)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full"
                          style={{ width: `${prog}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <div className="text-xl font-bold text-gray-900">{assignment.tasks.length}</div>
                        <div className="text-xs text-gray-500">{t.tasks}</div>
                      </div>
                      <div>
                        <div className="text-xl font-bold text-green-600">{completed}</div>
                        <div className="text-xs text-gray-500">{t.tasksDone}</div>
                      </div>
                      <div>
                        <div className="text-xl font-bold text-orange-600">{assignment.totalPoints}</div>
                        <div className="text-xs text-gray-500">{t.points}</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">{t.deleteRoadmapTitle}</h2>
              <p className="text-sm text-gray-600 mb-4">{t.deleteRoadmapDesc}</p>
              <p className="font-semibold text-gray-900 mb-1">{deleteTarget.title}</p>

              <div className="bg-gray-50 rounded-xl p-4 space-y-2 mb-4 text-sm">
                {refundPreview > 0 ? (
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t.deleteRoadmapRefund}</span>
                    <span className="font-bold text-green-600">+{refundPreview.toLocaleString()}</span>
                  </div>
                ) : (
                  <p className="text-gray-500">{t.deleteRoadmapNoRefund}</p>
                )}
                {lostPreview > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t.deleteRoadmapLost}</span>
                    <span className="font-bold text-red-600">{lostPreview.toLocaleString()}</span>
                  </div>
                )}
              </div>

              {deleteError && (
                <p className="text-sm text-red-600 mb-3">{deleteError}</p>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-300 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  {t.cancel}
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={handleDelete}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {deleting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      {t.deleting}
                    </>
                  ) : (
                    t.deleteRoadmapConfirm
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (loading) {
    return <PageLoading variant="detail" />;
  }

  if (!roadmap) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 sm:p-16 text-center">
          <p className="text-gray-600 mb-4">{t.assignmentNotFound}</p>
          <button
            onClick={() => router.push("/create")}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700"
          >
            {t.createNewAssignment}
          </button>
        </div>
      </div>
    );
  }

  const completedTasks = roadmap.tasks.filter(task => task.status === "completed").length;
  const totalTasks = roadmap.tasks.length;
  const overallProgress = (completedTasks / totalTasks) * 100;
  const atRiskPoints = roadmap.tasks
    .filter(task => task.status === "active")
    .reduce((sum, task) => sum + task.pointsDeposited, 0);
  const maxTaskPoints = Math.max(...roadmap.tasks.map((task) => task.pointsDeposited));

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8">
        <button
          onClick={() => router.push("/")}
          className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 font-semibold mb-4"
        >
          <ArrowLeft size={20} />
          <span>{t.backToDashboard}</span>
        </button>

        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 break-words">{roadmap.title}</h1>
            <p className="text-sm sm:text-base text-gray-600 mb-3">{roadmap.subject}</p>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-sm">
              <span className="px-3 py-1 bg-gray-100 rounded-lg font-semibold">
                {roadmap.difficulty}/5
              </span>
              <span className="text-gray-500 hidden sm:inline">•</span>
              <div className="flex items-center space-x-2 text-gray-600">
                <Calendar size={16} />
                <span>{t.due} {roadmap.finalDeadline.toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600 mb-2">{t.overallProgress}</div>
          <div className="text-3xl font-bold text-indigo-600 mb-3">{Math.round(overallProgress)}%</div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full"
              style={{ width: `${overallProgress}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600 mb-2">{t.tasksComplete}</div>
          <div className="text-3xl font-bold text-green-600">
            {completedTasks}/{totalTasks}
          </div>
          <div className="text-xs text-gray-500 mt-1">{totalTasks - completedTasks} {t.remaining}</div>
        </div>

        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-orange-100">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">{t.atRisk}</div>
            <TrendingDown className="text-orange-600" size={18} />
          </div>
          <div className="text-3xl font-bold text-orange-600">{atRiskPoints}</div>
          <div className="text-xs text-gray-500 mt-1">{t.activeDeposits}</div>
        </div>

        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-indigo-100">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">{t.totalValue}</div>
            <TrendingUp className="text-indigo-600" size={18} />
          </div>
          <div className="text-3xl font-bold text-indigo-600">{roadmap.totalPoints}</div>
          <div className="text-xs text-gray-500 mt-1">{t.totalPoints2}</div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
        <h3 className="font-bold text-purple-900 mb-3">{t.pointDistStrategy}</h3>
        <p className="text-sm text-purple-700 mb-4">{t.pointDistDesc}</p>
        <div className="overflow-x-auto -mx-1 px-1">
        <div className="flex justify-between gap-1 sm:gap-2 h-24 sm:h-32 mb-2 min-w-[200px]" role="img" aria-label={t.pointDistStrategy}>
          {roadmap.tasks.map((task, i) => (
            <div key={i} className="flex-1 flex flex-col justify-end min-w-0">
              <div
                className="w-full min-h-[4px] bg-gradient-to-t from-orange-500 via-yellow-400 to-yellow-300 rounded-t transition-all hover:opacity-80"
                style={{ height: `${(task.pointsDeposited / maxTaskPoints) * 100}%` }}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between gap-1 sm:gap-2 min-w-[200px]">
          {roadmap.tasks.map((task, i) => (
            <div key={i} className="flex-1 text-center min-w-0">
              <div className="text-xs font-bold text-gray-700">{task.pointsDeposited}</div>
              <div className="text-[10px] text-gray-500">T{i + 1}</div>
            </div>
          ))}
        </div>
        </div>
      </div>

      {atRiskPoints > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-300 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8 flex items-start space-x-3 sm:space-x-4">
          <AlertTriangle className="text-red-600 flex-shrink-0 mt-1" size={28} />
          <div>
            <h3 className="text-lg font-bold text-red-900 mb-1">
              ⚠️ {atRiskPoints} {t.pointsCurrentlyAtRisk}
            </h3>
            <p className="text-sm text-red-700">{t.completeActiveAlert}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 lg:p-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
          {t.assignmentTimeline} ({roadmap.tasks.length} {t.milestones})
        </h2>
        <RoadmapTimeline tasks={roadmap.tasks} assignmentId={roadmap.id} />
      </div>
    </div>
  );
}
