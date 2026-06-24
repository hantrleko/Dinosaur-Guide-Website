import { copyFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { DinoInput, StaticMediaManifest } from "./types.ts";

function canvaImportText(dino: DinoInput) {
  return [
    `${dino.nameCn} / ${dino.nameLatin}`,
    `时代：${dino.era}`,
    `食性：${dino.diet}`,
    `体长：${dino.lengthM}米`,
    `体重：${dino.weightTons}吨`,
    `分布：${dino.region}`,
    `简介：${dino.description}`,
    `趣味知识：${dino.funFact}`,
  ].join("\n");
}

export async function generateCanvaAsset(params: {
  dino: DinoInput;
  outputDir: string;
  publicBase: string;
  publicDir: string;
}): Promise<StaticMediaManifest["canva"]> {
  const { dino, outputDir, publicBase, publicDir } = params;
  await mkdir(outputDir, { recursive: true });

  const sourceImage = path.join(publicDir, dino.imageUrl.replace(/^\//, ""));
  const posterPath = path.join(outputDir, "poster.png");
  await copyFile(sourceImage, posterPath);

  const prompt = [
    "Canva connector prompt:",
    `Create an editable museum-style dinosaur poster for ${dino.nameCn} (${dino.nameLatin}).`,
    "Use bold Chinese title typography, fossil texture, timeline markers, and clear stat chips.",
    canvaImportText(dino),
  ].join("\n");

  const payload = {
    status: "demo",
    mode: process.env.CANVA_STATIC_MODE || "plugin",
    generatedVia: "Canva plugin recommendation flow prepared in Codex; poster falls back to local dinosaur image until export URL is attached.",
    prompt,
  };
  await writeFile(path.join(outputDir, "canva.json"), JSON.stringify(payload, null, 2), "utf8");

  return {
    status: "demo",
    provider: "canva",
    title: `${dino.nameCn} Canva 视觉卡片`,
    posterUrl: `${publicBase}/poster.png`,
    editableUrl: process.env.CANVA_EDITABLE_URL || undefined,
    promptUrl: `${publicBase}/canva.json`,
    importText: canvaImportText(dino),
    error: process.env.CANVA_EDITABLE_URL
      ? undefined
      : "Canva plugin flow prepared; attach exported editable URL when available.",
  };
}
