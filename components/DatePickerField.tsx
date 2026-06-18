"use client";

import { useEffect, useId, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";
import { enUS, vi } from "date-fns/locale";
import { format, startOfDay } from "date-fns";
import { Calendar, ChevronDown } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import "react-day-picker/style.css";

function parseDateOnly(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

interface DatePickerFieldProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  minDate?: Date;
}

export function DatePickerField({
  id,
  value,
  onChange,
  required,
  minDate,
}: DatePickerFieldProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const { language, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const locale = language === "vi" ? vi : enUS;
  const today = startOfDay(minDate ?? new Date());
  const selected = value ? parseDateOnly(value) : undefined;

  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const displayValue = selected
    ? format(selected, "PPP", { locale })
    : t.datePickerPlaceholder;

  return (
    <div ref={containerRef} className="relative">
      <button
        id={fieldId}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className={`w-full flex items-center gap-2 pl-12 pr-4 py-3 border rounded-lg text-left text-sm sm:text-base transition-colors bg-white ${
          open
            ? "border-indigo-500 ring-2 ring-indigo-200"
            : "border-gray-300 hover:border-gray-400"
        } focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200`}
      >
        <Calendar
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          size={20}
        />
        <span className={`flex-1 truncate ${value ? "text-gray-900" : "text-gray-400"}`}>
          {displayValue}
        </span>
        <ChevronDown
          size={16}
          className={`text-gray-400 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      <input
        tabIndex={-1}
        aria-hidden
        value={value}
        onChange={() => {}}
        required={required}
        className="absolute opacity-0 w-0 h-0 pointer-events-none"
      />

      {open && (
        <div
          role="dialog"
          aria-label={t.finalDeadline}
          className="date-picker-popover absolute z-50 mt-2 left-0 right-0 sm:right-auto bg-white rounded-xl border border-gray-200 shadow-xl p-2 sm:p-3"
        >
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={(date) => {
              if (!date) return;
              onChange(format(date, "yyyy-MM-dd"));
              setOpen(false);
            }}
            locale={locale}
            disabled={{ before: today }}
            defaultMonth={selected ?? today}
            showOutsideDays
          />
        </div>
      )}
    </div>
  );
}
