"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, BookOpen, Zap, ArrowRight, Wallet } from "lucide-react";
import { createAssignment } from "@/lib/api-client";
import { PointDistributionPreview } from "./PointDistributionPreview";
import { LectureUpload } from "./LectureUpload";
import { useLanguage } from "@/context/LanguageContext";
import { formatPoints, useWallet } from "@/context/WalletContext";

export function CreateAssignment() {
  const router = useRouter();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    subject: "",
    finalDeadline: "",
    difficulty: 3,
    depositPoints: 1000,
  });
  const [pdfFiles, setPdfFiles] = useState<File[]>([]);
  const { stats, balance, refreshWallet } = useWallet();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdfFiles.length) {
      setError(t.lectureRequired);
      return;
    }
    if (formData.depositPoints > balance) {
      setError(t.insufficientBalance);
      return;
    }

    setError("");
    setIsGenerating(true);

    try {
      const fd = new FormData();
      fd.set("subject", formData.subject);
      fd.set("finalDeadline", formData.finalDeadline);
      fd.set("difficulty", String(formData.difficulty));
      fd.set("depositPoints", String(formData.depositPoints));
      pdfFiles.forEach((file) => fd.append("lecturePdfs", file));

      const assignment = await createAssignment(fd);
      await refreshWallet();
      router.push(`/roadmap/${assignment.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create");
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.createTitle}</h1>
        <p className="text-gray-600">{t.createSubtitle}</p>
      </div>

      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t.subjectCourse}
                  </label>
                  <div className="relative">
                    <BookOpen className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder={t.subjectPlaceholder}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t.finalDeadline}
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="date"
                      value={formData.finalDeadline}
                      onChange={(e) => setFormData({ ...formData, finalDeadline: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                      required
                    />
                  </div>
                </div>
              </div>

              <LectureUpload files={pdfFiles} onChange={setPdfFiles} />

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  {t.difficultyLevel} ({formData.difficulty}/5)
                </label>
                <input
                  type="range"
                  min={1}
                  max={5}
                  step={1}
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: parseInt(e.target.value, 10) })}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1 — {t.diffEasy}</span>
                  <span>5 — {t.diffHard}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t.depositAmount} ({t.availableBalance}: {formatPoints(stats?.totalBalance, !stats)})
                </label>
                <input
                  type="range"
                  min={100}
                  max={Math.min(2000, balance)}
                  step={50}
                  value={Math.min(formData.depositPoints, balance)}
                  onChange={(e) => setFormData({ ...formData, depositPoints: parseInt(e.target.value, 10) })}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>100</span>
                  <span className="text-2xl font-bold text-indigo-600 flex items-center gap-1">
                    <Wallet size={18} /> {formData.depositPoints}
                  </span>
                  <span>{Math.min(2000, balance)}</span>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
                <div className="flex items-start space-x-3">
                  <Zap className="text-blue-600 flex-shrink-0 mt-0.5" size={24} />
                  <div>
                    <p className="font-semibold text-blue-900 mb-1">{t.aiPowered}</p>
                    <p className="text-sm text-blue-700">{t.aiDesc}</p>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isGenerating || !pdfFiles.length}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-lg font-bold text-lg flex items-center justify-center space-x-2 hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{t.generatingRoadmap}</span>
                  </>
                ) : (
                  <>
                    <span>{t.generateRoadmap}</span>
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        <div className="space-y-6">
          {formData.subject && formData.finalDeadline && (
            <PointDistributionPreview
              difficulty={formData.difficulty}
              depositPoints={formData.depositPoints}
            />
          )}

          <div className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200 rounded-xl p-6">
            <h3 className="font-bold text-orange-900 mb-3">{t.howItWorks}</h3>
            <ul className="space-y-3 text-sm text-orange-800">
              <li className="flex items-start space-x-2">
                <span className="font-bold mt-0.5">1.</span>
                <span>{t.step1}</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="font-bold mt-0.5">2.</span>
                <span>{t.step2}</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="font-bold mt-0.5">3.</span>
                <span>{t.step3}</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="font-bold mt-0.5">4.</span>
                <span>{t.step4}</span>
              </li>
            </ul>
          </div>

          <div className="bg-purple-600 text-white rounded-xl p-6">
            <h3 className="font-bold mb-2">{t.lossAversion}</h3>
            <p className="text-sm opacity-90">{t.lossAversionDesc}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
