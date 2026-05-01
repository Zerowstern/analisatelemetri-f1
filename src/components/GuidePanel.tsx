import { Gauge, Activity, Timer, Flag } from "lucide-react";

const STEPS = [
  {
    icon: Flag,
    title: "Pilih pembalap",
    desc: "Klik chip di kanan atas untuk overlay maksimal 4 pembalap pada semua grafik.",
  },
  {
    icon: Timer,
    title: "Bandingkan sektor",
    desc: "Tabel di bagian Lap & Sektor menunjukkan tikungan mana yang menang/kalah.",
  },
  {
    icon: Activity,
    title: "Baca telemetri",
    desc: "Speed, throttle, brake, steering — garis tegak amber menandai tikungan.",
  },
  {
    icon: Gauge,
    title: "Ekspor data",
    desc: "Buka panel Data Mentah dan unduh CSV per pembalap untuk analisis sendiri.",
  },
];

export const GuidePanel = () => (
  <section className="hud-panel hud-corner section-anchor" id="guide">
    <header className="px-5 py-3 border-b border-border/70 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="led animate-pulse-led text-hud-amber" />
        <h2 className="display text-[13px] tracking-[0.16em] uppercase">Panduan Singkat</h2>
      </div>
      <span className="text-[10px] mono text-muted-foreground tracking-widest">4 LANGKAH</span>
    </header>
    <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border/60">
      {STEPS.map((s, i) => {
        const Icon = s.icon;
        return (
          <li key={i} className="p-5 flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <span className="step-num">{i + 1}</span>
              <Icon className="w-4 h-4 text-hud-amber" />
              <h3 className="text-sm font-semibold tracking-wide">{s.title}</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
          </li>
        );
      })}
    </ol>
  </section>
);
