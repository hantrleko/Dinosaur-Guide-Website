import type { SubtitleCue } from "./types.ts";

export function splitSubtitles(text: string, opts?: { maxChars?: number }): SubtitleCue[] {
  const maxChars = opts?.maxChars ?? 30;

  const rawParts = text
    .split(/([。！？!?；;:\n]\s*)/)
    .reduce<string[]>((acc, part) => {
      const last = acc[acc.length - 1];
      if (/^[。！？!?；;:\n]\s*$/.test(part) && last) {
        acc[acc.length - 1] = `${last}${part.trim()}`;
      } else if (part.trim()) {
        acc.push(part.trim());
      }
      return acc;
    }, []);

  const splitParts = rawParts.flatMap((part) => {
    if (part.length <= maxChars) return [part];
    const chunks: string[] = [];
    let rest = part;
    while (rest.length > maxChars) {
      let point = rest.lastIndexOf("，", maxChars);
      if (point < maxChars * 0.4) {
        point = maxChars;
      }
      chunks.push(rest.slice(0, point));
      rest = rest.slice(point).trim();
    }
    if (rest) chunks.push(rest);
    return chunks;
  });

  let cursor = 0;
  return splitParts.map((part) => {
    const clean = part.trim();
    const durationMs = Math.max(900, Math.min(6500, clean.length * 88));
    const cue = {
      startMs: cursor,
      endMs: cursor + durationMs,
      text: clean,
    };
    cursor += durationMs;
    return cue;
  });
}
