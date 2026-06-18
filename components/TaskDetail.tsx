"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock, TrendingDown, TrendingUp, AlertCircle, Sparkles } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface TaskDetailProps {
  taskId: string;
}

export function TaskDetail({ taskId }: TaskDetailProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const [showConfetti, setShowConfetti] = useState(false);

  const task = {
    id: parseInt(taskId || "1"),
    title: "Research Phase",
    description: "Gather sources and literature review for your final paper",
    subject: "Software Engineering",
    deadline: new Date("2026-04-25T23:59:00"),
    pointsDeposited: 150,
    status: "active",
    checklistItems: [
      { id: 1, text: "Find 10+ academic sources", completed: true },
      { id: 2, text: "Read and annotate key papers", completed: true },
      { id: 3, text: "Create bibliography", completed: false },
      { id: 4, text: "Write summary notes", completed: false },
    ],
  };

  const completedItems = task.checklistItems.filter(i => i.completed).length;
  const progress = (completedItems / task.checklistItems.length) * 100;

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

  const handleComplete = () => {
    setShowConfetti(true);
    setTimeout(() => {
      router.push("/");
    }, 2000);
  };

  return (
    <div className="p-4 space-y-6 relative">
      {showConfetti && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
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

      <div className="pt-4">
        <button
          onClick={() => router.back()}
          className="text-indigo-600 font-semibold mb-4"
        >
          {t.back}
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{task.title}</h1>
        <p className="text-gray-600 mt-1">{task.subject}</p>
      </div>

      <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-3">
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

        <div className="bg-white/20 rounded-lg p-3 mt-3 text-white">
          <p className="text-sm">
            💡 {t.completeTaskNote} {task.pointsDeposited} {t.pointsSuffix}!
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-5 shadow-md border border-gray-200">
        <h2 className="font-bold text-gray-900 mb-3">{t.description}</h2>
        <p className="text-gray-700">{task.description}</p>
      </div>

      <div className="bg-white rounded-xl p-5 shadow-md border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900">{t.taskChecklist}</h2>
          <span className="text-sm text-gray-600">
            {completedItems}/{task.checklistItems.length} {t.done}
          </span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div
            className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        <div className="space-y-3">
          {task.checklistItems.map((item) => (
            <div
              key={item.id}
              className={`flex items-start space-x-3 p-3 rounded-lg ${
                item.completed ? "bg-green-50" : "bg-gray-50"
              }`}
            >
              {item.completed ? (
                <CheckCircle2 className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
              ) : (
                <div className="w-5 h-5 border-2 border-gray-300 rounded flex-shrink-0 mt-0.5"></div>
              )}
              <span
                className={`text-sm ${
                  item.completed ? "text-green-900 line-through" : "text-gray-700"
                }`}
              >
                {item.text}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 flex items-start space-x-3">
        <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
        <div>
          <p className="text-sm font-semibold text-amber-900">{t.warningPointLoss}</p>
          <p className="text-xs text-amber-700 mt-1">
            {t.warningDesc1} {task.pointsDeposited} {t.warningDesc2}
          </p>
        </div>
      </div>

      <button
        onClick={handleComplete}
        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center space-x-2 hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg"
      >
        <CheckCircle2 size={24} />
        <span>{t.completeTaskBtn} {task.pointsDeposited} {t.pointsSuffix}</span>
        <Sparkles size={20} />
      </button>
    </div>
  );
}
