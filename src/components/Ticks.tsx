import type { MsgStatus } from "@/lib/mock-data";

export function Ticks({ status }: { status?: MsgStatus }) {
  if (!status) return null;
  const color = status === "seen" ? "var(--color-tick-seen)" : "var(--color-tick)";
  if (status === "sent") {
    return (
      <svg width="16" height="11" viewBox="0 0 16 11" fill="none" aria-label="sent">
        <path d="M1 5.5L5 9.5L11 1.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg width="18" height="11" viewBox="0 0 18 11" fill="none" aria-label={status}>
      <path d="M1 5.5L5 9.5L11 1.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 5.5L10 9.5L16 1.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
