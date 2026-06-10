"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TrendingDown, TrendingUp, AlertTriangle, Calendar, ArrowLeft } from "lucide-react";
import { getAssignment, getAssignments } from "@/lib/api-client";
import { RoadmapTimeline } from "./RoadmapTimeline";
import { useLanguage } from "@/context/LanguageContext";
import type { Assignment } from "@/lib/types";

interface RoadmapViewProps {
  assignmentId: string;
}

export function RoadmapView({ assignmentId }: RoadmapViewProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [roadmap, setRoadmap] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (assignmentId === "all") {
    if (loading) {
      return <div className="p-8 text-gray-500">Loading...</div>;
    }

    return (
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.allRoadmaps}</h1>
          <p className="text-gray-600">{t.allRoadmapsSubtitle}</p>
        </div>

        {assignments.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-16 text-center">
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
          <div className="grid grid-cols-2 gap-6">
            {assignments.map((assignment) => {
              const completed = assignment.tasks.filter(task => task.status === "completed").length;
              const prog = (completed / assignment.tasks.length) * 100;

              return (
                <div
                  key={assignment.id}
                  onClick={() => router.push(`/roadmap/${assignment.id}`)}
                  className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-6 hover:border-indigo-400 hover:shadow-lg cursor-pointer transition-all"
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
              );
            })}
          </div>
        )}
      </div>
    );
  }

  if (loading) {
    return <div className="p-8 text-gray-500">Loading...</div>;
  }

  if (!roadmap) {
    return (
      <div className="p-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-16 text-center">
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

  return (
    <div className="p-8">
      <div className="mb-8">
        <button
          onClick={() => router.push("/")}
          className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 font-semibold mb-4"
        >
          <ArrowLeft size={20} />
          <span>{t.backToDashboard}</span>
        </button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{roadmap.title}</h1>
            <p className="text-gray-600 mb-3">{roadmap.subject}</p>
            <div className="flex items-center space-x-3 text-sm">
              <span className="px-3 py-1 bg-gray-100 rounded-lg font-semibold">
                {roadmap.difficulty}/5
              </span>
              <span className="text-gray-500">•</span>
              <div className="flex items-center space-x-2 text-gray-600">
                <Calendar size={16} />
                <span>{t.due} {roadmap.finalDeadline.toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600 mb-2">{t.overallProgress}</div>
          <div className="text-3xl font-bold text-indigo-600 mb-3">{Math.round(overallProgress)}%</div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full"
              style={{ width: `${overallProgress}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600 mb-2">{t.tasksComplete}</div>
          <div className="text-3xl font-bold text-green-600">
            {completedTasks}/{totalTasks}
          </div>
          <div className="text-xs text-gray-500 mt-1">{totalTasks - completedTasks} {t.remaining}</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-orange-100">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">{t.atRisk}</div>
            <TrendingDown className="text-orange-600" size={18} />
          </div>
          <div className="text-3xl font-bold text-orange-600">{atRiskPoints}</div>
          <div className="text-xs text-gray-500 mt-1">{t.activeDeposits}</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-indigo-100">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">{t.totalValue}</div>
            <TrendingUp className="text-indigo-600" size={18} />
          </div>
          <div className="text-3xl font-bold text-indigo-600">{roadmap.totalPoints}</div>
          <div className="text-xs text-gray-500 mt-1">{t.totalPoints2}</div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-xl p-6 mb-8">
        <h3 className="font-bold text-purple-900 mb-3">{t.pointDistStrategy}</h3>
        <p className="text-sm text-purple-700 mb-4">{t.pointDistDesc}</p>
        <div className="flex items-end justify-between space-x-2 h-32">
          {roadmap.tasks.map((task, i) => (
            <div key={i} className="flex-1 flex flex-col items-center justify-end">
              <div
                className="w-full bg-gradient-to-t from-orange-500 via-yellow-400 to-yellow-300 rounded-t transition-all hover:opacity-80"
                style={{ height: `${(task.pointsDeposited / Math.max(...roadmap.tasks.map(t => t.pointsDeposited))) * 100}%` }}
              ></div>
              <div className="text-xs font-bold text-gray-700 mt-2">{task.pointsDeposited}</div>
              <div className="text-[10px] text-gray-500">T{i + 1}</div>
            </div>
          ))}
        </div>
      </div>

      {atRiskPoints > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-300 rounded-xl p-6 mb-8 flex items-start space-x-4">
          <AlertTriangle className="text-red-600 flex-shrink-0 mt-1" size={32} />
          <div>
            <h3 className="text-lg font-bold text-red-900 mb-1">
              ⚠️ {atRiskPoints} {t.pointsCurrentlyAtRisk}
            </h3>
            <p className="text-sm text-red-700">{t.completeActiveAlert}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {t.assignmentTimeline} ({roadmap.tasks.length} {t.milestones})
        </h2>
        <RoadmapTimeline tasks={roadmap.tasks} assignmentId={roadmap.id} />
      </div>
    </div>
  );
}
