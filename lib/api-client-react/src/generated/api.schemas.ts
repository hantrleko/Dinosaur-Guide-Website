export interface HealthStatus {
  status: string;
}

export interface ErrorResponse {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface Dinosaur {
  id: string;
  nameCn: string;
  nameLatin: string;
  era: "三叠纪" | "侏罗纪" | "白垩纪";
  diet: "肉食" | "草食" | "杂食";
  lengthM: number;
  weightTons: number;
  region: string;
  description: string;
  funFact: string;
  imageUrl: string;
}

export interface DinoListResponse {
  items: Dinosaur[];
}

export interface VoiceCatalogItem {
  id: string;
  name: string;
  gender?: string | null;
  language: string;
  provider: string;
}

export interface VoiceCatalogResponse {
  voices: VoiceCatalogItem[];
}

export interface SubtitleCue {
  startMs: number;
  endMs: number;
  text: string;
}

export interface DeckSection {
  title: string;
  facts: string[];
}

export interface DeckSummary {
  title: string;
  sections: DeckSection[];
}

export interface VoiceGenerationRequest {
  dinoId?: string | null;
  script: string;
  voiceId?: string;
  speed?: number;
  provider?: string;
}

export interface DeckGenerationRequest {
  dinoId?: string | null;
  content: string;
  style?: string;
  provider?: string;
}

export interface VoiceJobAsset {
  provider: string;
  kind: "voice";
  audioUrl: string;
  transcript: string;
  subtitles?: SubtitleCue[];
  durationMs?: number;
}

export interface DeckJobAsset {
  provider: string;
  kind: "deck";
  title: string;
  previewUrl: string;
  shareUrl?: string;
  canvaEditableUrl?: string;
  importText?: string;
  summary?: DeckSummary;
}

export interface MediaVoiceJob {
  id: string;
  type: "voice";
  status: "queued" | "running" | "completed" | "failed";
  progress: number;
  dinoId: string | null;
  provider?: string | null;
  createdAt: string;
  updatedAt: string;
  request: VoiceGenerationRequest;
  errorCode?: string | null;
  errorMessage?: string | null;
  asset?: VoiceJobAsset | null;
}

export interface MediaDeckJob {
  id: string;
  type: "deck";
  status: "queued" | "running" | "completed" | "failed";
  progress: number;
  dinoId: string | null;
  provider?: string | null;
  createdAt: string;
  updatedAt: string;
  request: DeckGenerationRequest;
  errorCode?: string | null;
  errorMessage?: string | null;
  asset?: DeckJobAsset | null;
}

export interface MediaJobSummary {
  id: string;
  type: "voice" | "deck";
  status: "queued" | "running" | "completed" | "failed";
  progress: number;
  dinoId: string | null;
  provider?: string | null;
  createdAt: string;
  updatedAt: string;
  errorCode?: string | null;
  errorMessage?: string | null;
}

export interface MediaJobListResponse {
  items: MediaJobSummary[];
}
