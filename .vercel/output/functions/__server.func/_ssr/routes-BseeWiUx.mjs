import { i as __toESM } from "../_runtime.mjs";
import { K as require_react, b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as Disc, n as Power, r as MousePointer2 } from "../_libs/lucide-react.mjs";
import { n as previewPathPrefix } from "./router-CRA9I_fs.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-BseeWiUx.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var DB_NAME = "cartucho";
var STORE = "slot";
var KEY = "game";
var PREF_KEY = "cartucho-aparelho";
var DEFAULT_PREFS = {
	v: 1,
	bigCursor: true,
	scale: "showAll",
	volume: 80
};
function isSwf(bytes) {
	if (bytes.length < 8) return false;
	const sig = String.fromCharCode(bytes[0] ?? 0, bytes[1] ?? 0, bytes[2] ?? 0);
	return sig === "FWS" || sig === "CWS" || sig === "ZWS";
}
function titleFromFileName(name) {
	return name.replace(/^.*[/\\]/, "").replace(/\.swf$/i, "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim() || "Sem nome";
}
function formatBytes(size) {
	if (size < 1024) return `${size} B`;
	if (size < 1048576) return `${Math.round(size / 1024)} KB`;
	const mb = size / 1048576;
	return `${mb >= 10 ? Math.round(mb) : mb.toFixed(1)} MB`;
}
function openDb() {
	return new Promise((resolve, reject) => {
		const req = indexedDB.open(DB_NAME, 1);
		req.onupgradeneeded = () => {
			const db = req.result;
			if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
		};
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error ?? /* @__PURE__ */ new Error("Falha ao abrir o aparelho"));
	});
}
function normalize(raw) {
	if (!raw || typeof raw !== "object") return null;
	const r = raw;
	if (!(r.blob instanceof Blob)) return null;
	if (typeof r.fileName !== "string" || typeof r.title !== "string") return null;
	const notes = Array.isArray(r.notes) ? r.notes.filter((n) => !!n && typeof n === "object" && typeof n.id === "string" && typeof n.x === "number" && typeof n.y === "number" && typeof n.text === "string") : [];
	return {
		v: 1,
		fileName: r.fileName,
		title: r.title,
		addedAt: typeof r.addedAt === "number" ? r.addedAt : Date.now(),
		size: typeof r.size === "number" ? r.size : r.blob.size,
		blob: r.blob,
		notes,
		notesOn: r.notesOn === true
	};
}
async function readCartridge() {
	const db = await openDb();
	try {
		return await new Promise((resolve, reject) => {
			const req = db.transaction(STORE, "readonly").objectStore(STORE).get(KEY);
			req.onsuccess = () => resolve(normalize(req.result));
			req.onerror = () => reject(req.error ?? /* @__PURE__ */ new Error("Falha ao ler o cartucho"));
		});
	} finally {
		db.close();
	}
}
async function writeCartridge(cart) {
	const db = await openDb();
	try {
		await new Promise((resolve, reject) => {
			const req = db.transaction(STORE, "readwrite").objectStore(STORE).put(cart, KEY);
			req.onsuccess = () => resolve();
			req.onerror = () => reject(req.error ?? /* @__PURE__ */ new Error("Falha ao gravar o cartucho"));
		});
	} finally {
		db.close();
	}
}
async function deleteCartridge() {
	const db = await openDb();
	try {
		await new Promise((resolve, reject) => {
			const req = db.transaction(STORE, "readwrite").objectStore(STORE).delete(KEY);
			req.onsuccess = () => resolve();
			req.onerror = () => reject(req.error ?? /* @__PURE__ */ new Error("Falha ao apagar o cartucho"));
		});
	} finally {
		db.close();
	}
}
function readPrefs() {
	try {
		const raw = localStorage.getItem(PREF_KEY);
		if (!raw) return DEFAULT_PREFS;
		const p = JSON.parse(raw);
		const scale = p.scale === "exactFit" || p.scale === "noBorder" || p.scale === "showAll" ? p.scale : "showAll";
		const volume = typeof p.volume === "number" ? Math.min(100, Math.max(0, p.volume)) : 80;
		return {
			v: 1,
			bigCursor: p.bigCursor !== false,
			scale,
			volume
		};
	} catch {
		return DEFAULT_PREFS;
	}
}
function writePrefs(prefs) {
	localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
}
var loading = null;
function assetPrefix() {
	if (typeof window === "undefined") return "";
	return previewPathPrefix(window.location.hostname, window.location.pathname) ?? "";
}
function loadRuffle() {
	if (typeof window === "undefined") return Promise.reject(/* @__PURE__ */ new Error("Motor só existe no navegador"));
	if (window.RufflePlayer?.newest) return Promise.resolve();
	if (loading) return loading;
	const publicPath = `${assetPrefix()}/ruffle/`;
	const current = window.RufflePlayer;
	window.RufflePlayer = {
		...current ?? {},
		config: {
			...current?.config ?? {},
			polyfills: false,
			publicPath,
			autoplay: "on",
			splashScreen: false,
			preloader: false,
			letterbox: "on",
			unmuteOverlay: "hidden",
			contextMenu: "off",
			showSwfDownload: false
		}
	};
	loading = new Promise((resolve, reject) => {
		const script = document.createElement("script");
		script.src = `${publicPath}ruffle.js`;
		script.async = true;
		script.onload = () => resolve();
		script.onerror = () => {
			loading = null;
			reject(/* @__PURE__ */ new Error("O motor não carregou."));
		};
		document.head.appendChild(script);
	});
	return loading;
}
function hideEngineCursor(player) {
	const root = player.shadowRoot;
	if (!root || root.querySelector("[data-sala-cursor]")) return;
	const style = document.createElement("style");
	style.dataset.salaCursor = "on";
	style.textContent = "* { cursor: none !important; }";
	root.appendChild(style);
}
function FlashStage({ data, fileName, scale, volume, bigCursor, suspended, onReady, onError }) {
	const hostRef = (0, import_react.useRef)(null);
	const playerRef = (0, import_react.useRef)(null);
	const onReadyRef = (0, import_react.useRef)(onReady);
	const onErrorRef = (0, import_react.useRef)(onError);
	const [status, setStatus] = (0, import_react.useState)("loading");
	const [detail, setDetail] = (0, import_react.useState)("");
	onReadyRef.current = onReady;
	onErrorRef.current = onError;
	(0, import_react.useEffect)(() => {
		if (!hostRef.current) return;
		let dead = false;
		let player = null;
		setStatus("loading");
		setDetail("");
		(async () => {
			await loadRuffle();
			if (dead || !hostRef.current) return;
			const newest = window.RufflePlayer?.newest;
			if (!newest) throw new Error("Motor indisponível.");
			const source = newest();
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
				preloader: false,
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
				openUrlMode: "confirm"
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
		})().catch((err) => {
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
	}, [
		data,
		fileName,
		scale
	]);
	(0, import_react.useEffect)(() => {
		const player = playerRef.current;
		if (!player || status !== "ready") return;
		player.volume = volume / 100;
	}, [volume, status]);
	(0, import_react.useEffect)(() => {
		const player = playerRef.current;
		if (!player || status !== "ready") return;
		if (suspended) player.pause?.();
		else player.play?.();
	}, [suspended, status]);
	(0, import_react.useEffect)(() => {
		const player = playerRef.current;
		if (!player || !bigCursor) return;
		hideEngineCursor(player);
	}, [bigCursor, status]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "absolute inset-0 bg-bg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				ref: hostRef,
				className: "absolute inset-0"
			}),
			status === "loading" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "pointer-events-none absolute bottom-8 left-0 right-0 text-center text-sm text-muted",
				children: "Abrindo o jogo…"
			}) : null,
			status === "error" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute inset-0 flex items-center justify-center p-8",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "max-w-md text-center",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-serif text-3xl text-fg",
						children: "O jogo não abriu."
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-sm break-words text-muted",
						children: detail
					})]
				})
			}) : null
		]
	});
}
var SCALES = [
	{
		id: "showAll",
		label: "Encaixar",
		hint: "O jogo inteiro, com faixa se precisar"
	},
	{
		id: "exactFit",
		label: "Esticar",
		hint: "Preenche a TV, pode deformar"
	},
	{
		id: "noBorder",
		label: "Cortar",
		hint: "Enche a tela e corta a borda"
	}
];
function uid() {
	return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
function clamp01(n) {
	return Math.min(.96, Math.max(.04, n));
}
function explainWrite(err) {
	if (err instanceof DOMException && err.name === "QuotaExceededError") return "Sem espaço para gravar esse SWF.";
	return "Não consegui gravar o cartucho.";
}
function CartuchoApp() {
	const [phase, setPhase] = (0, import_react.useState)("reading");
	const [overlay, setOverlay] = (0, import_react.useState)("none");
	const [cart, setCart] = (0, import_react.useState)(null);
	const [movie, setMovie] = (0, import_react.useState)(null);
	const [session, setSession] = (0, import_react.useState)(0);
	const [liveScale, setLiveScale] = (0, import_react.useState)(DEFAULT_PREFS.scale);
	const [prefs, setPrefs] = (0, import_react.useState)(DEFAULT_PREFS);
	const [prefsReady, setPrefsReady] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	const [dragOver, setDragOver] = (0, import_react.useState)(false);
	const [activeNote, setActiveNote] = (0, import_react.useState)(null);
	const stageRef = (0, import_react.useRef)(null);
	const cursorRef = (0, import_react.useRef)(null);
	const fileRef = (0, import_react.useRef)(null);
	const cartRef = (0, import_react.useRef)(null);
	const sealing = (0, import_react.useRef)(false);
	cartRef.current = cart;
	(0, import_react.useEffect)(() => {
		setPrefs(readPrefs());
		setPrefsReady(true);
		let cancel = false;
		readCartridge().then((found) => {
			if (cancel) return;
			setCart(found);
			setPhase(found ? "boot" : "empty");
		}).catch(() => {
			if (cancel) return;
			setError("Não consegui ler o que estava gravado.");
			setPhase("empty");
		});
		return () => {
			cancel = true;
		};
	}, []);
	(0, import_react.useEffect)(() => {
		if (!prefsReady) return;
		writePrefs(prefs);
	}, [prefs, prefsReady]);
	(0, import_react.useEffect)(() => {
		document.documentElement.classList.toggle("sala-cursor", prefs.bigCursor);
		return () => document.documentElement.classList.remove("sala-cursor");
	}, [prefs.bigCursor]);
	(0, import_react.useEffect)(() => {
		if (cart && phase !== "empty" && phase !== "reading" && phase !== "sealing") document.title = cart.title;
		else document.title = "Cartucho";
	}, [cart, phase]);
	(0, import_react.useEffect)(() => {
		if (!prefs.bigCursor) return;
		const el = cursorRef.current;
		if (!el) return;
		const move = (event) => {
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
	(0, import_react.useEffect)(() => {
		const onKey = (event) => {
			if (event.key !== "Escape") return;
			const current = overlayRef.current;
			if (current === "edit") finishEditRef.current();
			else if (current === "system") setOverlay("none");
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, []);
	async function sealFile(file) {
		setError(null);
		if (sealing.current || cartRef.current) {
			if (cartRef.current) setError("Já existe um jogo gravado. Apague o cartucho antes.");
			return;
		}
		sealing.current = true;
		try {
			if (file.size > 125829120) {
				setError("Esse SWF passa de 120 MB.");
				return;
			}
			const buf = await file.arrayBuffer();
			if (!isSwf(new Uint8Array(buf))) {
				setError("Isso não é um SWF. O aparelho só grava um arquivo Flash.");
				return;
			}
			const next = {
				v: 1,
				fileName: file.name,
				title: titleFromFileName(file.name),
				addedAt: Date.now(),
				size: file.size,
				blob: new Blob([buf], { type: "application/x-shockwave-flash" }),
				notes: [],
				notesOn: false
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
	function onInput(event) {
		const file = event.target.files?.[0];
		event.target.value = "";
		if (file) sealFile(file);
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
	function patchCart(recipe) {
		const current = cartRef.current;
		if (!current) return;
		const next = recipe(current);
		cartRef.current = next;
		setCart(next);
		writeCartridge(next);
	}
	const finishEditRef = (0, import_react.useRef)(() => {});
	const overlayRef = (0, import_react.useRef)("none");
	overlayRef.current = overlay;
	function finishEdit() {
		patchCart((current) => {
			const notes = current.notes.filter((note) => note.text.trim().length > 0);
			return {
				...current,
				notes,
				notesOn: notes.length > 0 && current.notesOn
			};
		});
		setActiveNote(null);
		setOverlay("none");
	}
	finishEditRef.current = finishEdit;
	function addNote(event) {
		if (event.target !== event.currentTarget) return;
		const rect = event.currentTarget.getBoundingClientRect();
		const note = {
			id: uid(),
			x: clamp01((event.clientX - rect.left) / rect.width),
			y: clamp01((event.clientY - rect.top) / rect.height),
			text: ""
		};
		patchCart((current) => ({
			...current,
			notesOn: true,
			notes: [...current.notes, note]
		}));
		setActiveNote(note.id);
	}
	function moveNote(id, x, y) {
		const current = cartRef.current;
		if (!current) return;
		const next = {
			...current,
			notes: current.notes.map((note) => note.id === id ? {
				...note,
				x,
				y
			} : note)
		};
		cartRef.current = next;
		setCart(next);
	}
	function commitNotes() {
		const current = cartRef.current;
		if (current) writeCartridge(current);
	}
	const showNotes = phase === "play" && cart && (overlay === "edit" || cart.notesOn && cart.notes.length > 0);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "min-h-dvh bg-bg text-fg",
		children: [
			phase === "reading" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Quiet, { message: "Acendendo o aparelho…" }) : null,
			phase === "sealing" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Quiet, { message: "Gravando o cartucho…" }) : null,
			phase === "empty" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Screen, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Bezel, {
				led: false,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs font-semibold tracking-widest text-muted",
						children: "CARTUCHO"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-8 max-w-xl font-serif text-5xl leading-tight text-fg md:text-7xl",
						children: "Ainda não é um jogo."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-6 max-w-lg text-lg leading-relaxed text-muted",
						children: "Grave um SWF. A tela passa a ser esse jogo, e só ele. Outro arquivo só entra depois que você apagar o cartucho."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-10 flex flex-col gap-4 sm:flex-row sm:items-center",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "inline-flex min-h-14 cursor-pointer items-center justify-center gap-3 rounded-full bg-accent px-8 text-lg font-semibold text-ink " + (dragOver ? "ring-2 ring-fg ring-offset-2 ring-offset-surface" : ""),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Disc, {
									className: "size-5",
									"aria-hidden": "true"
								}),
								"Escolher SWF",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									ref: fileRef,
									className: "sr-only",
									type: "file",
									accept: ".swf,application/x-shockwave-flash",
									onChange: onInput
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted",
							children: "Ou arraste o arquivo para cá."
						})]
					}),
					error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-6 max-w-lg text-base text-accent",
						children: error
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-12 max-w-lg text-sm leading-relaxed text-muted",
						children: "Feito para a sala: mouse, letra grande, um clique para entrar. Um arquivo só — o que estiver fora do SWF não vem junto."
					})
				]
			}) }) : null,
			phase === "boot" && cart ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Screen, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Bezel, {
				led: true,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs font-semibold tracking-widest text-muted",
						children: "GRAVADO NESTE APARELHO"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-8 font-serif text-5xl leading-tight text-fg md:text-7xl",
						children: cart.title
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-4 text-base text-muted",
						children: [
							cart.fileName,
							" · ",
							formatBytes(cart.size)
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "mt-10 inline-flex min-h-14 items-center justify-center rounded-full bg-accent px-10 text-lg font-semibold text-ink",
						onClick: () => void enter(),
						children: "Entrar"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-6 text-sm text-muted",
						children: "O clique libera o som."
					})
				]
			}) }) : null,
			phase === "play" && cart && movie ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "fixed inset-0 bg-bg",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						ref: stageRef,
						className: "absolute inset-0",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FlashStage, {
								data: movie,
								fileName: cart.fileName,
								scale: liveScale,
								volume: prefs.volume,
								bigCursor: prefs.bigCursor,
								suspended: overlay !== "none"
							}, session),
							overlay === "edit" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "absolute inset-0 z-20 cursor-crosshair",
								onPointerDown: addNote
							}) : null,
							showNotes ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "pointer-events-none absolute inset-0 z-30",
								children: cart.notes.map((note) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NotePin, {
									note,
									editing: overlay === "edit",
									active: activeNote === note.id,
									stageRef,
									onActivate: () => setActiveNote(note.id),
									onText: (text) => patchCart((current) => ({
										...current,
										notes: current.notes.map((item) => item.id === note.id ? {
											...item,
											text
										} : item)
									})),
									onMove: (x, y) => moveNote(note.id, x, y),
									onCommit: commitNotes,
									onDelete: () => {
										patchCart((current) => ({
											...current,
											notes: current.notes.filter((item) => item.id !== note.id)
										}));
										setActiveNote(null);
									}
								}, note.id))
							}) : null,
							overlay !== "system" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								"aria-label": "Abrir o aparelho",
								className: "absolute top-4 right-4 z-50 flex size-12 items-center justify-center",
								onClick: () => {
									if (overlay === "edit") finishEdit();
									setOverlay("system");
								},
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-3 rounded-full bg-accent" })
							}) : null
						]
					}),
					overlay === "edit" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "absolute inset-x-0 bottom-0 z-40 flex flex-col gap-3 border-t border-line bg-surface px-5 py-4 sm:flex-row sm:items-center sm:justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "max-w-xl text-sm leading-relaxed text-muted",
							children: "Clique no jogo para cravar uma nota. Arraste o pino. As notas ficam neste cartucho e somem se você apagar."
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "inline-flex min-h-12 items-center justify-center rounded-full bg-accent px-6 font-semibold text-ink",
							onClick: finishEdit,
							children: "Concluir"
						})]
					}) : null,
					overlay === "system" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SystemSheet, {
						cart,
						prefs,
						liveScale,
						onPrefs: (next) => setPrefs(next),
						onClose: () => setOverlay("none"),
						onRestart: restartWithScale,
						onEdit: () => {
							patchCart((current) => ({
								...current,
								notesOn: true
							}));
							setOverlay("edit");
						},
						onToggleNotes: () => patchCart((current) => ({
							...current,
							notesOn: !current.notesOn
						})),
						onWipe: () => void wipe()
					}) : null
				]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropCatcher, {
				active: phase === "empty",
				onOver: setDragOver,
				onFile: (file) => void sealFile(file)
			}),
			prefs.bigCursor ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				ref: cursorRef,
				"aria-hidden": "true",
				className: "pointer-events-none fixed top-0 left-0 z-50 text-accent opacity-0",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MousePointer2, {
					className: "size-9",
					fill: "currentColor",
					stroke: "var(--color-bg)",
					strokeWidth: 1.25
				})
			}) : null
		]
	});
}
function DropCatcher({ active, onOver, onFile }) {
	const onOverRef = (0, import_react.useRef)(onOver);
	const onFileRef = (0, import_react.useRef)(onFile);
	onOverRef.current = onOver;
	onFileRef.current = onFile;
	(0, import_react.useEffect)(() => {
		if (!active) return;
		const over = (event) => {
			event.preventDefault();
			onOverRef.current(true);
		};
		const leave = (event) => {
			if (event.relatedTarget) return;
			onOverRef.current(false);
		};
		const drop = (event) => {
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
function Screen({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-dvh items-center justify-center overflow-auto p-5 md:p-12",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "w-full max-w-3xl",
			children
		})
	});
}
function Bezel({ led, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "rounded-3xl border border-line bg-surface px-6 py-10 md:px-14 md:py-16",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mb-2 flex justify-end",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "size-3 rounded-full " + (led ? "bg-accent" : "bg-line"),
				"aria-hidden": "true"
			})
		}), children]
	});
}
function Quiet({ message }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-dvh items-center justify-center p-8",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "font-serif text-3xl text-fg",
			children: message
		})
	});
}
function NotePin({ note, editing, active, stageRef, onActivate, onText, onMove, onCommit, onDelete }) {
	const drag = (0, import_react.useRef)(null);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "absolute",
		style: {
			left: `${note.x * 100}%`,
			top: `${note.y * 100}%`
		},
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			"aria-label": "Mover nota",
			disabled: !editing,
			className: "absolute top-0 left-0 flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-fg " + (editing ? "pointer-events-auto" : "pointer-events-none"),
			onPointerDown: (event) => {
				if (!editing) return;
				event.stopPropagation();
				event.currentTarget.setPointerCapture(event.pointerId);
				drag.current = {
					x: note.x,
					y: note.y,
					px: event.clientX,
					py: event.clientY
				};
			},
			onPointerMove: (event) => {
				const start = drag.current;
				const rect = stageRef.current?.getBoundingClientRect();
				if (!start || !rect || rect.width === 0 || rect.height === 0) return;
				onMove(clamp01(start.x + (event.clientX - start.px) / rect.width), clamp01(start.y + (event.clientY - start.py) / rect.height));
			},
			onPointerUp: (event) => {
				if (!drag.current) return;
				drag.current = null;
				event.currentTarget.releasePointerCapture(event.pointerId);
				onCommit();
				onActivate();
			},
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-2.5 rounded-full bg-accent" })
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "absolute top-0 left-6 w-max max-w-56 -translate-y-1/2 rounded-2xl bg-fg px-3 py-2 text-sm leading-snug text-bg " + (editing ? "pointer-events-auto" : "pointer-events-none"),
			children: [editing && active ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				autoFocus: true,
				value: note.text,
				placeholder: "Tradução",
				maxLength: 80,
				className: "w-44 bg-transparent text-sm text-bg outline-none placeholder:text-muted",
				onPointerDown: (event) => event.stopPropagation(),
				onChange: (event) => onText(event.target.value)
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "block max-w-full text-left",
				onClick: (event) => {
					event.stopPropagation();
					onActivate();
				},
				onPointerDown: (event) => event.stopPropagation(),
				children: note.text || "Tradução"
			}), editing && active ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "mt-1 text-xs font-semibold text-accent",
				onPointerDown: (event) => event.stopPropagation(),
				onClick: (event) => {
					event.stopPropagation();
					onDelete();
				},
				children: "Apagar nota"
			}) : null]
		})]
	});
}
function SystemSheet({ cart, prefs, liveScale, onPrefs, onClose, onRestart, onEdit, onToggleNotes, onWipe }) {
	const when = new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(cart.addedAt);
	const scaleDirty = prefs.scale !== liveScale;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "absolute inset-0 z-40 overflow-auto bg-bg/95",
		role: "dialog",
		"aria-modal": "true",
		"aria-label": "Aparelho",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto flex min-h-full w-full max-w-3xl flex-col px-5 py-8 md:px-10 md:py-12",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start justify-between gap-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs font-semibold tracking-widest text-muted",
							children: "APARELHO"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "mt-3 font-serif text-4xl text-fg md:text-6xl",
							children: cart.title
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-3 text-sm text-muted",
							children: [
								cart.fileName,
								" · ",
								formatBytes(cart.size),
								" · ",
								when
							]
						})
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "inline-flex size-12 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-fg",
						"aria-label": "Voltar ao jogo",
						onClick: onClose,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Power, {
							className: "size-5",
							"aria-hidden": "true"
						})
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "mt-10",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-sm font-semibold tracking-wide text-fg",
							children: "Encaixe na TV"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-4 grid gap-3 sm:grid-cols-3",
							role: "radiogroup",
							"aria-label": "Encaixe na TV",
							children: SCALES.map((item) => {
								const on = prefs.scale === item.id;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									role: "radio",
									"aria-checked": on,
									className: "min-h-20 rounded-2xl border px-4 py-3 text-left " + (on ? "border-accent bg-accent text-ink" : "border-line bg-surface text-fg"),
									onClick: () => onPrefs({
										...prefs,
										scale: item.id
									}),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "block text-base font-semibold",
										children: item.label
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "mt-1 block text-xs " + (on ? "opacity-80" : "text-muted"),
										children: item.hint
									})]
								}, item.id);
							})
						}),
						scaleDirty ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "mt-4 min-h-12 rounded-full border border-line px-5 text-sm font-semibold text-fg",
							onClick: onRestart,
							children: "Recomeçar com este encaixe"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-4 text-sm text-muted",
							children: "O encaixe atual já está na tela."
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "mt-10 grid gap-8 md:grid-cols-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-sm font-semibold tracking-wide text-fg",
							children: "Cursor de sala"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm text-muted",
							children: "Ponteiro grande, para enxergar do sofá."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-4 flex gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
								on: prefs.bigCursor,
								label: "Grande",
								pressed: prefs.bigCursor,
								onClick: () => onPrefs({
									...prefs,
									bigCursor: true
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
								on: !prefs.bigCursor,
								label: "Do sistema",
								pressed: !prefs.bigCursor,
								onClick: () => onPrefs({
									...prefs,
									bigCursor: false
								})
							})]
						})
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-sm font-semibold tracking-wide text-fg",
							children: "Som"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm text-muted",
							children: prefs.volume === 0 ? "Mudo" : `${prefs.volume}%`
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: "mt-3 w-full",
							type: "range",
							min: 0,
							max: 100,
							step: 5,
							value: prefs.volume,
							"aria-label": "Volume",
							onChange: (event) => onPrefs({
								...prefs,
								volume: Number(event.target.value)
							})
						})
					] })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "mt-10 rounded-3xl border border-line bg-surface p-5 md:p-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-sm font-semibold tracking-wide text-fg",
							children: "Camada de tradução"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 max-w-xl text-sm leading-relaxed text-muted",
							children: "Notas suas, cravadas em cima do jogo. Ficam neste cartucho e são apagadas junto com ele."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-4 flex flex-col gap-3 sm:flex-row",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "inline-flex min-h-12 items-center justify-center rounded-full bg-fg px-5 font-semibold text-bg",
								onClick: onEdit,
								children: "Editar notas"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								"aria-pressed": cart.notesOn,
								className: "inline-flex min-h-12 items-center justify-center rounded-full border border-line px-5 font-semibold text-fg",
								onClick: onToggleNotes,
								children: cart.notesOn ? "Notas visíveis" : "Notas escondidas"
							})]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "mt-10 border-t border-line pt-8",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-sm font-semibold tracking-wide text-fg",
							children: "Trocar de jogo"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 max-w-xl text-sm leading-relaxed text-muted",
							children: "Este aparelho é um jogo só. Para colocar outro SWF, o cartucho atual é apagado — arquivo e notas."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HoldToWipe, { onComplete: onWipe }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-8 text-xs text-muted",
							children: "Motor Ruffle. Um cartucho por vez."
						})
					]
				})
			]
		})
	});
}
function Toggle({ on, label, pressed, onClick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		"aria-pressed": pressed,
		className: "inline-flex min-h-12 items-center justify-center rounded-full px-5 font-semibold " + (on ? "bg-accent text-ink" : "border border-line bg-surface text-fg"),
		onClick,
		children: label
	});
}
function HoldToWipe({ onComplete }) {
	const [progress, setProgress] = (0, import_react.useState)(0);
	const frame = (0, import_react.useRef)(0);
	const done = (0, import_react.useRef)(false);
	(0, import_react.useEffect)(() => () => cancelAnimationFrame(frame.current), []);
	function stop() {
		cancelAnimationFrame(frame.current);
		if (!done.current) setProgress(0);
	}
	function start(event) {
		event.currentTarget.setPointerCapture(event.pointerId);
		done.current = false;
		const t0 = performance.now();
		const tick = (now) => {
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
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		className: "relative mt-5 inline-flex min-h-14 w-full items-center justify-center overflow-hidden rounded-full border border-accent px-6 text-base font-semibold text-fg sm:w-auto sm:min-w-72",
		onPointerDown: start,
		onPointerUp: stop,
		onPointerCancel: stop,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "absolute inset-0 origin-left bg-accent",
			style: { transform: `scaleX(${progress})` }
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "relative text-fg",
			children: "Segure para apagar"
		})]
	});
}
var SplitComponent = CartuchoApp;
//#endregion
export { SplitComponent as component };
