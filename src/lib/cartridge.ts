const DB_NAME = "cartucho";
const STORE = "slot";
const KEY = "game";
const PREF_KEY = "cartucho-aparelho";

export const MAX_SWF_BYTES = 120 * 1024 * 1024;

export type ScaleMode = "showAll" | "exactFit" | "noBorder";

export type Note = {
  id: string;
  x: number;
  y: number;
  text: string;
};

export type Cartridge = {
  v: 1;
  fileName: string;
  title: string;
  addedAt: number;
  size: number;
  blob: Blob;
  notes: Note[];
  notesOn: boolean;
};

export type Prefs = {
  v: 1;
  bigCursor: boolean;
  scale: ScaleMode;
  volume: number;
};

export const DEFAULT_PREFS: Prefs = {
  v: 1,
  bigCursor: true,
  scale: "showAll",
  volume: 80,
};

export function isSwf(bytes: Uint8Array): boolean {
  if (bytes.length < 8) return false;
  const sig = String.fromCharCode(bytes[0] ?? 0, bytes[1] ?? 0, bytes[2] ?? 0);
  return sig === "FWS" || sig === "CWS" || sig === "ZWS";
}

export function titleFromFileName(name: string): string {
  const base = name.replace(/^.*[/\\]/, "").replace(/\.swf$/i, "");
  const clean = base.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  return clean || "Sem nome";
}

export function formatBytes(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  const mb = size / (1024 * 1024);
  return `${mb >= 10 ? Math.round(mb) : mb.toFixed(1)} MB`;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("Falha ao abrir o aparelho"));
  });
}

function normalize(raw: unknown): Cartridge | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Partial<Cartridge>;
  if (!(r.blob instanceof Blob)) return null;
  if (typeof r.fileName !== "string" || typeof r.title !== "string") return null;
  const notes = Array.isArray(r.notes)
    ? r.notes.filter(
        (n): n is Note =>
          !!n &&
          typeof n === "object" &&
          typeof n.id === "string" &&
          typeof n.x === "number" &&
          typeof n.y === "number" &&
          typeof n.text === "string",
      )
    : [];
  return {
    v: 1,
    fileName: r.fileName,
    title: r.title,
    addedAt: typeof r.addedAt === "number" ? r.addedAt : Date.now(),
    size: typeof r.size === "number" ? r.size : r.blob.size,
    blob: r.blob,
    notes,
    notesOn: r.notesOn === true,
  };
}

export async function readCartridge(): Promise<Cartridge | null> {
  const db = await openDb();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(KEY);
      req.onsuccess = () => resolve(normalize(req.result));
      req.onerror = () => reject(req.error ?? new Error("Falha ao ler o cartucho"));
    });
  } finally {
    db.close();
  }
}

export async function writeCartridge(cart: Cartridge): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      const req = tx.objectStore(STORE).put(cart, KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error ?? new Error("Falha ao gravar o cartucho"));
    });
  } finally {
    db.close();
  }
}

export async function deleteCartridge(): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      const req = tx.objectStore(STORE).delete(KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error ?? new Error("Falha ao apagar o cartucho"));
    });
  } finally {
    db.close();
  }
}

export function readPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(PREF_KEY);
    if (!raw) return DEFAULT_PREFS;
    const p = JSON.parse(raw) as Partial<Prefs>;
    const scale: ScaleMode =
      p.scale === "exactFit" || p.scale === "noBorder" || p.scale === "showAll"
        ? p.scale
        : "showAll";
    const volume = typeof p.volume === "number" ? Math.min(100, Math.max(0, p.volume)) : 80;
    return {
      v: 1,
      bigCursor: p.bigCursor !== false,
      scale,
      volume,
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function writePrefs(prefs: Prefs): void {
  localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
}
