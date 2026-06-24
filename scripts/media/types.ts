export type StaticProviderStatus = "success" | "demo" | "failed" | "skipped";

export interface DinoInput {
  id: string;
  nameCn: string;
  nameLatin: string;
  era: string;
  diet: string;
  lengthM: number;
  weightTons: number;
  region: string;
  description: string;
  funFact: string;
  imageUrl: string;
}

export interface SubtitleCue {
  startMs: number;
  endMs: number;
  text: string;
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
  source: "static-media-v1";
  narration?: {
    status: StaticProviderStatus;
    provider: "elevenlabs" | "demo";
    audioUrl?: string;
    transcript: string;
    subtitlesUrl: string;
    subtitles: SubtitleCue[];
    durationMs?: number;
    error?: string;
  };
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
}

export interface StaticMediaIndex {
  generatedAt: string;
  source: "static-media-v1";
  defaultDinoIds: string[];
  items: Record<
    string,
    {
      dinoId: string;
      nameCn: string;
      manifestUrl: string;
      hasNarration: boolean;
      hasDeck: boolean;
      hasCanva: boolean;
      hasDescript: boolean;
    }
  >;
}
