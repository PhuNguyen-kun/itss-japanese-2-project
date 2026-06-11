"use client";

import katex from "katex";
import "katex/dist/katex.min.css";
import { parseMathSegments } from "@/lib/mathRender";

interface MathTextProps {
  text: string;
  className?: string;
  block?: boolean;
}

function renderLatex(latex: string, displayMode: boolean): string {
  try {
    return katex.renderToString(latex, {
      throwOnError: false,
      displayMode,
      strict: "ignore",
    });
  } catch {
    return latex;
  }
}

export function MathText({ text, className = "", block = false }: MathTextProps) {
  const segments = parseMathSegments(text);

  if (segments.length === 1 && segments[0].type === "text") {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={`${className} ${block ? "block" : "inline"}`}>
      {segments.map((seg, i) =>
        seg.type === "math" ? (
          <span
            key={i}
            className={block ? "block my-2 overflow-x-auto" : "inline mx-0.5"}
            dangerouslySetInnerHTML={{
              __html: renderLatex(seg.content, block),
            }}
          />
        ) : (
          <span key={i}>{seg.content}</span>
        )
      )}
    </span>
  );
}
