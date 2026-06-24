import { type Request, Router } from "express";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { Dinosaur, DinoListResponse, ErrorResponse } from "@workspace/api-zod";
import { getDinoById, listDinosaurs } from "../services/media/media-service";

const router = Router();

const DinoIdSchema = z.object({
  id: z.string().min(1),
});

router.get("/dinos", async (_req, res) => {
  const dinos = await listDinosaurs();
  res.json(
    DinoListResponse.parse({
      items: dinos.map((item) => item),
    }),
  );
});

router.get("/dinos/:id/static-media", async (req: Request, res) => {
  const parsed = DinoIdSchema.safeParse(req.params);
  if (!parsed.success) {
    return res.status(400).json(
      ErrorResponse.parse({
        code: "bad_request",
        message: "Invalid dinosaur id",
      }),
    );
  }

  const manifestPaths = [
    path.resolve(
      process.cwd(),
      "artifacts",
      "dino-pedia",
      "public",
      "static-media",
      parsed.data.id,
      "manifest.json",
    ),
    path.resolve(
      process.cwd(),
      "..",
      "dino-pedia",
      "public",
      "static-media",
      parsed.data.id,
      "manifest.json",
    ),
  ];

  for (const manifestPath of manifestPaths) {
    try {
      const raw = await readFile(manifestPath, "utf8");
      return res.type("application/json").send(raw);
    } catch {
      // Try the next likely workspace root.
    }
  }

  return res.status(404).json(
    ErrorResponse.parse({
      code: "not_found",
      message: `Static media for ${parsed.data.id} not found`,
    }),
  );
});

router.get("/dinos/:id", async (req: Request, res) => {
  const parsed = DinoIdSchema.safeParse(req.params);
  if (!parsed.success) {
    return res.status(400).json(
      ErrorResponse.parse({
        code: "bad_request",
        message: "Invalid dinosaur id",
      }),
    );
  }

  const dino = await getDinoById(parsed.data.id);
  if (!dino) {
    return res
      .status(404)
      .json(
        ErrorResponse.parse({
          code: "not_found",
          message: `Dino ${parsed.data.id} not found`,
        }),
      );
  }

  res.json(Dinosaur.parse(dino));
});

export default router;
