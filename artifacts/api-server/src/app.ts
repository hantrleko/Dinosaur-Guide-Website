import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { mediaConfig } from "./services/media/provider-config";
import { logger } from "./lib/logger";
import { ErrorResponse } from "@workspace/api-zod";

const mediaBuckets = new Map<string, { count: number; resetAt: number }>();

function getIp(req: { ip?: string; socket?: { remoteAddress?: string } }) {
  return req.ip || req.socket?.remoteAddress || "unknown";
}

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/media", (req, res, next) => {
  if (req.method !== "POST") {
    return next();
  }

  const now = Date.now();
  const key = getIp(req);
  const entry = mediaBuckets.get(key);
  const resetAt =
    entry && entry.resetAt > now
      ? entry.resetAt
      : now + mediaConfig.rateLimitWindowMs;

  const nextBucket = {
    count: entry && entry.resetAt > now ? entry.count : 0,
    resetAt,
  };

  if (nextBucket.count >= mediaConfig.rateLimitMaxRequests) {
    res.status(429).json(
      ErrorResponse.parse({
        code: "rate_limit",
        message: "Rate limit reached for media tasks",
      }),
    );
    return;
  }

  nextBucket.count += 1;
  mediaBuckets.set(key, nextBucket);
  return next();
});

app.use("/api", router);

export default app;
