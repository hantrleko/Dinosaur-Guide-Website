import { useEffect, useState } from "react";

export interface StaticSubtitleCue {
  startMs: number;
  endMs: number;
  text: string;
}

export type StaticAction = "feeding" | "running" | "resting";
export type StaticProviderStatus = "success" | "demo" | "failed" | "skipped";

export interface StaticBehaviorFrame {
  index: number;
  url: string;
}

export interface StaticBehaviorClip {
  action: StaticAction;
  title: string;
  status: StaticProviderStatus;
  source: "canva" | "gamma" | "demo";
  posterUrl: string;
  frames: StaticBehaviorFrame[];
  animationUrl?: string;
  animationWebmUrl?: string;
  prompt?: string;
  canvaEditableUrl?: string;
  error?: string;
}

export interface StaticAudioTrack {
  status: StaticProviderStatus;
  provider: "elevenlabs" | "demo";
  audioUrl?: string;
  transcript: string;
  subtitlesUrl: string;
  subtitles: StaticSubtitleCue[];
  durationMs?: number;
  error?: string;
}

export interface StaticDeckSummary {
  title: string;
  sections: Array<{
    title: string;
    facts: string[];
  }>;
}

export interface StaticMediaManifest {
  dinoId: string;
  nameCn: string;
  nameLatin: string;
  generatedAt: string;
  source: "static-media-v2";
  narration?: StaticAudioTrack;
  dinoVoice?: StaticAudioTrack;
  gamma?: {
    status: StaticProviderStatus;
    provider: "gamma" | "demo";
    title: string;
    deckUrl?: string;
    pdfUrl?: string;
    gammaUrl?: string;
    exportUrl?: string;
    summary: StaticDeckSummary;
    error?: string;
  };
  canva?: {
    status: StaticProviderStatus;
    provider: "canva" | "demo";
    title: string;
    posterUrl?: string;
    editableUrl?: string;
    promptUrl?: string;
    importText: string;
    behaviorClips?: StaticBehaviorClip[];
    error?: string;
  };
  descript?: {
    status: StaticProviderStatus;
    provider: "descript";
    projectUrl?: string;
    publishUrl?: string;
    transcriptUrl?: string;
    error?: string;
  };
  visual?: {
    behaviorClips?: StaticBehaviorClip[];
  };
}

export interface StaticMediaIndex {
  generatedAt: string;
  source: "static-media-v2";
  defaultDinoIds: string[];
  items: Record<
    string,
    {
      dinoId: string;
      nameCn: string;
      manifestUrl: string;
      hasNarration: boolean;
      hasDinoVoice: boolean;
      hasDeck: boolean;
      hasCanva: boolean;
      hasBehaviorClips: boolean;
      hasDescript: boolean;
    }
  >;
}

function useStaticJson<T>(url: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!url) {
      setData(null);
      setError(null);
      return;
    }

    const controller = new AbortController();
    fetch(url, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Static media HTTP ${response.status}`);
        }
        return response.json() as Promise<T>;
      })
      .then((payload) => {
        setData(payload);
        setError(null);
      })
      .catch((fetchError) => {
        if ((fetchError as Error).name === "AbortError") return;
        setData(null);
        setError(fetchError as Error);
      });

    return () => controller.abort();
  }, [url]);

  return { data, error };
}

export function useStaticMediaIndex() {
  return useStaticJson<StaticMediaIndex>("/static-media/index.json");
}

export function useStaticMediaManifest(dinoId: string) {
  return useStaticJson<StaticMediaManifest>(
    dinoId ? `/static-media/${dinoId}/manifest.json` : null,
  );
}
