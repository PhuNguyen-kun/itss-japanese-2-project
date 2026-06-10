"use client";

import Link from "next/link";
import { CheckCircle2, Circle, Clock, TrendingDown, Lock, XCircle } from "lucide-react";
import type { Milestone } from "@/lib/types";
import { useLanguage } from "@/context/LanguageContext";

interface RoadmapTimelineProps {
  tasks: Milestone[];
  assignmentId: number;
}

export function RoadmapTimeline({ tasks, assignmentId }: RoadmapTimelineProps) {
  const { t } = useLanguage();

  const getTimeRemaining = (deadline: Date) => {
    const now = new Date();
    const diff = deadline.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 0) return { text: t.overdue, urgent: true };
    if (hours < 24) return { text: `${hours}${t.hoursLeft}`, urgent: true };
    const days = Math.floor(hours / 24);
    return { text: `${days}${t.daysLeft} ${hours % 24}h`, urgent: hours < 72 };
  };

  const getStatusLabel = (status: string) => {
    if (status === "completed") return t.timelineCompleted;
    if (status === "forfeited") return t.timelineForfeited;
    if (status === "active") return t.timelineActive;
    if (status === "locked") return t.timelineLocked;
    return t.timelineUpcoming;
  };

  const getStatusIcon = (status: string) => {
    if (status === "completed") {
      return <CheckCircle2 className="text-green-500" size={32} />;
    }
    if (status === "forfeited") {
      return <XCircle className="text-red-500" size={32} />;
    }
    if (status === "active") {
      return (
        <div className="w-8 h-8 rounded-full border-4 border-orange-500 bg-white animate-pulse"></div>
      );
    }
    if (status === "locked") {
      return <Lock className="text-gray-300" size={28} />;
    }
    return <Circle className="text-blue-500" size={28} />;
  };

  return (
    <div className="relative">
      <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-200 via-purple-200 to-pink-200"></div>

      <div className="space-y-8">
        {tasks.map((task, index) => {
          const timeInfo = getTimeRemaining(task.deadline);

          return (
            <div key={task.id} className="relative pl-20">
              <div className="absolute left-4 top-6 transform -translate-x-1/2">
                {getStatusIcon(task.status)}
              </div>

              <div
                className={`bg-white rounded-xl shadow-md border-2 p-6 transition-all ${
                  task.status === "locked"
                    ? "border-gray-200 opacity-60"
                    : task.status === "forfeited"
                    ? "border-red-200 opacity-75"
                    : task.status === "active"
                    ? "border-orange-300 shadow-lg"
                    : task.status === "completed"
                    ? "border-green-200"
                    : "border-blue-200"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">{task.title}</h3>
                      <span
                        className={`text-xs px-3 py-1 rounded-full font-semibold uppercase ${
                          task.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : task.status === "forfeited"
                            ? "bg-red-100 text-red-700"
                            : task.status === "active"
                            ? "bg-orange-100 text-orange-700"
                            : task.status === "locked"
                            ? "bg-gray-100 text-gray-500"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {getStatusLabel(task.status)}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-4">{task.description}</p>

                    <div className="flex items-center space-x-6">
                      <div className="flex items-center space-x-2">
                        <Clock
                          size={18}
                          className={timeInfo.urgent ? "text-red-600" : "text-gray-400"}
                        />
                        <div>
                          <div className="text-xs text-gray-500">{t.deadline}</div>
                          <div
                            className={`font-semibold ${
                              timeInfo.urgent ? "text-red-600" : "text-gray-700"
                            }`}
                          >
                            {timeInfo.text}
                          </div>
                        </div>
                      </div>

                      {task.status !== "locked" && (
                        <div className="flex items-center space-x-2">
                          <TrendingDown size={18} className="text-orange-600" />
                          <div>
                            <div className="text-xs text-gray-500">{t.tablePointsAtRisk}</div>
                            <div className="font-bold text-orange-600 text-lg">
                              {task.pointsDeposited}
                            </div>
                          </div>
                        </div>
                      )}

                      <div>
                        <div className="text-xs text-gray-500">{t.due}</div>
                        <div className="font-semibold text-gray-700">
                          {task.deadline.toLocaleDateString()} {task.deadline.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                    </div>

                    {task.progress > 0 && task.status !== "completed" && (
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-gray-600">{t.progress}</span>
                          <span className="font-semibold text-indigo-600">{task.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-indigo-600 h-2 rounded-full transition-all"
                            style={{ width: `${task.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {task.status === "active" && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <Link
                      href={`/roadmap/${assignmentId}/task/${task.id}`}
                      className="block w-full text-center bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-lg font-bold hover:from-green-600 hover:to-emerald-700 transition-all"
                    >
                      {t.completeTaskTimeline} & {t.reclaimed} {task.pointsDeposited} {t.pointsSuffix}
                    </Link>
                  </div>
                )}

                {task.status === "locked" && (
                  <div className="mt-4 pt-4 border-t border-gray-200 flex items-center space-x-2 text-gray-500">
                    <Lock size={16} />
                    <span className="text-sm">Unlocks after previous task completion</span>
                  </div>
                )}
              </div>

              <div className="absolute left-4 -top-3 transform -translate-x-1/2 bg-indigo-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                {index + 1}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
