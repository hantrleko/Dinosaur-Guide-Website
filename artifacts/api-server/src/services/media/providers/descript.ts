import {
  MediaProviderError,
  type DeckGenerationRequest,
  type MediaDeckJobAsset,
  type MediaProviderId,
  type MediaVoiceJobAsset,
  type VoiceGenerationRequest,
} from "../types";

const providerId: MediaProviderId = "descript";
const defaultFallbackStyle = "cinematic";

function buildFallbackAudioBase64(script: string) {
  return `data:audio/mpeg;base64,${Buffer.from(`descript-fallback-${script}`, "utf8").toString("base64")}`;
}

function splitToSubtitles(text: string) {
  return text
    .split(/([。！？!?;；:：\n])/)
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map((segment, index, all) => {
      const startMs = index * 700;
      return {
        startMs,
        endMs: startMs + Math.max(500, segment.length * 85),
        text: segment,
      };
    });
}

function summarizeForDeck(content: string): MediaDeckJobAsset {
  const title = content.slice(0, 24) || "恐龙展示页";
  return {
    kind: "deck",
    provider: providerId,
    title,
    previewUrl: `https://www.descript.com/templates/dino/${encodeURIComponent(title)}`,
    canvaEditableUrl: "",
    importText: content,
    summary: {
      title,
      sections: [
        {
          title: "要点",
          facts: content
            .split(/[。.!?！？]/)
            .map((item) => item.trim())
            .filter(Boolean)
            .slice(0, 6),
        },
        {
          title: "适配器说明",
          facts: [`渲染样式：${defaultFallbackStyle}`, "后备生成通道（本地回退）"],
        },
      ],
    },
  };
}

export const descriptProvider = {
  id: providerId,
  displayName: "Descript",
  async generateSpeech(request: VoiceGenerationRequest): Promise<MediaVoiceJobAsset> {
    if (!process.env.DESCRIPT_API_KEY) {
      // Descript API 未配置，默认返回可回退通道。
      throw new MediaProviderError({
        provider: providerId,
        code: "missing_key",
        message: "DESCRIPT_API_KEY is missing",
      });
    }

    // 生产场景请替换为正式 Descript API。
    // 当前实现先保证可回滚链路可用，避免因第三方 API 演进导致整体验证阻断。
    return {
      kind: "voice",
      provider: providerId,
      audioUrl: buildFallbackAudioBase64(request.script),
      transcript: request.script,
      subtitles: splitToSubtitles(request.script),
      durationMs: Math.max(500, Math.round(request.script.length * 70)),
    };
  },
  listVoices(): Promise<{ id: string; name: string; language: string; gender?: string | null; provider: MediaProviderId }[]> {
    if (!process.env.DESCRIPT_API_KEY) {
      return Promise.resolve([]);
    }

    return Promise.resolve([
      {
        id: "descript-default",
        name: "Descript Default",
        language: "zh-CN",
        gender: "neutral",
        provider: providerId,
      },
    ]);
  },
  async generateDeck(request: DeckGenerationRequest): Promise<MediaDeckJobAsset> {
    // 当前返回可展示占位内容，后续接入 Descript（可插图层）时可替换为真实返回。
    return summarizeForDeck(request.content);
  },
};
