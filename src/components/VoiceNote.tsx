import { useEffect, useRef, useState } from "react";

function fmt(s: number) {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${r.toString().padStart(2, "0")}`;
}

const PlayIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
);
const PauseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z" /></svg>
);

export function VoicePlayer({ src }: { src: string | null }) {
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [cur, setCur] = useState(0);
  const [dur, setDur] = useState(0);

  const toggle = () => {
    const a = ref.current;
    if (!a) return;
    if (a.paused) void a.play();
    else a.pause();
  };

  return (
    <div className="flex items-center gap-2 min-w-52 py-1">
      <button
        type="button"
        onClick={toggle}
        disabled={!src}
        className="w-9 h-9 shrink-0 rounded-full bg-primary text-primary-foreground flex items-center justify-center press disabled:opacity-50"
        aria-label={playing ? "pause" : "play"}
      >
        {playing ? <PauseIcon /> : <PlayIcon />}
      </button>
      <input
        type="range"
        min={0}
        max={dur || 0}
        step={0.1}
        value={cur}
        onChange={(e) => {
          const a = ref.current;
          if (a) a.currentTime = Number(e.target.value);
        }}
        className="flex-1 accent-[var(--color-primary)]"
        aria-label="seek"
      />
      <span className="text-[11px] tabular-nums text-muted-foreground w-9 text-right">{fmt(playing || cur ? cur : dur)}</span>
      {src && (
        <audio
          ref={ref}
          src={src}
          preload="metadata"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => { setPlaying(false); setCur(0); }}
          onTimeUpdate={(e) => setCur(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => {
            const a = e.currentTarget;
            if (isFinite(a.duration)) setDur(a.duration);
            else {
              // webm files often report Infinity until seeked
              a.currentTime = 1e9;
              a.ontimeupdate = () => { a.ontimeupdate = null; setDur(a.duration); a.currentTime = 0; };
            }
          }}
          className="hidden"
        />
      )}
    </div>
  );
}

function pickMime() {
  if (typeof MediaRecorder === "undefined") return "";
  for (const t of ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"]) {
    if (MediaRecorder.isTypeSupported(t)) return t;
  }
  return "";
}

/** Mic button → recording bar → preview (play/pause, delete, send). */
export function VoiceRecorder({
  disabled,
  hi,
  onSend,
  onError,
}: {
  disabled?: boolean;
  hi: boolean;
  onSend: (file: File) => Promise<void>;
  onError: (msg: string) => void;
}) {
  const [state, setState] = useState<"idle" | "recording" | "preview">("idle");
  const [secs, setSecs] = useState(0);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const fileRef = useRef<File | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  };

  useEffect(() => () => { stopStream(); if (blobUrl) URL.revokeObjectURL(blobUrl); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const start = async () => {
    if (disabled) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = pickMime();
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunks.current = [];
      rec.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
      rec.onstop = () => {
        stopStream();
        const type = (rec.mimeType || "audio/webm").split(";")[0];
        const blob = new Blob(chunks.current, { type });
        if (blob.size < 500) { setState("idle"); return; }
        const ext = type.includes("mp4") ? "m4a" : type.includes("ogg") ? "ogg" : "webm";
        fileRef.current = new File([blob], `voice-${Date.now()}.${ext}`, { type });
        setBlobUrl(URL.createObjectURL(blob));
        setState("preview");
      };
      recRef.current = rec;
      rec.start();
      setSecs(0);
      setState("recording");
      timer.current = setInterval(() => setSecs((s) => {
        if (s + 1 >= 300) rec.state === "recording" && rec.stop();
        return s + 1;
      }), 1000);
    } catch {
      onError(hi ? "माइक्रोफ़ोन की अनुमति नहीं मिली" : "Microphone permission denied");
    }
  };

  const stop = () => recRef.current?.state === "recording" && recRef.current.stop();

  const discard = () => {
    if (recRef.current?.state === "recording") {
      recRef.current.onstop = () => stopStream();
      recRef.current.stop();
    }
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    setBlobUrl(null);
    fileRef.current = null;
    setState("idle");
  };

  const send = async () => {
    if (!fileRef.current) return;
    setSending(true);
    try {
      await onSend(fileRef.current);
      discard();
    } finally {
      setSending(false);
    }
  };

  const TrashBtn = (
    <button type="button" onClick={discard} className="p-2 text-destructive press" aria-label={hi ? "हटाएँ" : "delete"}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></svg>
    </button>
  );

  if (state === "idle") {
    return (
      <button
        type="button"
        onClick={() => void start()}
        disabled={disabled}
        className="w-11 h-11 rounded-full flex items-center justify-center bg-primary text-primary-foreground shadow press disabled:opacity-50"
        aria-label={hi ? "वॉइस मैसेज रिकॉर्ड करें" : "record voice message"}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 10a7 7 0 0 0 14 0M12 17v5" /></svg>
      </button>
    );
  }

  return (
    <div className="absolute inset-0 flex items-center gap-2 bg-card rounded-full px-2 shadow-sm border border-border anim-slide-up">
      {TrashBtn}
      {state === "recording" ? (
        <>
          <span className="w-2.5 h-2.5 rounded-full bg-destructive animate-pulse" />
          <span className="flex-1 text-sm tabular-nums">{fmt(secs)} <span className="text-muted-foreground text-xs">{hi ? "रिकॉर्डिंग…" : "Recording…"}</span></span>
          <button type="button" onClick={stop} className="w-9 h-9 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center press" aria-label="stop">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="5" width="14" height="14" rx="2" /></svg>
          </button>
        </>
      ) : (
        <>
          <div className="flex-1 min-w-0"><VoicePlayer src={blobUrl} /></div>
          <button type="button" onClick={() => void send()} disabled={sending} className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center press disabled:opacity-50" aria-label="send">
            {sending ? <span className="block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M2 21l21-9L2 3v7l15 2-15 2v7Z" /></svg>}
          </button>
        </>
      )}
    </div>
  );
}
