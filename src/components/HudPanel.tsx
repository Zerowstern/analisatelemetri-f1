import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Info } from "lucide-react";

type Props = {
  id?: string;
  title: string;
  subtitle?: string;
  hint?: ReactNode;          // short "how to read this" tip
  badge?: ReactNode;
  className?: string;
  children: ReactNode;
  accent?: "red" | "cyan" | "amber" | "green";
};

const accentMap = {
  red:   "text-hud-red",
  cyan:  "text-hud-cyan",
  amber: "text-hud-amber",
  green: "text-hud-green",
};

export const HudPanel = ({ id, title, subtitle, hint, badge, className, children, accent = "red" }: Props) => (
  <section id={id} className={cn("hud-panel hud-corner section-anchor", className)}>
    <header className="flex items-center justify-between gap-3 px-5 py-3 border-b border-border/70">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className={cn("led animate-pulse-led shrink-0", accentMap[accent])} />
        <h2 className="display text-[13px] tracking-[0.16em] uppercase text-foreground/95 truncate">
          {title}
        </h2>
        {subtitle && (
          <span className="hidden sm:inline text-[11px] mono text-muted-foreground tracking-wide truncate">
            · {subtitle}
          </span>
        )}
      </div>
      {badge && <div className="text-[10px] mono text-muted-foreground tracking-widest shrink-0">{badge}</div>}
    </header>

    {hint && (
      <div className="flex items-start gap-2 px-5 py-2.5 border-b border-border/50 bg-secondary/30">
        <Info className="w-3.5 h-3.5 mt-0.5 text-hud-cyan shrink-0" />
        <p className="text-[11.5px] leading-relaxed text-muted-foreground">{hint}</p>
      </div>
    )}

    <div className="p-5">{children}</div>
  </section>
);
