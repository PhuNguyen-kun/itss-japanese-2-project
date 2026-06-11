/** Convert common Unicode math symbols to LaTeX */
export function toLatexFragment(text: string): string {
  return text
    .replace(/Σ/g, "\\sum")
    .replace(/∑/g, "\\sum")
    .replace(/∞/g, "\\infty")
    .replace(/≤/g, "\\leq")
    .replace(/≥/g, "\\geq")
    .replace(/≠/g, "\\neq")
    .replace(/×/g, "\\times")
    .replace(/÷/g, "\\div")
    .replace(/√/g, "\\sqrt")
    .replace(/π/g, "\\pi")
    .replace(/α/g, "\\alpha")
    .replace(/β/g, "\\beta")
    .replace(/γ/g, "\\gamma")
    .replace(/θ/g, "\\theta")
    .replace(/λ/g, "\\lambda")
    .replace(/→/g, "\\rightarrow")
    .replace(/←/g, "\\leftarrow")
    .trim();
}

/** Wrap pseudo-LaTeX segments (Σ_{...}^{...}) in $ delimiters for rendering */
export function wrapInlineMath(text: string): string {
  if (text.includes("$")) return text;

  // Patterns like Σ_{n=1}^{∞} (1 / (n(n+1)))
  const mathPattern =
    /((?:Σ|∑|∫|√|∞|\\sum|\\int|\\sqrt)[\s\S]*?(?:\([^)]*\))?)/g;

  return text.replace(mathPattern, (match) => {
    const trimmed = match.trim();
    if (!trimmed || trimmed.length < 2) return match;
    return `$${toLatexFragment(trimmed)}$`;
  });
}

export type MathSegment = { type: "text" | "math"; content: string };

export function parseMathSegments(text: string): MathSegment[] {
  const normalized = wrapInlineMath(text);
  const segments: MathSegment[] = [];
  const regex = /\$\$([\s\S]+?)\$\$|\$([^$]+?)\$/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(normalized)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        type: "text",
        content: normalized.slice(lastIndex, match.index),
      });
    }
    segments.push({
      type: "math",
      content: toLatexFragment(match[1] ?? match[2]),
    });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < normalized.length) {
    segments.push({ type: "text", content: normalized.slice(lastIndex) });
  }

  if (segments.length === 0) {
    segments.push({ type: "text", content: text });
  }

  return segments;
}
