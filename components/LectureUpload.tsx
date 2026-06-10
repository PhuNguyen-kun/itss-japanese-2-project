"use client";

import { useRef } from "react";
import { Upload, FileText, X } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface LectureUploadProps {
  file: File | null;
  onChange: (file: File | null) => void;
}

export function LectureUpload({ file, onChange }: LectureUploadProps) {
  const { t } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {t.lectureUpload}
      </label>
      <div
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors"
      >
        {file ? (
          <div className="flex items-center justify-center space-x-3">
            <FileText className="text-indigo-600" size={32} />
            <div className="text-left">
              <p className="font-semibold text-gray-900">{file.name}</p>
              <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
              }}
              className="p-1 hover:bg-gray-200 rounded-full"
            >
              <X size={18} className="text-gray-500" />
            </button>
          </div>
        ) : (
          <>
            <Upload className="mx-auto text-gray-400 mb-3" size={40} />
            <p className="font-semibold text-gray-700">{t.lectureUploadHint}</p>
            <p className="text-xs text-gray-500 mt-1">{t.lectureUploadSub}</p>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}
