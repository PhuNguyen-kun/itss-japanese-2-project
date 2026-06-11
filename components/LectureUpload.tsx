"use client";

import { useRef } from "react";
import { Upload, FileText, X } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface LectureUploadProps {
  files: File[];
  onChange: (files: File[]) => void;
}

export function LectureUpload({ files, onChange }: LectureUploadProps) {
  const { t } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (incoming: FileList | null) => {
    if (!incoming?.length) return;
    const pdfs = Array.from(incoming).filter(
      (f) => !f.type || f.type === "application/pdf"
    );
    if (!pdfs.length) return;
    onChange([...files, ...pdfs]);
  };

  const removeFile = (index: number) => {
    onChange(files.filter((_, i) => i !== index));
  };

  const totalSizeMb = files.reduce((sum, f) => sum + f.size, 0) / 1024 / 1024;

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {t.lectureUpload}
      </label>
      <div
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors"
      >
        <Upload className="mx-auto text-gray-400 mb-3" size={40} />
        <p className="font-semibold text-gray-700">{t.lectureUploadHint}</p>
        <p className="text-xs text-gray-500 mt-1">{t.lectureUploadSub}</p>
        {files.length > 0 && (
          <p className="text-xs text-indigo-600 mt-2 font-semibold">
            {files.length} {t.lectureFilesCount} · {totalSizeMb.toFixed(1)} MB
          </p>
        )}
      </div>

      {files.length > 0 && (
        <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-2 min-w-0">
                <FileText className="text-indigo-600 flex-shrink-0" size={18} />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="p-1 hover:bg-gray-200 rounded-full flex-shrink-0"
              >
                <X size={16} className="text-gray-500" />
              </button>
            </div>
          ))}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,application/pdf"
        multiple
        className="hidden"
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
