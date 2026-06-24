import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type UIEventHandler,
} from "react";
import { Link, useLocation, useParams } from "wouter";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Clock,
  Copy,
  Drumstick,
  FileAudio,
  Leaf,
  MapPin,
  RefreshCw,
  Ruler,
  Scale,
  Sparkles,
  Star,
  Utensils,
  WandSparkles,
  LayoutTemplate,
} from "lucide-react";
import {
  useCreateDeckJob,
  useCreateVoiceJob,
  useGetDeckJob,
  useGetDinoById,
  useGetDinos,
  useGetMediaJobs,
  useGetVoiceJob,
  useGetVoices,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { dinosaurs } from "@/data/dinosaurs";
import type { Dinosaur } from "@/data/dinosaurs";
import {
  type StaticSubtitleCue,
  type StaticBehaviorClip,
  useStaticMediaManifest,
} from "@/lib/static-media";
import NotFound from "./not-found";

const FAVORITE_STORAGE_KEY = "dino-pedia-favorites";
const FAST_REFRESH_MS = 2_000;
const BEHAVIOR_ACTION_LABELS: Record<string, string> = {
  feeding: "进食",
  running: "奔跑",
  resting: "休息",
};

type TrackKind = "narration" | "dinoVoice";
type BehaviorAction = "feeding" | "running" | "resting";

interface AudioTrack {
  kind: TrackKind;
  audioUrl: string;
  transcript?: string;
  subtitles?: StaticSubtitleCue[];
  durationMs?: number;
}

function getDietColor(diet: Dinosaur["diet"]) {
  switch (diet) {
    case "肉食":
      return "text-red-300";
    case "草食":
      return "text-green-300";
    default:
      return "text-amber-300";
  }
}

function readFavoriteIds(): string[] {
  try {
    const raw = localStorage.getItem(FAVORITE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((item) => typeof item === "string");
    }
    return [];
  } catch {
    return [];
  }
}

function writeFavoriteIds(ids: string[]) {
  try {
    localStorage.setItem(FAVORITE_STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // ignore
  }
}

function formatPercentProgress(progress?: number) {
  if (typeof progress !== "number" || Number.isNaN(progress)) return 0;
  if (progress < 0) return 0;
  if (progress > 100) return 100;
  return Math.round(progress);
}

export default function Detail() {
  const params = useParams();
  const dinoId = params.id ?? "";
  const [location] = useLocation();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [isFavorited, setIsFavorited] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [activeSubtitleIndex, setActiveSubtitleIndex] = useState<number | null>(null);
  const [activeSubtitleSource, setActiveSubtitleSource] = useState<TrackKind>("narration");
  const [narrationEnabled, setNarrationEnabled] = useState(true);
  const [dinoVoiceEnabled, setDinoVoiceEnabled] = useState(true);
  const [selectedAction, setSelectedAction] = useState<BehaviorAction>("feeding");

  const queryParams = useMemo(() => {
    const normalized = location.split("?")[1] ?? "";
    return new URLSearchParams(normalized);
  }, [location]);

  const [voiceJobId, setVoiceJobId] = useState(() => queryParams.get("voiceJob"));
  const [deckJobId, setDeckJobId] = useState(() => queryParams.get("deckJob"));

  const dinoQuery = useGetDinoById(dinoId, {
    query: {
      enabled: Boolean(dinoId),
      retry: 1,
    },
  });
  const allDinosQuery = useGetDinos({ query: { staleTime: 60_000 } });
  const voicesQuery = useGetVoices({ query: { staleTime: 120_000 } });
  const staticMediaQuery = useStaticMediaManifest(dinoId);

  const dino: Dinosaur | undefined = dinoQuery.data ?? dinosaurs.find((item) => item.id === dinoId);
  const allDinos = allDinosQuery.data?.items?.length ? allDinosQuery.data.items : dinosaurs;

  useEffect(() => {
    if (!dinoId) return;
    const ids = readFavoriteIds();
    setIsFavorited(ids.includes(dinoId));
  }, [dinoId]);

  useEffect(() => {
    const nextVoice = queryParams.get("voiceJob");
    const nextDeck = queryParams.get("deckJob");
    setVoiceJobId(nextVoice || null);
    setDeckJobId(nextDeck || null);
  }, [queryParams]);

  const dietData = useMemo(() => {
    const data = [
      { name: "肉食", value: allDinos.filter((item) => item.diet === "肉食").length },
      { name: "草食", value: allDinos.filter((item) => item.diet === "草食").length },
      { name: "杂食", value: allDinos.filter((item) => item.diet === "杂食").length },
    ];
    return data;
  }, [allDinos]);

  const timelineData = useMemo(() => {
    const eras = ["三叠纪", "侏罗纪", "白垩纪"] as const;
    return eras.map((era) => {
      const dinos = allDinos.filter((item) => item.era === era);
      const avgLength =
        dinos.length === 0
          ? 0
          : dinos.reduce((total, item) => total + item.lengthM, 0) / dinos.length;
      const avgWeight =
        dinos.length === 0
          ? 0
          : dinos.reduce((total, item) => total + item.weightTons, 0) / dinos.length;
      return {
        era,
        avgLength: Number(avgLength.toFixed(2)),
        avgWeight: Number(avgWeight.toFixed(2)),
        count: dinos.length,
      };
    });
  }, [allDinos]);

  const currentEraComparison = useMemo(() => {
    if (!dino) return [];
    const sameEra = allDinos.filter((item) => item.era === dino.era);
    if (!sameEra.length) return [];
    const count = sameEra.length || 1;
    return [
      {
        name: "体长（米）",
        同时代: Number(
          (
            sameEra.reduce((sum, item) => sum + item.lengthM, 0) /
            count
          ).toFixed(2),
        ),
        当前恐龙: dino.lengthM,
      },
      {
        name: "体重（吨）",
        同时代: Number(
          (
            sameEra.reduce((sum, item) => sum + item.weightTons, 0) /
            count
          ).toFixed(2),
        ),
        当前恐龙: dino.weightTons,
      },
    ];
  }, [allDinos, dino]);

  const voiceJobQuery = useGetVoiceJob(voiceJobId || "", {
    query: {
      enabled: Boolean(voiceJobId),
      refetchInterval: (data) =>
        data?.status === "completed" || data?.status === "failed"
          ? false
          : FAST_REFRESH_MS,
      retry: 2,
    },
  });

  const mediaJobsQuery = useGetMediaJobs(
    {
      dinoId,
      limit: 20,
    },
    {
      query: {
        enabled: Boolean(dinoId),
        refetchInterval: (data) =>
          data?.items?.some((job) => job.status === "queued" || job.status === "running")
            ? FAST_REFRESH_MS
            : false,
      },
    },
  );

  const deckJobQuery = useGetDeckJob(deckJobId || "", {
    query: {
      enabled: Boolean(deckJobId),
      refetchInterval: (data) =>
        data?.status === "completed" || data?.status === "failed"
          ? false
          : FAST_REFRESH_MS,
      retry: 2,
    },
  });

  const voiceAsset = (voiceJobQuery.data as any)?.asset;
  const deckAsset = (deckJobQuery.data as any)?.asset;
  const voiceStatus = (voiceJobQuery.data as any)?.status;
  const deckStatus = (deckJobQuery.data as any)?.status;

  const narrationAudioRef = useRef<HTMLAudioElement | null>(null);
  const dinoVoiceAudioRef = useRef<HTMLAudioElement | null>(null);
  const staticMedia = staticMediaQuery.data;
  const staticNarrationTrack: AudioTrack | null = staticMedia?.narration?.audioUrl
    ? {
        kind: "narration",
        audioUrl: staticMedia.narration.audioUrl,
        transcript: staticMedia.narration.transcript,
        subtitles: staticMedia.narration.subtitles,
        durationMs: staticMedia.narration.durationMs,
      }
    : null;
  const staticDinoVoiceTrack: AudioTrack | null = staticMedia?.dinoVoice?.audioUrl
    ? {
        kind: "dinoVoice",
        audioUrl: staticMedia.dinoVoice.audioUrl,
        transcript: staticMedia.dinoVoice.transcript,
        subtitles: staticMedia.dinoVoice.subtitles,
        durationMs: staticMedia.dinoVoice.durationMs,
      }
    : null;
  const runtimeNarrationTrack = voiceAsset?.audioUrl
    ? ({
        kind: "narration",
        audioUrl: voiceAsset.audioUrl,
        transcript: voiceAsset.transcript,
        subtitles: voiceAsset.subtitles ?? [],
        durationMs: voiceAsset.durationMs,
      } as AudioTrack)
    : null;

  const effectiveNarrationTrack = runtimeNarrationTrack ?? staticNarrationTrack;
  const effectiveDinoVoiceTrack = staticDinoVoiceTrack;
  const behaviorClips = staticMedia?.visual?.behaviorClips ?? staticMedia?.canva?.behaviorClips;
  const availableActionClips = useMemo(
    () =>
      (behaviorClips ?? []).filter(
        (clip): clip is StaticBehaviorClip =>
          Boolean(clip?.action && clip?.posterUrl),
      ),
    [behaviorClips],
  );

  useEffect(() => {
    if (!selectedAction) return;
    const selected = availableActionClips.find((clip) => clip.action === selectedAction);
    if (!selected && availableActionClips[0]?.action) {
      setSelectedAction(availableActionClips[0].action as BehaviorAction);
    }
  }, [availableActionClips, selectedAction]);

  const subtitleTrackSource = useMemo<TrackKind>(() => {
    if (activeSubtitleSource === "narration" && narrationEnabled && effectiveNarrationTrack) {
      return "narration";
    }
    if (activeSubtitleSource === "dinoVoice" && dinoVoiceEnabled && effectiveDinoVoiceTrack) {
      return "dinoVoice";
    }
    if (effectiveNarrationTrack && narrationEnabled) return "narration";
    if (effectiveDinoVoiceTrack && dinoVoiceEnabled) return "dinoVoice";
    return "narration";
  }, [activeSubtitleSource, effectiveNarrationTrack, effectiveDinoVoiceTrack, narrationEnabled, dinoVoiceEnabled]);

  useEffect(() => {
    const narration = narrationAudioRef.current;
    const dinoVoice = dinoVoiceAudioRef.current;
    if (narration) {
      narration.playbackRate = playbackRate;
      narration.muted = !narrationEnabled;
    }
    if (dinoVoice) {
      dinoVoice.playbackRate = playbackRate;
      dinoVoice.muted = !dinoVoiceEnabled;
    }
  }, [playbackRate, narrationEnabled, dinoVoiceEnabled]);

  const handleTimeUpdate =
    (source: TrackKind, track: AudioTrack | null): UIEventHandler<HTMLAudioElement> =>
    (event) => {
      if (!track || source !== subtitleTrackSource) return;
      const audio = event.currentTarget;
      const nowMs = audio.currentTime * 1000;
      const cues = track.subtitles ?? [];
      const matchIndex = cues.findIndex((cue) => cue.startMs <= nowMs && cue.endMs >= nowMs);
      setActiveSubtitleIndex(matchIndex >= 0 ? matchIndex : null);
    };

  const toggleFavorite = useCallback(() => {
    if (!dino) return;
    const ids = readFavoriteIds();
    const next = ids.includes(dino.id)
      ? ids.filter((value) => value !== dino.id)
      : [...ids, dino.id];
    setIsFavorited(!ids.includes(dino.id));
    writeFavoriteIds(next);
  }, [dino]);

  const shouldShowVoiceProgress =
    Boolean(voiceJobId) &&
    (!voiceAsset || (voiceStatus === "queued" || voiceStatus === "running"));
  const shouldShowDeckProgress =
    Boolean(deckJobId) &&
    (!deckAsset || (deckStatus === "queued" || deckStatus === "running"));
  const hasOfflineData = dinoQuery.isError && dino && !dinoQuery.data;

  const staticDeckAsset = staticMedia?.gamma || staticMedia?.canva
    ? {
        title: staticMedia.gamma?.title ?? staticMedia.canva?.title ?? `${staticMedia.nameCn} 展示页`,
        previewUrl: staticMedia.gamma?.deckUrl ?? staticMedia.canva?.posterUrl ?? "",
        shareUrl: staticMedia.gamma?.gammaUrl,
        canvaEditableUrl: staticMedia.canva?.editableUrl,
        importText: staticMedia.canva?.importText,
        summary: staticMedia.gamma?.summary,
      }
    : null;
  const effectiveDeckAsset = deckAsset ?? staticDeckAsset;
  const mediaStatusBadge = (status?: string) => {
    if (status === "completed") return "已完成";
    if (status === "running") return "执行中";
    if (status === "queued") return "排队中";
    if (status === "failed") return "失败";
    return "未知";
  };

  const voiceJobs = mediaJobsQuery.data?.items?.filter((job) => job.type === "voice") ?? [];
  const deckJobs = mediaJobsQuery.data?.items?.filter((job) => job.type === "deck") ?? [];
  const hasActiveMediaJobs =
    mediaJobsQuery.data?.items?.some((job) => job.status === "queued" || job.status === "running") ??
    false;

  const activeClip = behaviorClips?.find(
    (clip) => clip.action === selectedAction,
  ) as StaticBehaviorClip | undefined;
  const selectedClipSources =
    activeClip?.status === "success" && (activeClip?.animationWebmUrl || activeClip?.animationUrl)
      ? {
          animation:
            activeClip?.animationWebmUrl ?? activeClip?.animationUrl ?? "",
          poster: activeClip?.posterUrl,
          canvaEditableUrl: activeClip?.canvaEditableUrl,
        }
      : null;

  const subtitleItems: StaticSubtitleCue[] = useMemo(() => {
    const activeTrack =
      subtitleTrackSource === "narration" ? effectiveNarrationTrack : effectiveDinoVoiceTrack;
    if (!activeTrack?.subtitles) return [];
    return activeTrack.subtitles;
  }, [subtitleTrackSource, effectiveDinoVoiceTrack, effectiveNarrationTrack]);

  const syncQueryParam = useCallback(
    (next: { voiceJob?: string | null; deckJob?: string | null }) => {
      const base = location.split("?")[0] ?? `/dino/${dinoId}`;
      const params = new URLSearchParams(location.split("?")[1] ?? "");
      if (next.voiceJob !== undefined) {
        if (next.voiceJob) params.set("voiceJob", next.voiceJob);
        else params.delete("voiceJob");
      }
      if (next.deckJob !== undefined) {
        if (next.deckJob) params.set("deckJob", next.deckJob);
        else params.delete("deckJob");
      }
      const queryString = params.toString();
      navigate(`${base}${queryString ? `?${queryString}` : ""}`);
    },
    [dinoId, location, navigate],
  );

  const createVoiceMutation = useCreateVoiceJob({
    mutation: {
      onSuccess: (result) => {
        setVoiceJobId(result.id);
        syncQueryParam({ voiceJob: result.id });
      },
      onError: (error) => {
        toast({
          title: "音频任务创建失败",
          description: error instanceof Error ? error.message : "服务暂不可用，请稍后重试",
        });
      },
    },
  });

  const createDeckMutation = useCreateDeckJob({
    mutation: {
      onSuccess: (result) => {
        setDeckJobId(result.id);
        syncQueryParam({ deckJob: result.id });
      },
      onError: (error) => {
        toast({
          title: "展示页任务创建失败",
          description: error instanceof Error ? error.message : "服务暂不可用，请稍后重试",
        });
      },
    },
  });

  const buildVoicePayload = useCallback(() => {
    if (!dino) return null;
    return {
      dinoId: dino.id,
      script:
        `${dino.nameCn}（${dino.nameLatin}）是${dino.era}的标志性恐龙。` +
        `其体长为${dino.lengthM}米，体重约${dino.weightTons}吨，主要分布于${dino.region}。` +
        `${dino.description} 趣味补充：${dino.funFact}`,
      speed: 1,
    };
  }, [dino]);

  const buildDeckPayload = useCallback(() => {
    if (!dino) return null;
    return {
      dinoId: dino.id,
      content:
        `${dino.nameCn}（${dino.nameLatin}）简介：${dino.description}。` +
        `它属于${dino.diet}类，时代是${dino.era}，体长${dino.lengthM}米，体重${dino.weightTons}吨。` +
        `趣味：${dino.funFact}`,
      style: "museum",
    };
  }, [dino]);

  const startVoiceGeneration = useCallback(async () => {
    if (!dino) return;
    const payload = buildVoicePayload();
    if (!payload) return;
    const data = await createVoiceMutation.mutateAsync(payload);
    toast({
      title: "已提交语音生成任务",
      description: `任务ID：${data.id}`,
    });
  }, [buildVoicePayload, createVoiceMutation, dino, toast]);

  const startDeckGeneration = useCallback(async () => {
    if (!dino) return;
    const payload = buildDeckPayload();
    if (!payload) return;
    const data = await createDeckMutation.mutateAsync(payload);
    toast({
      title: "已提交展示页生成任务",
      description: `任务ID：${data.id}`,
    });
  }, [buildDeckPayload, createDeckMutation, dino, toast]);

  const resumeVoiceJob = useCallback(
    (jobId: string) => {
      setVoiceJobId(jobId);
      syncQueryParam({ voiceJob: jobId });
    },
    [syncQueryParam],
  );

  const resumeDeckJob = useCallback(
    (jobId: string) => {
      setDeckJobId(jobId);
      syncQueryParam({ deckJob: jobId });
    },
    [syncQueryParam],
  );

  const copyDeckText = useCallback(async () => {
    if (!effectiveDeckAsset?.importText) return;
    try {
      await navigator.clipboard.writeText(effectiveDeckAsset.importText);
      toast({ title: "已复制到剪贴板", description: "可直接导入到 Canva 的文本素材。" });
    } catch {
      toast({ title: "复制失败", description: "请手动选中复制。" });
    }
  }, [effectiveDeckAsset?.importText, toast]);

  if (!dino) return <NotFound />;

  const DietIcon = dino.diet === "肉食" ? Drumstick : dino.diet === "草食" ? Leaf : Utensils;
  const hasNarration =
    Boolean(effectiveNarrationTrack?.audioUrl) && (narrationEnabled || !dinoVoiceEnabled);
  const hasDinoVoice = Boolean(effectiveDinoVoiceTrack?.audioUrl);
  const actionTabs = [
    { key: "feeding" as const, label: "进食" },
    { key: "running" as const, label: "奔跑" },
    { key: "resting" as const, label: "休息" },
  ];
  const clipForTab = (action: BehaviorAction) =>
    availableActionClips.find((clip) => clip.action === action);

  return (
    <div className="min-h-screen bg-background pb-20">
      <Link
        href="/"
        className="fixed top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 bg-black/50 hover:bg-black/80 text-foreground rounded-full border border-border backdrop-blur-md transition-all group"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        <span className="font-medium text-sm">返回名录</span>
      </Link>

      <button
        type="button"
        onClick={toggleFavorite}
        className={`fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-2 rounded-full border transition-colors ${
          isFavorited
            ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/40"
            : "bg-black/50 text-muted-foreground border-border hover:text-foreground"
        }`}
      >
        <Star size={16} />
        {isFavorited ? "已收藏" : "收藏"}
      </button>

      {hasOfflineData ? (
        <div className="mx-auto max-w-6xl px-6 pt-4">
          <div className="inline-flex px-4 py-2 rounded-full text-sm bg-destructive/20 border border-destructive/40 text-destructive">
            当前详情来自本地数据，后端暂时不可读（/api/dinos 可能不可用）
          </div>
        </div>
      ) : null}

      <div className="relative h-[50vh] md:h-[70vh] w-full overflow-hidden bg-black">
        <img src={dino.imageUrl} alt={dino.nameCn} className="w-full h-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-12 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-primary/20 text-primary border border-primary/30 rounded-full text-sm font-medium backdrop-blur-sm">
                {dino.era}
              </span>
              <span
                className={`px-3 py-1 border rounded-full text-sm font-medium backdrop-blur-sm flex items-center gap-1.5 ${getDietColor(
                  dino.diet,
                )} bg-accent/20 border-accent/30`}
              >
                <DietIcon size={14} />
                {dino.diet}
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-serif font-bold text-foreground mb-2 drop-shadow-md">
              {dino.nameCn}
            </h1>
            <p className="text-xl md:text-3xl font-sans font-light text-muted-foreground italic">
              {dino.nameLatin}
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 mt-12 grid grid-cols-1 lg:grid-cols-3 gap-10">
        <motion.div
          className="lg:col-span-2 space-y-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <section>
            <h2 className="text-2xl font-serif font-bold text-primary mb-6 flex items-center gap-3">
              物种描述
              <span className="h-px flex-1 bg-border/50" />
            </h2>
            <div className="prose prose-invert max-w-none">
              <p className="text-lg leading-relaxed text-muted-foreground font-serif">
                {dino.description}
              </p>
            </div>
          </section>

          <section className="p-6 rounded-2xl bg-secondary border border-border">
            <h3 className="text-xl font-serif font-bold text-foreground mb-4 flex items-center gap-2">
              <Sparkles size={20} />
              趣味知识
            </h3>
            <p className="text-foreground text-lg font-serif">{dino.funFact}</p>
          </section>

          <section>
            <h3 className="text-2xl font-serif font-bold text-primary mb-6">
              多模态介绍区
            </h3>
            {staticMedia ? (
              <div className="mb-6 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                已加载静态多媒体资源：讲解、展示与行为资产会优先从站内文件读取。
              </div>
            ) : null}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-border p-5 bg-card space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold">讲解与恐龙语音</h4>
                  <button
                    onClick={startVoiceGeneration}
                    disabled={
                      createVoiceMutation.isPending ||
                      Boolean(voiceJobId && shouldShowVoiceProgress)
                    }
                    className="text-xs px-3 py-1.5 rounded-full bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 disabled:opacity-50"
                  >
                    <span className="inline-flex items-center gap-1">
                      <FileAudio size={14} />
                      {hasNarration ? "补生成讲解" : voiceJobId ? "重新生成" : "生成讲解音频"}
                    </span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={narrationEnabled}
                      onChange={(event) => setNarrationEnabled(event.target.checked)}
                    />
                    中文讲解
                  </label>
                  <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={dinoVoiceEnabled}
                      onChange={(event) => setDinoVoiceEnabled(event.target.checked)}
                      disabled={!hasDinoVoice}
                    />
                    恐龙叫声
                  </label>
                </div>

                <div className="space-y-3">
                  {shouldShowVoiceProgress ? (
                    <div className="text-sm">
                      <p className="text-muted-foreground mb-2">
                        语音任务进行中 · {formatPercentProgress((voiceJobQuery.data as any)?.progress)}%
                      </p>
                      <div className="h-2 rounded-full overflow-hidden bg-black/40">
                        <div
                          className="h-full bg-primary transition-all duration-300"
                          style={{
                            width: `${formatPercentProgress((voiceJobQuery.data as any)?.progress)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ) : null}

                  {voiceStatus === "failed" ? (
                    <div className="rounded-lg border border-destructive/40 text-destructive px-4 py-3 text-sm">
                      {((voiceJobQuery.data as any)?.errorCode) || "任务失败"}：
                      {(voiceJobQuery.data as any)?.errorMessage ?? "请重试"}
                      <button onClick={startVoiceGeneration} className="ml-3 inline-flex items-center gap-1 text-xs">
                        <RefreshCw size={12} />
                        重试
                      </button>
                    </div>
                  ) : null}
                </div>

                <div className="flex items-center gap-2 text-sm mb-2">
                  <span className="text-muted-foreground">字幕音轨：</span>
                  <button
                    onClick={() => setActiveSubtitleSource("narration")}
                    className={`px-2 py-1 rounded-md border ${
                      subtitleTrackSource === "narration"
                        ? "bg-primary/30 border-primary text-primary"
                        : "border-border text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    中文讲解
                  </button>
                  <button
                    onClick={() => setActiveSubtitleSource("dinoVoice")}
                    className={`px-2 py-1 rounded-md border ${
                      subtitleTrackSource === "dinoVoice"
                        ? "bg-primary/30 border-primary text-primary"
                        : "border-border text-muted-foreground hover:border-primary/40"
                    }`}
                    disabled={!hasDinoVoice}
                  >
                    恐龙叫声
                  </button>
                </div>

                <div className="space-y-3">
                  {effectiveNarrationTrack ? (
                    <audio
                      ref={narrationAudioRef}
                      controls
                      src={effectiveNarrationTrack.audioUrl}
                      onTimeUpdate={handleTimeUpdate("narration", effectiveNarrationTrack)}
                      className="w-full"
                    />
                  ) : null}
                  {effectiveDinoVoiceTrack ? (
                    <audio
                      ref={dinoVoiceAudioRef}
                      controls
                      src={effectiveDinoVoiceTrack.audioUrl}
                      onTimeUpdate={handleTimeUpdate("dinoVoice", effectiveDinoVoiceTrack)}
                      className="w-full"
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">暂无恐龙语音素材。</p>
                  )}

                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">倍速：</span>
                    {[0.75, 1, 1.25, 1.5].map((speed) => (
                      <button
                        key={speed}
                        onClick={() => setPlaybackRate(speed)}
                        className={`px-2 py-1 rounded-md border ${
                          playbackRate === speed
                            ? "bg-primary/30 border-primary text-primary"
                            : "border-border text-muted-foreground hover:border-primary/40"
                        }`}
                      >
                        {speed}x
                      </button>
                    ))}
                  </div>

                  <div className="max-h-52 overflow-auto space-y-2">
                    {subtitleItems.length > 0 ? (
                      subtitleItems.map((item, index) => (
                        <p
                          key={`${item.startMs}-${index}`}
                          className={`text-sm rounded-md px-2 py-1 ${
                            activeSubtitleIndex === index
                              ? "bg-primary/20 border border-primary/40"
                              : "text-muted-foreground"
                          }`}
                        >
                          {item.text}
                        </p>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        暂无字幕。支持的字幕将和当前播放音轨联动。
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border p-5 bg-card space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold">行为展示（动态素材）</h4>
                  <button
                    onClick={() => {
                      const behavior = availableActionClips[0]?.action as BehaviorAction | undefined;
                      setSelectedAction(behavior || "feeding");
                    }}
                    className="text-xs px-3 py-1.5 rounded-full bg-secondary border border-border"
                  >
                    切到默认行为
                  </button>
                </div>

                <div className="flex gap-2 text-xs">
                  {actionTabs.map((action) => {
                    const hasAction = Boolean(clipForTab(action.key));
                    return (
                      <button
                        key={action.key}
                        onClick={() => setSelectedAction(action.key)}
                        className={`px-3 py-1.5 rounded-full border transition-colors ${
                          selectedAction === action.key
                            ? "bg-primary/30 border-primary text-primary"
                            : "border-border text-muted-foreground hover:border-primary/40"
                        } ${!hasAction ? "opacity-50" : ""}`}
                      >
                        {action.label}
                      </button>
                    );
                  })}
                </div>

                {shouldShowDeckProgress ? (
                  <div className="text-sm">
                    <p className="text-muted-foreground mb-2">
                      展示任务进行中 · {formatPercentProgress((deckJobQuery.data as any)?.progress)}%
                    </p>
                    <div className="h-2 rounded-full overflow-hidden bg-black/40">
                      <div
                        className="h-full bg-accent transition-all duration-300"
                        style={{
                          width: `${formatPercentProgress((deckJobQuery.data as any)?.progress)}%`,
                        }}
                      />
                    </div>
                  </div>
                ) : null}

                {deckStatus === "failed" ? (
                  <div className="rounded-lg border border-destructive/40 text-destructive px-4 py-3 text-sm">
                    {((deckJobQuery.data as any)?.errorCode) || "任务失败"}：
                    {(deckJobQuery.data as any)?.errorMessage ?? "请重试"}
                    <button onClick={startDeckGeneration} className="ml-3 inline-flex items-center gap-1 text-xs">
                      <RefreshCw size={12} />
                      重试
                    </button>
                  </div>
                ) : null}

                {selectedClipSources ? (
                  <video
                    key={selectedClipSources.animation}
                    controls
                    loop
                    autoPlay
                    muted
                    poster={selectedClipSources.poster}
                    src={selectedClipSources.animation}
                    className="w-full h-48 rounded-lg border border-border object-cover"
                  />
                ) : (
                  <div className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
                    {availableActionClips.length > 0
                      ? "当前行为暂无可播放视频，先显示静态首帧。"
                      : "行为素材未就绪，默认展示静态图；可稍后补生成。"}
                    {activeClip?.posterUrl ? (
                      <img
                        src={activeClip.posterUrl}
                        alt={`${dino.nameCn} ${BEHAVIOR_ACTION_LABELS[activeClip.action]}`}
                        className="mt-3 w-full rounded-md border border-border"
                      />
                    ) : null}
                  </div>
                )}

                {activeClip?.frames?.length ? (
                  <div className="grid grid-cols-6 gap-2">
                    {activeClip.frames.slice(0, 6).map((frame) => (
                      <img
                        key={frame.index}
                        src={frame.url}
                        alt={`${dino.nameCn} ${BEHAVIOR_ACTION_LABELS[selectedAction]} 帧图`}
                        className="w-full h-12 object-cover rounded border border-border"
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-2xl font-serif font-bold text-primary mb-6">
              展示页与素材
            </h3>
            <div className="rounded-2xl border border-border p-5 bg-card space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold">演示面板</h4>
                <button
                  onClick={startDeckGeneration}
                  disabled={createDeckMutation.isPending || Boolean(deckJobId && shouldShowDeckProgress)}
                  className="text-xs px-3 py-1.5 rounded-full bg-accent/20 text-accent border border-accent/30 hover:bg-accent/30 disabled:opacity-50"
                >
                  <span className="inline-flex items-center gap-1">
                    <LayoutTemplate size={14} />
                    {effectiveDeckAsset ? "补生成展示" : deckJobId ? "重新生成" : "生成展示页"}
                  </span>
                </button>
              </div>

              {effectiveDeckAsset ? (
                <div className="space-y-3 text-sm">
                  <div className="rounded-lg bg-black/30 border border-border p-3">
                    <p className="text-muted-foreground mb-2">标题</p>
                    <p className="font-medium">{effectiveDeckAsset.title}</p>
                  </div>
                  {staticMedia?.canva?.posterUrl ? (
                    <img
                      src={staticMedia.canva.posterUrl}
                      alt={`${dino.nameCn} Canva 视觉卡片`}
                      className="w-full rounded-lg border border-border object-cover"
                    />
                  ) : null}
                  {effectiveDeckAsset.previewUrl ? (
                    <iframe
                      src={effectiveDeckAsset.previewUrl}
                      className="w-full h-52 border border-border rounded-lg"
                      title={`${dino.nameCn} 预览`}
                    />
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    {effectiveDeckAsset.previewUrl ? (
                      <a
                        href={effectiveDeckAsset.previewUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-full bg-secondary border border-border"
                      >
                        <WandSparkles size={14} />
                        打开链接
                      </a>
                    ) : null}
                    {effectiveDeckAsset.canvaEditableUrl ? (
                      <a
                        href={effectiveDeckAsset.canvaEditableUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-full bg-secondary border border-border"
                      >
                        打开 Canva 可编辑
                      </a>
                    ) : null}
                    {effectiveDeckAsset.importText ? (
                      <button
                        onClick={copyDeckText}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-full bg-secondary border border-border"
                      >
                        <Copy size={14} />
                        复制导入素材
                      </button>
                    ) : null}
                    {staticMedia?.gamma?.pdfUrl ? (
                      <a
                        href={staticMedia.gamma.pdfUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-full bg-secondary border border-border"
                      >
                        下载 PDF
                      </a>
                    ) : null}
                    {staticMedia?.descript?.projectUrl ? (
                      <a
                        href={staticMedia.descript.projectUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-full bg-secondary border border-border"
                      >
                        打开 Descript 项目
                      </a>
                    ) : null}
                  </div>
                  {effectiveDeckAsset.summary ? (
                    <div className="pt-2 space-y-3">
                      {effectiveDeckAsset.summary.sections.map((section: { title: string; facts: string[] }) => (
                        <div key={section.title} className="rounded-lg border border-border p-3">
                          <p className="font-medium mb-2">{section.title}</p>
                          <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                            {section.facts.map((fact) => (
                              <li key={fact}>{fact}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  暂无静态展示素材，先点击“生成展示页”。
                </p>
              )}
            </div>
          </section>

          <section>
            <h3 className="text-2xl font-serif font-bold text-primary mb-6">
              时间线与对比图
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-2xl bg-card border border-border p-4">
                <p className="text-sm text-muted-foreground mb-3">时代 × 平均体型/体重</p>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={timelineData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="era" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="avgLength" stroke="#f59e0b" name="平均体长(米)" />
                      <Line type="monotone" dataKey="avgWeight" stroke="#fb923c" name="平均体重(吨)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="rounded-2xl bg-card border border-border p-4">
                <p className="text-sm text-muted-foreground mb-3">食性分布</p>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dietData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#f97316" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </section>
        </motion.div>

        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="p-6 rounded-2xl bg-card border border-border">
            <h3 className="text-lg font-serif font-bold text-foreground mb-6">核心数据</h3>
            <ul className="space-y-5">
              <li className="flex items-center gap-4 text-muted-foreground pb-4 border-b border-border/50">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-primary">
                  <Clock size={18} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider mb-1">时代</p>
                  <p className="text-foreground font-medium">{dino.era}</p>
                </div>
              </li>
              <li className="flex items-center gap-4 text-muted-foreground pb-4 border-b border-border/50">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-accent">
                  <DietIcon size={18} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider mb-1">食性</p>
                  <p className="text-foreground font-medium">{dino.diet}</p>
                </div>
              </li>
              <li className="flex items-center gap-4 text-muted-foreground pb-4 border-b border-border/50">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-primary">
                  <Ruler size={18} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider mb-1">体长</p>
                  <p className="text-foreground font-medium">{dino.lengthM} 米</p>
                </div>
              </li>
              <li className="flex items-center gap-4 text-muted-foreground pb-4 border-b border-border/50">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-accent">
                  <Scale size={18} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider mb-1">体重</p>
                  <p className="text-foreground font-medium">{dino.weightTons} 吨</p>
                </div>
              </li>
              <li className="flex items-center gap-4 text-muted-foreground">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-primary">
                  <MapPin size={18} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider mb-1">产地</p>
                  <p className="text-foreground font-medium">{dino.region}</p>
                </div>
              </li>
            </ul>
          </div>

          <div className="p-6 rounded-2xl bg-card border border-border">
            <h3 className="font-semibold mb-4">同代对比（当前恐龙）</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={currentEraComparison}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="当前恐龙" fill="#fb923c" />
                  <Bar dataKey="同时代" fill="#a855f7" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-card border border-border">
            <h3 className="font-semibold mb-4">语音服务状态</h3>
            <ul className="text-sm space-y-2 text-muted-foreground">
              <li>可用 Provider：{voicesQuery.data?.voices?.length ?? 0} 项</li>
              <li>当前任务：{voiceJobId ? `voice#${voiceJobId}` : "无"}</li>
              <li>展示任务：{deckJobId ? `deck#${deckJobId}` : "无"}</li>
              <li>
                任务恢复池：{mediaJobsQuery.data?.items?.length ?? 0} 条
                {hasActiveMediaJobs ? "（含进行中）" : ""}
              </li>
              <li>
                行为素材：{availableActionClips.length > 0 ? `${availableActionClips.length} 套` : "未就绪"}
              </li>
              <li>恐龙语音：{hasDinoVoice ? "已就绪" : "未就绪"}</li>
            </ul>
          </div>

          <div className="p-6 rounded-2xl bg-card border border-border">
            <h3 className="font-semibold mb-4">任务恢复</h3>
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-muted-foreground mb-2">讲解音频任务</p>
                <div className="space-y-2">
                  {voiceJobs.length === 0 ? (
                    <p className="text-muted-foreground">暂无历史语音任务</p>
                  ) : (
                    voiceJobs.map((job) => (
                      <button
                        key={job.id}
                        type="button"
                        onClick={() => resumeVoiceJob(job.id)}
                        className="w-full text-left px-3 py-2 rounded-lg border border-border hover:border-primary/40 bg-background/70 flex items-center justify-between"
                      >
                        <span>{mediaStatusBadge(job.status)} · {job.id.slice(0, 8)} · {job.provider || "provider"}</span>
                        <span className="text-muted-foreground">{job.progress}%</span>
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div>
                <p className="text-muted-foreground mb-2">展示页任务</p>
                <div className="space-y-2">
                  {deckJobs.length === 0 ? (
                    <p className="text-muted-foreground">暂无历史展示任务</p>
                  ) : (
                    deckJobs.map((job) => (
                      <button
                        key={job.id}
                        type="button"
                        onClick={() => resumeDeckJob(job.id)}
                        className="w-full text-left px-3 py-2 rounded-lg border border-border hover:border-primary/40 bg-background/70 flex items-center justify-between"
                      >
                        <span>{mediaStatusBadge(job.status)} · {job.id.slice(0, 8)} · {job.provider || "provider"}</span>
                        <span className="text-muted-foreground">{job.progress}%</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
