import {
  MediaProviderError,
  type DeckGenerationRequest,
  type MediaDeckJobAsset,
  type MediaProviderId,
} from "../types";

const providerId: MediaProviderId = "canva";

function buildImportText(content: string) {
  return [
    "# 恐龙展示素材",
    "## 关键参数",
    content,
    "",
    "## 可直接用于 Canva",
    "- 时代",
    "- 地理分布",
    "- 长度/体重",
    "- 图像与颜色建议",
  ].join("\n");
}

export const canvaProvider = {
  id: providerId,
  displayName: "Canva",
  async generateDeck(request: DeckGenerationRequest): Promise<MediaDeckJobAsset> {
    if (!process.env.CANVA_API_KEY) {
      // 没有 API Key 时走本地模板化兜底，避免阻断前端展示。
      return this.generateCanvaVariant(request);
    }

    // 真实场景可在此接入 Canva 导出模板/可编辑链接接口。
    return this.generateCanvaVariant(request);
  },
  async generateCanvaVariant(request: DeckGenerationRequest): Promise<MediaDeckJobAsset> {
    const title = request.dinoTitle || request.content.slice(0, 24) || "恐龙展示页";
    const token = encodeURIComponent(title);
    return {
      kind: "deck",
      provider: providerId,
      title,
      previewUrl: `https://www.canva.com/design/${token}`,
      canvaEditableUrl: `https://www.canva.com/design/${token}`,
      importText: buildImportText(request.content),
      summary: {
        title,
        sections: [
          {
            title: "Canva 视觉资产",
            facts: ["主色：橙-褐搭配", "推荐标题字体：无衬线粗体", "支持后续一键编辑"],
          },
          {
            title: "适配说明",
            facts: [
              "未配置 API 时返回本地可导入文本",
              "支持一键复制到 Canva 素材面板",
            ],
          },
        ],
      },
    };
  },
};
