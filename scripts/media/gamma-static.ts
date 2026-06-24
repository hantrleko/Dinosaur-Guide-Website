import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { DinoInput, StaticDeckSummary, StaticMediaManifest } from "./types.ts";

function buildSummary(dino: DinoInput): StaticDeckSummary {
  return {
    title: `${dino.nameCn} 展示页`,
    sections: [
      {
        title: "核心参数",
        facts: [
          `${dino.era} · ${dino.diet}`,
          `体长约 ${dino.lengthM} 米，体重约 ${dino.weightTons} 吨`,
          `主要分布：${dino.region}`,
        ],
      },
      {
        title: "视觉建议",
        facts: ["体型对比图", "时代时间线", "栖息地背景"],
      },
      {
        title: "讲述重点",
        facts: [dino.description, dino.funFact],
      },
    ],
  };
}

function deckHtml(dino: DinoInput, summary: StaticDeckSummary) {
  const facts = summary.sections
    .map(
      (section) => `
        <section>
          <h2>${section.title}</h2>
          <ul>${section.facts.map((fact) => `<li>${fact}</li>`).join("")}</ul>
        </section>`,
    )
    .join("");

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${summary.title}</title>
  <style>
    body { margin: 0; font-family: "Noto Sans SC", "Microsoft YaHei", sans-serif; color: #f8f1df; background: #15110c; }
    main { min-height: 100vh; padding: 40px; background: radial-gradient(circle at top left, rgba(245, 158, 11, .28), transparent 34%), linear-gradient(135deg, #1d1710, #090806); }
    h1 { font-size: clamp(40px, 8vw, 92px); margin: 0; }
    .latin { color: #f2b35b; font-style: italic; font-size: 24px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 18px; margin-top: 34px; }
    section { border: 1px solid rgba(255,255,255,.14); background: rgba(255,255,255,.06); padding: 22px; border-radius: 14px; }
    h2 { margin-top: 0; color: #f59e0b; }
    li { margin: 10px 0; line-height: 1.6; }
  </style>
</head>
<body>
  <main>
    <p>${dino.era} / ${dino.diet} / ${dino.region}</p>
    <h1>${dino.nameCn}</h1>
    <p class="latin">${dino.nameLatin}</p>
    <div class="grid">${facts}</div>
  </main>
</body>
</html>`;
}

async function downloadExport(url: string, outputPath: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Gamma export download HTTP ${response.status}`);
  }
  await writeFile(outputPath, Buffer.from(await response.arrayBuffer()));
}

export async function generateGammaDeck(params: {
  dino: DinoInput;
  content: string;
  outputDir: string;
  publicBase: string;
  dryRun: boolean;
}): Promise<StaticMediaManifest["gamma"]> {
  const { dino, content, outputDir, publicBase, dryRun } = params;
  await mkdir(outputDir, { recursive: true });
  const summary = buildSummary(dino);
  await writeFile(path.join(outputDir, "deck.html"), deckHtml(dino, summary), "utf8");

  const key = process.env.GAMMA_API_KEY;
  if (!key || dryRun) {
    const payload = {
      status: key ? "demo" : "skipped",
      provider: "demo",
      reason: key ? "Dry run enabled" : "GAMMA_API_KEY is not set",
      content,
      summary,
    };
    await writeFile(path.join(outputDir, "gamma.json"), JSON.stringify(payload, null, 2), "utf8");
    return {
      status: key ? "demo" : "skipped",
      provider: "demo",
      title: summary.title,
      deckUrl: `${publicBase}/deck.html`,
      summary,
      error: key ? undefined : "GAMMA_API_KEY is not set; local HTML deck generated.",
    };
  }

  try {
    const base = process.env.GAMMA_API_BASE || "https://public-api.gamma.app/v1.0";
    const createResponse = await fetch(`${base}/generations`, {
      method: "POST",
      headers: {
        "X-API-KEY": key,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        inputText: content,
        textMode: "generate",
        format: "presentation",
        numCards: 6,
        exportAs: process.env.GAMMA_EXPORT_FORMAT || "pdf",
      }),
    });

    if (!createResponse.ok) {
      throw new Error(`Gamma create HTTP ${createResponse.status}`);
    }

    const created = (await createResponse.json()) as { generationId?: string; id?: string };
    const generationId = created.generationId || created.id;
    if (!generationId) throw new Error("Gamma response missing generationId");

    let result: Record<string, unknown> = {};
    for (let attempt = 0; attempt < 60; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      const pollResponse = await fetch(`${base}/generations/${generationId}`, {
        headers: { "X-API-KEY": key },
      });
      if (!pollResponse.ok) {
        throw new Error(`Gamma poll HTTP ${pollResponse.status}`);
      }
      result = (await pollResponse.json()) as Record<string, unknown>;
      if (result.status === "completed" || result.status === "failed") break;
    }

    if (result.status !== "completed") {
      throw new Error(`Gamma generation ended with status ${String(result.status)}`);
    }

    const exportUrl = typeof result.exportUrl === "string" ? result.exportUrl : undefined;
    const gammaUrl = typeof result.gammaUrl === "string" ? result.gammaUrl : undefined;
    if (exportUrl) {
      await downloadExport(exportUrl, path.join(outputDir, "deck.pdf"));
    }

    await writeFile(path.join(outputDir, "gamma.json"), JSON.stringify(result, null, 2), "utf8");
    return {
      status: "success",
      provider: "gamma",
      title: summary.title,
      deckUrl: `${publicBase}/deck.html`,
      pdfUrl: exportUrl ? `${publicBase}/deck.pdf` : undefined,
      gammaUrl,
      exportUrl,
      summary,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gamma failed";
    await writeFile(
      path.join(outputDir, "gamma.json"),
      JSON.stringify({ status: "failed", error: message, summary }, null, 2),
      "utf8",
    );
    return {
      status: "failed",
      provider: "gamma",
      title: summary.title,
      deckUrl: `${publicBase}/deck.html`,
      summary,
      error: message,
    };
  }
}
