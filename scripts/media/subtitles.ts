import type { SubtitleCue } from "./types.ts";

export function splitSubtitles(text: string): SubtitleCue[] {
  const parts = text
    .split(/([。！？!?；;]\s*)/)
    .reduce<string[]>((acc, part) => {
      const last = acc[acc.length - 1];
      if (/^[。！？!?；;]\s*$/.test(part) && last) {
        acc[acc.length - 1] = `${last}${part.trim()}`;
      } else if (part.trim()) {
        acc.push(part.trim());
      }
      return acc;
    }, []);

  let cursor = 0;
  return parts.map((part) => {
    const durationMs = Math.max(900, part.length * 95);
    const cue = {
      startMs: cursor,
      endMs: cursor + durationMs,
      text: part,
    };
    cursor += durationMs;
    return cue;
  });
}
