"use client";

import { useLanguage } from "@/context/LanguageContext";
import { difficultyToMilestoneCount, distributePoints } from "@/lib/pointDistribution";

interface PointDistributionPreviewProps {
  difficulty: number;
  depositPoints: number;
}

export function PointDistributionPreview({
  difficulty,
  depositPoints,
}: PointDistributionPreviewProps) {
  const { t } = useLanguage();
  const milestoneCount = difficultyToMilestoneCount(difficulty);
  const points = distributePoints(depositPoints, milestoneCount);
  const maxPoints = Math.max(...points);

  return (
    <div className="bg-white rounded-xl p-4 border-2 border-indigo-200">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">{t.pointDistTitle}</h3>
      <p className="text-xs text-gray-500 mb-3">
        {milestoneCount} {t.tasks} · {depositPoints} {t.pointsSuffix}
      </p>

      <div className="flex items-end justify-between space-x-1 h-24 mb-2">
        {points.map((point, index) => (
          <div key={index} className="flex-1 flex flex-col items-center justify-end">
            <div
              className="w-full bg-gradient-to-t from-orange-500 via-yellow-400 to-yellow-300 rounded-t transition-all"
              style={{ height: `${(point / maxPoints) * 100}%` }}
            ></div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
        {points.map((point, index) => (
          <div key={index} className="flex-1 text-center font-semibold text-[10px]">
            {point}
          </div>
        ))}
      </div>

      <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
        <p className="text-xs text-orange-900">
          <span className="font-semibold">⚡ {t.pointDistPsych}</span>
        </p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="bg-green-50 rounded p-2 border border-green-200">
          <div className="font-semibold text-green-900">{t.pointDistEarlyLabel}</div>
          <div className="text-green-700">{points[0]} pts</div>
        </div>
        <div className="bg-red-50 rounded p-2 border border-red-200">
          <div className="font-semibold text-red-900">{t.pointDistFinalLabel}</div>
          <div className="text-red-700">{points[points.length - 1]} pts</div>
        </div>
      </div>
    </div>
  );
}
