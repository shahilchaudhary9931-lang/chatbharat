import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function SettingsHeader({ title, back = "/profile", right }: { title: string; back?: string; right?: ReactNode }) {
  return (
    <header
      className="px-3 py-3 flex items-center gap-3 sticky top-0 z-20"
      style={{ background: "var(--color-header)", color: "var(--color-header-foreground)" }}
    >
      <Link to={back} className="p-1.5 -ml-1 rounded-full hover:bg-white/10 press">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
      </Link>
      <div className="font-semibold text-lg flex-1 truncate">{title}</div>
      {right}
    </header>
  );
}

export function SettingsRow({
  icon, title, subtitle, right, onClick, danger,
}: {
  icon?: ReactNode; title: ReactNode; subtitle?: ReactNode; right?: ReactNode;
  onClick?: () => void; danger?: boolean;
}) {
  const Comp: any = onClick ? "button" : "div";
  return (
    <Comp
      onClick={onClick}
      className={`w-full text-left flex items-center gap-4 py-3.5 px-4 border-b border-border/60 hover-lift press ${danger ? "text-destructive" : ""}`}
    >
      {icon && <span className="w-9 h-9 rounded-full flex items-center justify-center bg-muted text-base shrink-0">{icon}</span>}
      <div className="flex-1 min-w-0">
        <div className="text-[15px] font-medium truncate">{title}</div>
        {subtitle && <div className="text-xs text-muted-foreground mt-0.5 truncate">{subtitle}</div>}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </Comp>
  );
}

export function Section({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="mt-2">
      {title && <div className="px-4 pt-4 pb-1 text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">{title}</div>}
      <div className="bg-card">{children}</div>
    </section>
  );
}

export function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onChange(!checked); }}
      className="relative w-12 h-6 rounded-full transition-colors press"
      style={{ background: checked ? "var(--color-primary)" : "var(--color-border)" }}
      role="switch"
      aria-checked={checked}
    >
      <span
        className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
        style={{ transform: checked ? "translateX(24px)" : "translateX(0)" }}
      />
    </button>
  );
}

export function Pill({ active, children, onClick }: { active: boolean; children: ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors press ${active ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}
    >
      {children}
    </button>
  );
}
