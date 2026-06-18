"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock, TrendingDown, TrendingUp, AlertCircle, CheckCircle2, Calendar, Zap } from "lucide-react";
import { getAssignments } from "@/lib/api-client";
import { useState, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { formatPoints, useWallet } from "@/context/WalletContext";
import { formatTimeRemaining } from "@/lib/timeFormat";
import { PageLoading } from "@/components/Loading";
import type { Assignment } from "@/lib/types";

export function Home() {
  const { t } = useLanguage();
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const { stats } = useWallet();

  useEffect(() => {
    getAssignments()
      .then(setAssignments)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <PageLoading variant="dashboard" />;
  }

  const allTasks = assignments.flatMap(assignment =>
    assignment.tasks
      .filter(task => task.status === "active" || task.status === "upcoming")
      .map(task => ({
        ...task,
        assignmentId: assignment.id,
        subject: assignment.subject,
      }))
  );

  const totalPointsAvailable = stats?.totalBalance;
  const pointsAtRisk = allTasks
    .filter(task => task.status === "active")
    .reduce((sum, task) => sum + task.pointsDeposited, 0);
  const totalLost = stats?.lost ?? 0;
  const completedToday = assignments.flatMap(a => a.tasks).filter(
    t => t.status === "completed"
  ).length;

  const getTimeRemaining = (deadline: Date) => {
    return formatTimeRemaining(deadline, t.overdue).text;
  };

  const getUrgencyLevel = (deadline: Date) => {
    const now = new Date();
    const diff = deadline.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 24) return "high";
    if (hours < 72) return "medium";
    return "low";
  };

  const getUrgencyColor = (urgency: string) => {
    if (urgency === "high") return "bg-red-500";
    if (urgency === "medium") return "bg-orange-500";
    return "bg-yellow-500";
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{t.dashboardTitle}</h1>
        <p className="text-sm sm:text-base text-gray-600">{t.dashboardSubtitle}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border-2 border-indigo-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-600">{t.totalPoints}</span>
            <Zap className="text-indigo-600" size={20} />
          </div>
          <div className="text-3xl font-bold text-indigo-600">
            {formatPoints(totalPointsAvailable, !stats)}
          </div>
          <div className="text-xs text-gray-500 mt-1">{t.availableBalance}</div>
        </div>

        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border-2 border-orange-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-600">{t.atRisk}</span>
            <TrendingDown className="text-orange-600" size={20} />
          </div>
          <div className="text-3xl font-bold text-orange-600">{pointsAtRisk}</div>
          <div className="text-xs text-gray-500 mt-1">{t.activeDeposits}</div>
        </div>

        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border-2 border-red-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-600">{t.lostForever}</span>
            <AlertCircle className="text-red-600" size={20} />
          </div>
          <div className="text-3xl font-bold text-red-600">{totalLost}</div>
          <div className="text-xs text-gray-500 mt-1">{t.missedDeadlines}</div>
        </div>

        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border-2 border-green-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-600">{t.completedToday}</span>
            <CheckCircle2 className="text-green-600" size={20} />
          </div>
          <div className="text-3xl font-bold text-green-600">{completedToday}</div>
          <div className="text-xs text-gray-500 mt-1">{t.tasksFinished}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2">
          {pointsAtRisk > 0 && (
            <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-xl p-4 sm:p-5 mb-4 sm:mb-6 flex items-start space-x-3 sm:space-x-4">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-1" size={24} />
              <div>
                <p className="text-base sm:text-lg font-bold text-red-900">
                  ⚠️ {pointsAtRisk} {t.pointsAtRiskAlert}
                </p>
                <p className="text-sm text-red-700 mt-1">{t.completeTasksAlert}</p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">{t.activeTasks}</h2>
                <Link
                  href="/create"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-semibold text-center"
                >
                  {t.newAssignment}
                </Link>
              </div>
            </div>

            <div>
              {allTasks.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">📝</div>
                  <p className="text-gray-500 mb-6">{t.noTasksYet}</p>
                  <Link
                    href="/create"
                    className="inline-block bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all"
                  >
                    {t.createAssignment}
                  </Link>
                </div>
              ) : (
                <>
                  <div className="md:hidden divide-y divide-gray-200">
                    {allTasks.slice(0, 6).map((task) => {
                      const urgency = getUrgencyLevel(task.deadline);
                      return (
                        <button
                          key={`${task.assignmentId}-${task.id}`}
                          type="button"
                          className="w-full text-left p-4 hover:bg-gray-50 transition-colors"
                          onClick={() => router.push(`/roadmap/${task.assignmentId}`)}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center space-x-2 min-w-0">
                              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${getUrgencyColor(urgency)}`} />
                              <span className="font-semibold text-gray-900 truncate">{task.title}</span>
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${
                              task.status === "active"
                                ? "bg-orange-100 text-orange-700"
                                : "bg-blue-100 text-blue-700"
                            }`}>
                              {task.status === "active" ? t.timelineActive : t.timelineUpcoming}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2 truncate">{task.subject}</p>
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center space-x-1.5">
                              <Clock size={14} className={urgency === "high" ? "text-red-600" : "text-gray-400"} />
                              <span className={`font-semibold ${urgency === "high" ? "text-red-600" : "text-gray-700"}`}>
                                {getTimeRemaining(task.deadline)}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1 text-orange-600 font-bold">
                              <TrendingDown size={14} />
                              <span>{task.pointsDeposited}</span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{t.tableTask}</th>
                          <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{t.tableSubject}</th>
                          <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{t.tableDeadline}</th>
                          <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{t.tablePointsAtRisk}</th>
                          <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{t.tableStatus}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {allTasks.slice(0, 6).map((task) => {
                          const urgency = getUrgencyLevel(task.deadline);
                          return (
                            <tr
                              key={`${task.assignmentId}-${task.id}`}
                              className="hover:bg-gray-50 cursor-pointer transition-colors"
                              onClick={() => router.push(`/roadmap/${task.assignmentId}`)}
                            >
                              <td className="px-4 lg:px-6 py-4">
                                <div className="flex items-center space-x-2">
                                  <span className={`w-2 h-2 rounded-full ${getUrgencyColor(urgency)}`}></span>
                                  <span className="font-semibold text-gray-900">{task.title}</span>
                                </div>
                              </td>
                              <td className="px-4 lg:px-6 py-4 text-sm text-gray-600">{task.subject}</td>
                              <td className="px-4 lg:px-6 py-4">
                                <div className="flex items-center space-x-2">
                                  <Clock size={14} className={urgency === "high" ? "text-red-600" : "text-gray-400"} />
                                  <span className={`text-sm font-semibold ${
                                    urgency === "high" ? "text-red-600" : "text-gray-700"
                                  }`}>
                                    {getTimeRemaining(task.deadline)}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 lg:px-6 py-4">
                                <div className="flex items-center space-x-1 text-orange-600">
                                  <TrendingDown size={16} />
                                  <span className="font-bold">{task.pointsDeposited}</span>
                                </div>
                              </td>
                              <td className="px-4 lg:px-6 py-4">
                                <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                                  task.status === "active"
                                    ? "bg-orange-100 text-orange-700"
                                    : "bg-blue-100 text-blue-700"
                                }`}>
                                  {task.status === "active" ? t.timelineActive : t.timelineUpcoming}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 mb-4">{t.thisWeek}</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <span className="text-sm text-gray-600">{t.tasksCompleted}</span>
                <span className="text-xl font-bold text-green-600">8</span>
              </div>
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <span className="text-sm text-gray-600">{t.pointsReclaimed}</span>
                <div className="flex items-center space-x-1 text-green-600">
                  <TrendingUp size={16} />
                  <span className="text-xl font-bold">1,240</span>
                </div>

              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{t.currentStreak}</span>
                <span className="text-xl font-bold text-orange-600">12 {t.days} 🔥</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-xl shadow-lg p-6 text-white">
            <Calendar className="mb-3" size={28} />
            <h3 className="font-bold text-lg mb-2">{t.nextDeadline}</h3>
            {allTasks.length > 0 ? (
              <>
                <p className="text-sm opacity-90 mb-1">{allTasks[0].title}</p>
                <p className="text-2xl font-bold">{getTimeRemaining(allTasks[0].deadline)}</p>
                <div className="mt-4 pt-4 border-t border-white border-opacity-20">
                  <div className="flex items-center justify-between text-sm">
                    <span className="opacity-90">{t.atStake}</span>
                    <span className="font-bold text-yellow-300">{allTasks[0].pointsDeposited} pts</span>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm opacity-90">{t.noUpcomingDeadlines}</p>
            )}
          </div>

          {assignments.length > 0 && (
            <Link href={`/roadmap/${assignments[0].id}`}>
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-5 text-white hover:from-indigo-600 hover:to-purple-700 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <Zap size={24} />
                  <span className="text-xs font-semibold uppercase opacity-75">{t.quickAction}</span>
                </div>
                <p className="font-bold">{t.viewFullRoadmap}</p>
                <p className="text-sm opacity-90 mt-1">{t.seeAllMicro}</p>
              </div>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
