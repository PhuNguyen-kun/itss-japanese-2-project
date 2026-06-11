"use client";

import { MathText } from "./MathText";

/** Split description into readable bullet items */
export function parseDescriptionItems(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  if (trimmed.includes("\n")) {
    return trimmed
      .split("\n")
      .map((line) => line.replace(/^[-•*]\s*/, "").trim())
      .filter(Boolean);
  }

  return trimmed
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

interface TaskDescriptionProps {
  text: string;
  className?: string;
}

export function TaskDescription({ text, className = "" }: TaskDescriptionProps) {
  const items = parseDescriptionItems(text);

  if (items.length <= 1) {
    return <MathText text={text} className={`text-gray-700 text-sm leading-relaxed ${className}`} />;
  }

  return (
    <ul className={`space-y-2.5 ${className}`}>
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5 text-sm leading-relaxed">
          <span className="text-indigo-500 font-bold mt-0.5 flex-shrink-0">•</span>
          <MathText text={item} className="text-gray-700 flex-1" />
        </li>
      ))}
    </ul>
  );
}
