import { previewPathPrefix } from "@/lib/preview-path-prefix";

export type RufflePlayerElement = HTMLElement & {
  ruffle: () => {
    load: (options: Record<string, unknown>) => Promise<void>;
  };
  pause?: () => void;
  play?: () => void;
  volume: number;
};

type RuffleSource = {
  createPlayer: () => RufflePlayerElement;
};

type RuffleGlobal = {
  config?: Record<string, unknown>;
  newest?: () => RuffleSource;
};

declare global {
  interface Window {
    RufflePlayer?: RuffleGlobal;
  }
}

let loading: Promise<void> | null = null;

function assetPrefix(): string {
  if (typeof window === "undefined") return "";
  return previewPathPrefix(window.location.hostname, window.location.pathname) ?? "";
}

export function loadRuffle(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Motor só existe no navegador"));
  }
  if (window.RufflePlayer?.newest) return Promise.resolve();
  if (loading) return loading;

  const prefix = assetPrefix();
  const publicPath = `${prefix}/ruffle/`;
  const current = window.RufflePlayer;
  window.RufflePlayer = {
    ...(current ?? {}),
    config: {
      ...(current?.config ?? {}),
      polyfills: false,
      publicPath,
      autoplay: "on",
      splashScreen: false,
      letterbox: "on",
      unmuteOverlay: "hidden",
      contextMenu: "off",
      showSwfDownload: false,
    },
  };

  loading = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `${publicPath}ruffle.js`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loading = null;
      reject(new Error("O motor não carregou."));
    };
    document.head.appendChild(script);
  });
  return loading;
}

export function hideEngineCursor(player: HTMLElement): void {
  const root = player.shadowRoot;
  if (!root || root.querySelector("[data-sala-cursor]")) return;
  const style = document.createElement("style");
  style.dataset.salaCursor = "on";
  style.textContent = "* { cursor: none !important; }";
  root.appendChild(style);
}
