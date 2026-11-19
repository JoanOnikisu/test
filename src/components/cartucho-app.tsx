import { useEffect, useRef, useState, type ChangeEvent, type PointerEvent as ReactPointerEvent, type ReactNode, type RefObject } from "react";
import { Disc, MousePointer2, Power } from "lucide-react";
import {
  DEFAULT_PREFS,
  MAX_SWF_BYTES,
  deleteCartridge,
  formatBytes,
  isSwf,
  readCartridge,
  readPrefs,
  titleFromFileName,
  writeCartridge,
  writePrefs,
  type Cartridge,
  type Note,
  type Prefs,
  type ScaleMode,
} from "@/lib/cartridge";
import { FlashStage } from "@/components/flash-stage";

type Phase = "reading" | "empty" | "sealing" | "boot" | "play";
type Overlay = "none" | "system" | "edit";

const SCALES: { id: ScaleMode; label: string; hint: string }[] = [
  { id: "showAll", label: "Encaixar", hint: "O jogo inteiro, com faixa se precisar" },
  { id: "exactFit", label: "Esticar", hint: "Preenche a TV, pode deformar" },
  { id: "noBorder", label: "Cortar", hint: "Enche a tela e corta a borda" },
];

function uid(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function clamp01(n: number): number {
  return Math.min(0.96, Math.max(0.04, n));
}

function explainWrite(err: unknown): string {
  if (err instanceof DOMException && err.name === "QuotaExceededError") {
    return "Sem espaço para gravar esse SWF.";
  }
  return "Não consegui gravar o cartucho.";
}

export function CartuchoApp() {
  const [phase, setPhase] = useState<Phase>("reading");
  const [overlay, setOverlay] = useState<Overlay>("none");
  const [cart, setCart] = useState<Cartridge | null>(null);
  const [movie, setMovie] = useState<ArrayBuffer | null>(null);
  const [session, setSession] = useState(0);
  const [liveScale, setLiveScale] = useState<ScaleMode>(DEFAULT_PREFS.scale);
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [prefsReady, setPrefsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [activeNote, setActiveNote] = useState<string | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const cartRef = useRef<Cartridge | null>(null);
  const sealing = useRef(false);
  cartRef.current = cart;

  useEffect(() => {
    setPrefs(readPrefs());
    setPrefsReady(true);
    let cancel = false;
    readCartridge()
      .then((found) => {
        if (cancel) return;
        setCart(found);
        setPhase(found ? "boot" : "empty");
      })
      .catch(() => {
        if (cancel) return;
        setError("Não consegui ler o que estava gravado.");
        setPhase("empty");
      });
    return () => {
      cancel = true;
    };
  }, []);

  useEffect(() => {
    if (!prefsReady) return;
    writePrefs(prefs);
  }, [prefs, prefsReady]);

  useEffect(() => {
    document.documentElement.classList.toggle("sala-cursor", prefs.bigCursor);
    return () => document.documentElement.classList.remove("sala-cursor");
  }, [prefs.bigCursor]);

  useEffect(() => {
    if (cart && phase !== "empty" && phase !== "reading" && phase !== "sealing") {
      document.title = cart.title;
    } else {
      document.title = "Cartucho";
    }
  }, [cart, phase]);

  useEffect(() => {
    if (!prefs.bigCursor) return;
    const el = cursorRef.current;
    if (!el) return;
    const move = (event: PointerEvent) => {
      el.style.transform = `translate(${event.clientX}px, ${event.clientY}px)`;
      el.style.opacity = "1";
    };
    const leave = () => {
      el.style.opacity = "0";
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerdown", move);
    document.documentElement.addEventListener("pointerleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", move);
      document.documentElement.removeEventListener("pointerleave", leave);
    };
  }, [prefs.bigCursor]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      const current = overlayRef.current;
      if (current === "edit") finishEditRef.current();
      else if (current === "system") setOverlay("none");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function sealFile(file: File) {
    setError(null);
    if (sealing.current || cartRef.current) {
      if (cartRef.current) setError("Já existe um jogo gravado. Apague o cartucho antes.");
      return;
    }
    sealing.current = true;
    try {
      if (file.size > MAX_SWF_BYTES) {
        setError("Esse SWF passa de 120 MB.");
        return;
      }
      const buf = await file.arrayBuffer();
      if (!isSwf(new Uint8Array(buf))) {
        setError("Isso não é um SWF. O aparelho só grava um arquivo Flash.");
        return;
      }
      const next: Cartridge = {
        v: 1,
        fileName: file.name,
        title: titleFromFileName(file.name),
        addedAt: Date.now(),
        size: file.size,
        blob: new Blob([buf], { type: "application/x-shockwave-flash" }),
        notes: [],
        notesOn: false,
      };
      setPhase("sealing");
      await writeCartridge(next);
      cartRef.current = next;
      setCart(next);
      setPhase("boot");
    } catch (err) {
      cartRef.current = null;
      setCart(null);
      setPhase("empty");
      setError(explainWrite(err));
    } finally {
      sealing.current = false;
    }
  }

  function onInput(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) void sealFile(file);
  }

  async function enter() {
    if (!cart) return;
    const data = await cart.blob.arrayBuffer();
    setLiveScale(prefs.scale);
    setMovie(data);
    setSession((n) => n + 1);
    setOverlay("none");
    setPhase("play");
  }

  function restartWithScale() {
    if (!cart) return;
    setLiveScale(prefs.scale);
    setSession((n) => n + 1);
    setOverlay("none");
  }

  async function wipe() {
    await deleteCartridge();
    cartRef.current = null;
    setCart(null);
    setMovie(null);
    setOverlay("none");
    setActiveNote(null);
    setPhase("empty");
  }

  function patchCart(recipe: (current: Cartridge) => Cartridge) {
    const current = cartRef.current;
    if (!current) return;
    const next = recipe(current);
    cartRef.current = next;
    setCart(next);
    void writeCartridge(next);
  }

  const finishEditRef = useRef<() => void>(() => {});
  const overlayRef = useRef<Overlay>("none");
  overlayRef.current = overlay;

  function finishEdit() {
    patchCart((current) => {
      const notes = current.notes.filter((note) => note.text.trim().length > 0);
      return { ...current, notes, notesOn: notes.length > 0 && current.notesOn };
    });
    setActiveNote(null);
    setOverlay("none");
  }
  finishEditRef.current = finishEdit;

  function addNote(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const note: Note = {
      id: uid(),
      x: clamp01((event.clientX - rect.left) / rect.width),
      y: clamp01((event.clientY - rect.top) / rect.height),
      text: "",
    };
    patchCart((current) => ({
      ...current,
      notesOn: true,
      notes: [...current.notes, note],
    }));
    setActiveNote(note.id);
  }

  function moveNote(id: string, x: number, y: number) {
    const current = cartRef.current;
    if (!current) return;
    const next = {
      ...current,
      notes: current.notes.map((note) => (note.id === id ? { ...note, x, y } : note)),
    };
    cartRef.current = next;
    setCart(next);
  }

  function commitNotes() {
    const current = cartRef.current;
    if (current) void writeCartridge(current);
  }

  const showNotes =
    phase === "play" && cart && (overlay === "edit" || (cart.notesOn && cart.notes.length > 0));

  return (
    <main className="min-h-dvh bg-bg text-fg">
      {phase === "reading" ? <Quiet message="Acendendo o aparelho…" /> : null}
      {phase === "sealing" ? <Quiet message="Gravando o cartucho…" /> : null}

      {phase === "empty" ? (
        <Screen>
          <Bezel led={false}>
            <p className="text-xs font-semibold tracking-widest text-muted">CARTUCHO</p>
            <h1 className="mt-8 max-w-xl font-serif text-5xl leading-tight text-fg md:text-7xl">
              Ainda não é um jogo.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted">
              Grave um SWF. A tela passa a ser esse jogo, e só ele. Outro arquivo só entra
              depois que você apagar o cartucho.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
              <label
                className={
                  "inline-flex min-h-14 cursor-pointer items-center justify-center gap-3 rounded-full bg-accent px-8 text-lg font-semibold text-ink " +
                  (dragOver ? "ring-2 ring-fg ring-offset-2 ring-offset-surface" : "")
                }
              >
                <Disc className="size-5" aria-hidden="true" />
                Escolher SWF
                <input
                  ref={fileRef}
                  className="sr-only"
                  type="file"
                  accept=".swf,application/x-shockwave-flash"
                  onChange={onInput}
                />
              </label>
              <p className="text-sm text-muted">Ou arraste o arquivo para cá.</p>
            </div>
            {error ? <p className="mt-6 max-w-lg text-base text-accent">{error}</p> : null}
            <p className="mt-12 max-w-lg text-sm leading-relaxed text-muted">
              Feito para a sala: mouse, letra grande, um clique para entrar. Um arquivo só —
              o que estiver fora do SWF não vem junto.
            </p>
          </Bezel>
        </Screen>
      ) : null}

      {phase === "boot" && cart ? (
        <Screen>
          <Bezel led>
            <p className="text-xs font-semibold tracking-widest text-muted">GRAVADO NESTE APARELHO</p>
            <h1 className="mt-8 font-serif text-5xl leading-tight text-fg md:text-7xl">{cart.title}</h1>
            <p className="mt-4 text-base text-muted">
              {cart.fileName} · {formatBytes(cart.size)}
            </p>
            <button
              type="button"
              className="mt-10 inline-flex min-h-14 items-center justify-center rounded-full bg-accent px-10 text-lg font-semibold text-ink"
              onClick={() => void enter()}
            >
              Entrar
            </button>
            <p className="mt-6 text-sm text-muted">O clique libera o som.</p>
          </Bezel>
        </Screen>
      ) : null}

      {phase === "play" && cart && movie ? (
        <div className="fixed inset-0 bg-bg">
          <div ref={stageRef} className="absolute inset-0">
            <FlashStage
              key={session}
              data={movie}
              fileName={cart.fileName}
              scale={liveScale}
              volume={prefs.volume}
              bigCursor={prefs.bigCursor}
              suspended={overlay !== "none"}
            />
            {overlay === "edit" ? (
              <div
                className="absolute inset-0 z-20 cursor-crosshair"
                onPointerDown={addNote}
              />
            ) : null}
            {showNotes ? (
              <div className="pointer-events-none absolute inset-0 z-30">
                {cart.notes.map((note) => (
                  <NotePin
                    key={note.id}
                    note={note}
                    editing={overlay === "edit"}
                    active={activeNote === note.id}
                    stageRef={stageRef}
                    onActivate={() => setActiveNote(note.id)}
                    onText={(text) =>
                      patchCart((current) => ({
                        ...current,
                        notes: current.notes.map((item) =>
                          item.id === note.id ? { ...item, text } : item,
                        ),
                      }))
                    }
                    onMove={(x, y) => moveNote(note.id, x, y)}
                    onCommit={commitNotes}
                    onDelete={() => {
                      patchCart((current) => ({
                        ...current,
                        notes: current.notes.filter((item) => item.id !== note.id),
                      }));
                      setActiveNote(null);
                    }}
                  />
                ))}
              </div>
            ) : null}
            {overlay !== "system" ? (
              <button
                type="button"
                aria-label="Abrir o aparelho"
                className="absolute top-4 right-4 z-50 flex size-12 items-center justify-center rounded-full border border-line bg-bg"
                onClick={() => {
                  if (overlay === "edit") finishEdit();
                  setOverlay("system");
                }}
              >
                <span className="size-3 rounded-full bg-accent" />
              </button>
            ) : null}
          </div>

          {overlay === "edit" ? (
            <div className="absolute inset-x-0 bottom-0 z-40 flex flex-col gap-3 border-t border-line bg-surface px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-xl text-sm leading-relaxed text-muted">
                Clique no jogo para cravar uma nota. Arraste o pino. As notas ficam neste
                cartucho e somem se você apagar.
              </p>
              <button
                type="button"
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-accent px-6 font-semibold text-ink"
                onClick={finishEdit}
              >
                Concluir
              </button>
            </div>
          ) : null}

          {overlay === "system" ? (
            <SystemSheet
              cart={cart}
              prefs={prefs}
              liveScale={liveScale}
              onPrefs={(next) => setPrefs(next)}
              onClose={() => setOverlay("none")}
              onRestart={restartWithScale}
              onEdit={() => {
                patchCart((current) => ({ ...current, notesOn: true }));
                setOverlay("edit");
              }}
              onToggleNotes={() => patchCart((current) => ({ ...current, notesOn: !current.notesOn }))}
              onWipe={() => void wipe()}
            />
          ) : null}
        </div>
      ) : null}

      <DropCatcher
        active={phase === "empty"}
        onOver={setDragOver}
        onFile={(file) => void sealFile(file)}
      />

      {prefs.bigCursor ? (
        <div
          ref={cursorRef}
          aria-hidden="true"
          className="pointer-events-none fixed top-0 left-0 z-50 text-accent opacity-0"
        >
          <MousePointer2 className="size-9" fill="currentColor" stroke="var(--color-bg)" strokeWidth={1.25} />
        </div>
      ) : null}
    </main>
  );
}

function DropCatcher({
  active,
  onOver,
  onFile,
}: {
  active: boolean;
  onOver: (over: boolean) => void;
  onFile: (file: File) => void;
}) {
  const onOverRef = useRef(onOver);
  const onFileRef = useRef(onFile);
  onOverRef.current = onOver;
  onFileRef.current = onFile;

  useEffect(() => {
    if (!active) return;
    const over = (event: DragEvent) => {
      event.preventDefault();
      onOverRef.current(true);
    };
    const leave = (event: DragEvent) => {
      if (event.relatedTarget) return;
      onOverRef.current(false);
    };
    const drop = (event: DragEvent) => {
      event.preventDefault();
      onOverRef.current(false);
      const file = event.dataTransfer?.files[0];
      if (file) onFileRef.current(file);
    };
    window.addEventListener("dragover", over);
    window.addEventListener("dragleave", leave);
    window.addEventListener("drop", drop);
    return () => {
      window.removeEventListener("dragover", over);
      window.removeEventListener("dragleave", leave);
      window.removeEventListener("drop", drop);
    };
  }, [active]);
  return null;
}

function Screen({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh items-center justify-center overflow-auto p-5 md:p-12">
      <div className="w-full max-w-3xl">{children}</div>
    </div>
  );
}

function Bezel({ led, children }: { led: boolean; children: ReactNode }) {
  return (
    <section className="rounded-3xl border border-line bg-surface px-6 py-10 md:px-14 md:py-16">
      <div className="mb-2 flex justify-end">
        <span
          className={"size-3 rounded-full " + (led ? "bg-accent" : "bg-line")}
          aria-hidden="true"
        />
      </div>
      {children}
    </section>
  );
}

function Quiet({ message }: { message: string }) {
  return (
    <div className="flex min-h-dvh items-center justify-center p-8">
      <p className="font-serif text-3xl text-fg">{message}</p>
    </div>
  );
}

function NotePin({
  note,
  editing,
  active,
  stageRef,
  onActivate,
  onText,
  onMove,
  onCommit,
  onDelete,
}: {
  note: Note;
  editing: boolean;
  active: boolean;
  stageRef: RefObject<HTMLDivElement | null>;
  onActivate: () => void;
  onText: (text: string) => void;
  onMove: (x: number, y: number) => void;
  onCommit: () => void;
  onDelete: () => void;
}) {
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);

  return (
    <div
      className="absolute"
      style={{ left: `${note.x * 100}%`, top: `${note.y * 100}%` }}
    >
      <button
        type="button"
        aria-label="Mover nota"
        disabled={!editing}
        className={
          "absolute top-0 left-0 flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-fg " +
          (editing ? "pointer-events-auto" : "pointer-events-none")
        }
        onPointerDown={(event) => {
          if (!editing) return;
          event.stopPropagation();
          event.currentTarget.setPointerCapture(event.pointerId);
          drag.current = { x: note.x, y: note.y, px: event.clientX, py: event.clientY };
        }}
        onPointerMove={(event) => {
          const start = drag.current;
          const rect = stageRef.current?.getBoundingClientRect();
          if (!start || !rect || rect.width === 0 || rect.height === 0) return;
          onMove(
            clamp01(start.x + (event.clientX - start.px) / rect.width),
            clamp01(start.y + (event.clientY - start.py) / rect.height),
          );
        }}
        onPointerUp={(event) => {
          if (!drag.current) return;
          drag.current = null;
          event.currentTarget.releasePointerCapture(event.pointerId);
          onCommit();
          onActivate();
        }}
      >
        <span className="size-2.5 rounded-full bg-accent" />
      </button>
      <div
        className={
          "absolute top-0 left-6 w-max max-w-56 -translate-y-1/2 rounded-2xl bg-fg px-3 py-2 text-sm leading-snug text-bg " +
          (editing ? "pointer-events-auto" : "pointer-events-none")
        }
      >
        {editing && active ? (
          <input
            autoFocus
            value={note.text}
            placeholder="Tradução"
            maxLength={80}
            className="w-44 bg-transparent text-sm text-bg outline-none placeholder:text-muted"
            onPointerDown={(event) => event.stopPropagation()}
            onChange={(event) => onText(event.target.value)}
          />
        ) : (
          <button
            type="button"
            className="block max-w-full text-left"
            onClick={(event) => {
              event.stopPropagation();
              onActivate();
            }}
            onPointerDown={(event) => event.stopPropagation()}
          >
            {note.text || "Tradução"}
          </button>
        )}
        {editing && active ? (
          <button
            type="button"
            className="mt-1 text-xs font-semibold text-accent"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              onDelete();
            }}
          >
            Apagar nota
          </button>
        ) : null}
      </div>
    </div>
  );
}

function SystemSheet({
  cart,
  prefs,
  liveScale,
  onPrefs,
  onClose,
  onRestart,
  onEdit,
  onToggleNotes,
  onWipe,
}: {
  cart: Cartridge;
  prefs: Prefs;
  liveScale: ScaleMode;
  onPrefs: (prefs: Prefs) => void;
  onClose: () => void;
  onRestart: () => void;
  onEdit: () => void;
  onToggleNotes: () => void;
  onWipe: () => void;
}) {
  const when = new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(cart.addedAt);
  const scaleDirty = prefs.scale !== liveScale;

  return (
    <div className="absolute inset-0 z-40 overflow-auto bg-bg/95" role="dialog" aria-modal="true" aria-label="Aparelho">
      <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col px-5 py-8 md:px-10 md:py-12">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-widest text-muted">APARELHO</p>
            <h2 className="mt-3 font-serif text-4xl text-fg md:text-6xl">{cart.title}</h2>
            <p className="mt-3 text-sm text-muted">
              {cart.fileName} · {formatBytes(cart.size)} · {when}
            </p>
          </div>
          <button
            type="button"
            className="inline-flex size-12 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-fg"
            aria-label="Voltar ao jogo"
            onClick={onClose}
          >
            <Power className="size-5" aria-hidden="true" />
          </button>
        </div>

        <section className="mt-10">
          <h3 className="text-sm font-semibold tracking-wide text-fg">Encaixe na TV</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Encaixe na TV">
            {SCALES.map((item) => {
              const on = prefs.scale === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  className={
                    "min-h-20 rounded-2xl border px-4 py-3 text-left " +
                    (on ? "border-accent bg-accent text-ink" : "border-line bg-surface text-fg")
                  }
                  onClick={() => onPrefs({ ...prefs, scale: item.id })}
                >
                  <span className="block text-base font-semibold">{item.label}</span>
                  <span className={"mt-1 block text-xs " + (on ? "opacity-80" : "text-muted")}>
                    {item.hint}
                  </span>
                </button>
              );
            })}
          </div>
          {scaleDirty ? (
            <button
              type="button"
              className="mt-4 min-h-12 rounded-full border border-line px-5 text-sm font-semibold text-fg"
              onClick={onRestart}
            >
              Recomeçar com este encaixe
            </button>
          ) : (
            <p className="mt-4 text-sm text-muted">O encaixe atual já está na tela.</p>
          )}
        </section>

        <section className="mt-10 grid gap-8 md:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold tracking-wide text-fg">Cursor de sala</h3>
            <p className="mt-2 text-sm text-muted">Ponteiro grande, para enxergar do sofá.</p>
            <div className="mt-4 flex gap-3">
              <Toggle
                on={prefs.bigCursor}
                label="Grande"
                pressed={prefs.bigCursor}
                onClick={() => onPrefs({ ...prefs, bigCursor: true })}
              />
              <Toggle
                on={!prefs.bigCursor}
                label="Do sistema"
                pressed={!prefs.bigCursor}
                onClick={() => onPrefs({ ...prefs, bigCursor: false })}
              />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-wide text-fg">Som</h3>
            <p className="mt-2 text-sm text-muted">{prefs.volume === 0 ? "Mudo" : `${prefs.volume}%`}</p>
            <input
              className="mt-3 w-full"
              type="range"
              min={0}
              max={100}
              step={5}
              value={prefs.volume}
              aria-label="Volume"
              onChange={(event) => onPrefs({ ...prefs, volume: Number(event.target.value) })}
            />
          </div>
        </section>

        <section className="mt-10 rounded-3xl border border-line bg-surface p-5 md:p-6">
          <h3 className="text-sm font-semibold tracking-wide text-fg">Camada de tradução</h3>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
            Notas suas, cravadas em cima do jogo. Ficam neste cartucho e são apagadas junto com ele.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-fg px-5 font-semibold text-bg"
              onClick={onEdit}
            >
              Editar notas
            </button>
            <button
              type="button"
              aria-pressed={cart.notesOn}
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-line px-5 font-semibold text-fg"
              onClick={onToggleNotes}
            >
              {cart.notesOn ? "Notas visíveis" : "Notas escondidas"}
            </button>
          </div>
        </section>

        <section className="mt-10 border-t border-line pt-8">
          <h3 className="text-sm font-semibold tracking-wide text-fg">Trocar de jogo</h3>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
            Este aparelho é um jogo só. Para colocar outro SWF, o cartucho atual é apagado — arquivo e notas.
          </p>
          <HoldToWipe onComplete={onWipe} />
          <p className="mt-8 text-xs text-muted">Motor Ruffle. Um cartucho por vez.</p>
        </section>
      </div>
    </div>
  );
}

function Toggle({
  on,
  label,
  pressed,
  onClick,
}: {
  on: boolean;
  label: string;
  pressed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      className={
        "inline-flex min-h-12 items-center justify-center rounded-full px-5 font-semibold " +
        (on ? "bg-accent text-ink" : "border border-line bg-surface text-fg")
      }
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function HoldToWipe({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const frame = useRef(0);
  const done = useRef(false);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  function stop() {
    cancelAnimationFrame(frame.current);
    if (!done.current) setProgress(0);
  }

  function start(event: ReactPointerEvent<HTMLButtonElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    done.current = false;
    const t0 = performance.now();
    const tick = (now: number) => {
      const next = Math.min(1, (now - t0) / 1600);
      setProgress(next);
      if (next >= 1) {
        done.current = true;
        onComplete();
        return;
      }
      frame.current = requestAnimationFrame(tick);
    };
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(tick);
  }

  return (
    <button
      type="button"
      className="relative mt-5 inline-flex min-h-14 w-full items-center justify-center overflow-hidden rounded-full border border-accent px-6 text-base font-semibold text-fg sm:w-auto sm:min-w-72"
      onPointerDown={start}
      onPointerUp={stop}
      onPointerCancel={stop}
    >
      <span
        className="absolute inset-0 origin-left bg-accent"
        style={{ transform: `scaleX(${progress})` }}
      />
      <span className="relative text-fg">Segure para apagar</span>
    </button>
  );
}
