interface Props {
  name: string;
  hue: number;
  size?: number;
  online?: boolean;
  src?: string | null;
}

export function Avatar({ name, hue, size = 48, online, src }: Props) {
  const initials = name
    .replace(/[^\p{L}\p{N} ]/gu, "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase() || "•";

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      {src ? (
        <img
          src={src}
          alt={name}
          className="rounded-full object-cover"
          style={{ width: size, height: size }}
        />
      ) : (
        <div
          className="rounded-full flex items-center justify-center font-semibold text-white select-none"
          style={{
            width: size,
            height: size,
            background: `linear-gradient(135deg, hsl(${hue} 65% 55%), hsl(${(hue + 35) % 360} 70% 42%))`,
            fontSize: size * 0.38,
          }}
        >
          {initials}
        </div>
      )}
      {online && (
        <span
          className="absolute bottom-0 right-0 rounded-full ring-2 ring-card"
          style={{
            width: size * 0.28,
            height: size * 0.28,
            background: "var(--color-unread)",
          }}
        />
      )}
    </div>
  );
}
