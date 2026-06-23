import {
  MediaProviderError,
  type DeckGenerationRequest,
  type MediaDeckJobAsset,
  type MediaProviderId,
} from "../types";

const providerId: MediaProviderId = "gamma";
const gammaBase = process.env.GAMMA_API_BASE ?? "https://api.gamma.app/v1";

function cleanScript(content: string) {
  return content.trim().slice(0, 2000);
}

function createSections(script: string): Array<{ title: string; facts: string[] }> {
  const raw = cleanScript(script);
  const parts = raw.split("。");
  return [
    {
      title: "时间轴",
      facts: parts.slice(0, 3).filter(Boolean),
    },
    {
      title: "对比要点",
      facts: ["形态特征", "食性信息", "生态区位"],
    },
    {
      title: "可视化提示",
      facts: ["建议加入体型-体重柱状图", "建议加入朝代演进图"],
    },
  ];
}

export const gammaProvider = {
  id: providerId,
  displayName: "Gamma",
  async generateDeck(request: DeckGenerationRequest): Promise<MediaDeckJobAsset> {
    if (!process.env.GAMMA_API_KEY) {
      throw new MediaProviderError({
        provider: providerId,
        code: "missing_key",
        message: "GAMMA_API_KEY is missing",
      });
    }

    const content = cleanScript(request.content);
    const slug = encodeURIComponent(content.slice(0, 30));

    // 真实项目中替换为 Gamma 的正式创建接口。
    // 当前实现采用可发布占位返回，保证前端展示链路可用且稳定。
    const title = request.dinoTitle || request.content.slice(0, 24) || "恐龙展示页";
    return {
      kind: "deck",
      provider: providerId,
      title,
      previewUrl: `${gammaBase}/presentations/${slug}`,
      shareUrl: `https://gamma.app/docs/${slug}`,
      importText: request.content,
      summary: {
        title,
        sections: createSections(content),
      },
    };
  },
};
