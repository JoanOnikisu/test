import { useEffect, useRef, useState } from "react";
import type { ScaleMode } from "@/lib/cartridge";
import { hideEngineCursor, loadRuffle, type RufflePlayerElement } from "@/lib/ruffle-loader";

type Props = {
  data: ArrayBuffer;
  fileName: string;
  scale: ScaleMode;
  volume: number;
  bigCursor: boolean;
  suspended: boolean;
  onReady?: () => void;
  onError?: (message: string) => void;
};

export function FlashStage({
  data,
  fileName,
  scale,
  volume,
  bigCursor,
  suspended,
  onReady,
  onError,
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<RufflePlayerElement | null>(null);
  const onReadyRef = useRef(onReady);
  const onErrorRef = useRef(onError);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [detail, setDetail] = useState("");

  onReadyRef.current = onReady;
  onErrorRef.current = onError;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let dead = false;
    let player: RufflePlayerElement | null = null;
    setStatus("loading");
    setDetail("");

    (async () => {
      await loadRuffle();
      if (dead || !hostRef.current) return;
      const api = window.RufflePlayer;
      if (!api?.newest) throw new Error("Motor indisponível.");
      const source = api.newest();
      if (!source) throw new Error("Motor indisponível.");
      player = source.createPlayer();
      player.style.width = "100%";
      player.style.height = "100%";
      player.style.display = "block";
      hostRef.current.replaceChildren(player);
      await player.ruffle().load({
        data,
        swfFileName: fileName,
        autoplay: "on",
        splashScreen: false,
        letterbox: "on",
        unmuteOverlay: "hidden",
        contextMenu: "off",
        showSwfDownload: false,
        scale,
        wmode: "opaque",
        backgroundColor: "#100e0c",
        allowScriptAccess: true,
        allowFullscreen: true,
        quality: "high",
        maxExecutionDuration: 30,
        openUrlMode: "confirm",
      });
      if (dead) {
        player.remove();
        return;
      }
      playerRef.current = player;
      player.volume = volume / 100;
      if (bigCursor) hideEngineCursor(player);
      if (suspended) player.pause?.();
      setStatus("ready");
      onReadyRef.current?.();
    })().catch((err: unknown) => {
      if (dead) return;
      const message = err instanceof Error ? err.message : "O jogo não abriu.";
      setStatus("error");
      setDetail(message);
      onErrorRef.current?.(message);
    });

    return () => {
      dead = true;
      player?.remove();
      playerRef.current = null;
    };
    // volume, cursor and pause are applied in their own effects
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, fileName, scale]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player || status !== "ready") return;
    player.volume = volume / 100;
  }, [volume, status]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player || status !== "ready") return;
    if (suspended) player.pause?.();
    else player.play?.();
  }, [suspended, status]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player || !bigCursor) return;
    hideEngineCursor(player);
  }, [bigCursor, status]);

  return (
    <div className="absolute inset-0 bg-bg">
      <div ref={hostRef} className="absolute inset-0" />
      {status === "loading" ? (
        <p className="pointer-events-none absolute bottom-8 left-0 right-0 text-center text-sm text-muted">
          Abrindo o jogo…
        </p>
      ) : null}
      {status === "error" ? (
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div className="max-w-md text-center">
            <p className="font-serif text-3xl text-fg">O jogo não abriu.</p>
            <p className="mt-3 text-sm break-words text-muted">{detail}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
