export type StaticProviderStatus = "success" | "demo" | "failed" | "skipped";

export type StaticAction = "feeding" | "running" | "resting";
export type StaticVoiceProvider = "elevenlabs" | "demo";
export type StaticVisualSource = "canva" | "gamma" | "demo";

export interface StaticBehaviorFrame {
  index: number;
  url: string;
}

export interface StaticBehaviorClip {
  action: StaticAction;
  title: string;
  status: StaticProviderStatus;
  source: StaticVisualSource;
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
  provider: StaticVoiceProvider;
  audioUrl: string;
  transcript: string;
  subtitlesUrl: string;
  subtitles: SubtitleCue[];
  durationMs?: number;
  error?: string;
}

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
    error?: string;
    behaviorClips?: Array<StaticBehaviorClip>;
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
    behaviorClips?: Array<StaticBehaviorClip>;
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
