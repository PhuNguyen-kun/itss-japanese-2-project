import { useLanguage } from "../context/LanguageContext";

interface PointDistributionPreviewProps {
  difficulty: "easy" | "medium" | "hard";
}

export function PointDistributionPreview({ difficulty }: PointDistributionPreviewProps) {
  const { t } = useLanguage();
  const milestoneCount = { easy: 4, medium: 6, hard: 8 }[difficulty];
  const basePoints = { easy: 100, medium: 120, hard: 150 }[difficulty];

  const points = Array.from({ length: milestoneCount }, (_, index) => {
    const pointMultiplier = 1 + (index / milestoneCount) * 2.5;
    return Math.round(basePoints * pointMultiplier);
  });

  const maxPoints = Math.max(...points);
  const multiplier = Math.round(points[points.length - 1] / points[0]);

  return (
    <div className="bg-white rounded-xl p-4 border-2 border-indigo-200">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">{t.pointDistTitle}</h3>

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
