import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { id: "overview",  label: "Overview" },
  { id: "sectors",   label: "Lap & Sektor" },
  { id: "channels",  label: "Telemetri" },
  { id: "speed",     label: "Speed Trap" },
  { id: "raw",       label: "Data Mentah" },
];

export const SectionNav = () => {
  const [active, setActive] = useState("overview");

  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
    );
    ITEMS.forEach(i => {
      const el = document.getElementById(i.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  return (
    <nav className="hidden md:flex items-center gap-1 text-[11px] mono">
      {ITEMS.map(i => (
        <a
          key={i.id}
          href={`#${i.id}`}
          className={cn(
            "px-3 py-1.5 rounded-md tracking-widest uppercase transition-colors",
            active === i.id
              ? "bg-secondary text-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
          )}
        >
          {i.label}
        </a>
      ))}
    </nav>
  );
};
