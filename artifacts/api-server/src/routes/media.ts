import { type Request, Router } from "express";
import { z } from "zod";
import {
  MediaDeckJob,
  MediaVoiceJob,
  ErrorResponse,
  VoiceCatalogResponse,
  MediaJobListResponse,
} from "@workspace/api-zod";
import {
  getDinoById,
  getMediaJobById,
  getMediaJobs,
  getVoiceCatalog,
  submitDeckJob,
  submitVoiceJob,
} from "../services/media/media-service";
import { logger } from "../lib/logger";

const router = Router();

const jobIdSchema = z.string().min(1);
const voiceSchema = z.object({
  dinoId: z.string().optional().nullable(),
  script: z.string().min(20),
  voiceId: z.string().optional(),
  speed: z.number().min(0.6).max(2).optional(),
  provider: z.string().optional(),
});

const deckSchema = z.object({
  dinoId: z.string().optional().nullable(),
  content: z.string().min(30),
  style: z.string().optional(),
  provider: z.string().optional(),
});
const mediaJobsQuerySchema = z.object({
  type: z.enum(["voice", "deck"]).optional(),
  status: z.enum(["queued", "running", "completed", "failed"]).optional(),
  dinoId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

router.post("/media/voice", async (req: Request, res) => {
  const parsed = voiceSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(
      ErrorResponse.parse({
        code: "bad_request",
        message: parsed.error.message,
      }),
    );
  }

  const dino = parsed.data.dinoId ? await getDinoById(parsed.data.dinoId) : null;
  const idempotencyKey = req.headers["idempotency-key"]?.toString().trim() || null;

  const job = await submitVoiceJob({
    ...parsed.data,
    idempotencyKey,
    ...(dino ? { dinoTitle: dino.nameCn } : {}),
  } as Parameters<typeof submitVoiceJob>[0]);

  res.status(202).json(MediaVoiceJob.parse(job));
});

router.get("/media/voice/:jobId", async (req: Request, res) => {
  const parsed = jobIdSchema.safeParse(req.params.jobId);
  if (!parsed.success) {
    return res.status(400).json(
      ErrorResponse.parse({
        code: "bad_request",
        message: "Invalid jobId",
      }),
    );
  }

  const job = await getMediaJobById(parsed.data, "voice");
  if (!job) {
    return res
      .status(404)
      .json(ErrorResponse.parse({ code: "not_found", message: "Job not found" }));
  }

  return res.json(MediaVoiceJob.parse(job));
});

router.post("/media/deck", async (req: Request, res) => {
  const parsed = deckSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(
      ErrorResponse.parse({
        code: "bad_request",
        message: parsed.error.message,
      }),
    );
  }

  const dino = parsed.data.dinoId ? await getDinoById(parsed.data.dinoId) : null;
  const idempotencyKey = req.headers["idempotency-key"]?.toString().trim() || null;
  const job = await submitDeckJob({
    ...parsed.data,
    idempotencyKey,
    ...(dino ? { dinoTitle: dino.nameCn } : {}),
  });

  res.status(202).json(MediaDeckJob.parse(job));
});

router.get("/media/jobs", async (req: Request, res) => {
  const parsed = mediaJobsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json(
      ErrorResponse.parse({
        code: "bad_request",
        message: parsed.error.message,
      }),
    );
  }

  const jobs = await getMediaJobs(parsed.data);
  return res.json(MediaJobListResponse.parse({ items: jobs }));
});

router.get("/media/deck/:jobId", async (req: Request, res) => {
  const parsed = jobIdSchema.safeParse(req.params.jobId);
  if (!parsed.success) {
    return res.status(400).json(
      ErrorResponse.parse({
        code: "bad_request",
        message: "Invalid jobId",
      }),
    );
  }

  const job = await getMediaJobById(parsed.data, "deck");
  if (!job) {
    return res
      .status(404)
      .json(ErrorResponse.parse({ code: "not_found", message: "Job not found" }));
  }

  return res.json(MediaDeckJob.parse(job));
});

router.get("/voices", async (_req, res) => {
  try {
    const voices = await getVoiceCatalog();
    return res.json(VoiceCatalogResponse.parse({ voices }));
  } catch (error) {
    logger.warn({ err: error }, "voice catalog failed");
    return res
      .status(200)
      .json(VoiceCatalogResponse.parse({ voices: [] }));
  }
});

export default router;
