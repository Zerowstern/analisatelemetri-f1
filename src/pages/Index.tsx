import { useMemo, useState } from "react";
import { CIRCUIT, generateSession, fmtLap } from "@/lib/telemetry";
import { HudPanel } from "@/components/HudPanel";
import { DriverChips } from "@/components/DriverChips";
import { SectorTable } from "@/components/SectorTable";
import { TelemetryChart } from "@/components/TelemetryChart";
import { SpeedTraps } from "@/components/SpeedTraps";
import { RawDataTable } from "@/components/RawDataTable";
import { SectionNav } from "@/components/SectionNav";
import { GuidePanel } from "@/components/GuidePanel";
import { Legend } from "@/components/Legend";

const Index = () => {
  const session = useMemo(() => generateSession(), []);
  const [selected, setSelected] = useState<string[]>(["VER", "LEC", "HAM", "NOR"]);

  const toggle = (id: string) =>
    setSelected(s => (s.includes(id) ? s.filter(x => x !== id) : [...s, id]));

  const fastest = [...session].sort((a, b) => a.lapTime - b.lapTime)[0];
  const topSpeed = Math.max(...session.map(s => s.topSpeed));

  return (
    <div className="min-h-screen text-foreground">
      {/* Top bar */}
      <header className="border-b border-border/70 bg-background/85 backdrop-blur-md sticky top-0 z-30">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <a href="#overview" className="flex items-center gap-3 shrink-0">
            <div className="display text-lg font-bold tracking-widest">
              <span className="text-hud-red">APEX</span>
              <span className="text-foreground/40 mx-0.5">/</span>
              <span className="text-foreground">TELEMETRY</span>
            </div>
            <span className="hidden lg:inline text-[10px] mono tracking-[0.25em] text-muted-foreground border-l border-border pl-3">
              F1 DATA ANALYSIS · v2.4
            </span>
          </a>
          <SectionNav />
          <div className="flex items-center gap-2 text-[10px] mono tracking-widest text-muted-foreground shrink-0">
            <span className="led text-hud-green animate-pulse-led" />
            <span className="hidden sm:inline">SESSION READY</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6 max-w-7xl">

        {/* HERO / OVERVIEW */}
        <section id="overview" className="section-anchor space-y-6">
          <div className="flex flex-col gap-3">
            <span className="text-[10px] mono tracking-[0.3em] text-hud-red uppercase">
              ▌ Race telemetry analysis
            </span>
            <h1 className="display text-3xl md:text-5xl font-bold leading-tight max-w-3xl">
              Bedah performa pembalap F1 <span className="text-hud-red">turn by turn</span>.
            </h1>
            <p className="text-sm md:text-base text-muted-foreground max-w-2xl leading-relaxed">
              Bandingkan waktu sektor, jejak throttle &amp; rem, sudut setir, dan kecepatan puncak
              antar pembalap dalam satu lap. Semua data tersedia mentah, siap diunduh sebagai CSV.
            </p>
          </div>

          {/* Stat strip */}
          <div className="hud-panel hud-corner p-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              <Stat label="Circuit"     value={CIRCUIT.name.replace("Autodromo Nazionale ", "")} sub={`${CIRCUIT.country} · ${CIRCUIT.length_km} km`} />
              <Stat label="Session"     value="QUALIFYING" sub="Q3 · Hot Lap" />
              <Stat label="Pole Lap"    value={fmtLap(fastest.lapTime)} sub={`${fastest.driver.code} · ${fastest.driver.team}`} accent />
              <Stat label="Top Speed"   value={`${topSpeed.toFixed(0)} km/h`} sub="DRS open · main straight" />
            </div>
          </div>
        </section>

        {/* GUIDE */}
        <GuidePanel />

        {/* DRIVER PICKER (sticky-ish helper bar) */}
        <section className="hud-panel p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-[10px] mono tracking-[0.25em] text-muted-foreground uppercase">
              ▌ Step 1 — Pilih pembalap
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Klik untuk menambah/menghapus dari semua grafik di bawah.
            </p>
          </div>
          <DriverChips selected={selected} onToggle={toggle} />
        </section>

        {/* SECTORS */}
        <HudPanel
          id="sectors"
          title="Lap Time & Sektor"
          subtitle="perbandingan per turn / straight"
          accent="red"
          badge={`${selected.length} drivers`}
          hint={
            <>
              Setiap kolom = satu sektor sirkuit. Angka <span className="text-hud-magenta font-semibold">ungu</span> berarti
              <strong> tercepat di sektor itu</strong>. Kolom <strong>Δ</strong> menunjukkan selisih dari pole lap.
            </>
          }
        >
          <SectorTable laps={session} selected={selected} />
        </HudPanel>

        {/* CHANNELS */}
        <section id="channels" className="section-anchor space-y-4">
          <div className="flex items-end justify-between flex-wrap gap-2">
            <div>
              <h2 className="display text-xl">Telemetri Pembalap</h2>
              <p className="text-xs text-muted-foreground mt-1 max-w-xl">
                Sumbu X = jarak dari garis start (km). Garis vertikal amber = pusat tikungan utama.
                Hover grafik untuk melihat nilai tepat di titik tersebut.
              </p>
            </div>
            <Legend items={selected.map(id => {
              const d = session.find(s => s.driver.id === id)!.driver;
              return { color: cssVar(`--driver-${({VER:3,LEC:1,HAM:2,NOR:4} as Record<string,number>)[id]}`), label: d.code, note: d.team };
            })} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <HudPanel
              title="Speed Trace"
              subtitle="km/h vs jarak"
              accent="cyan"
              hint="Lihat siapa yang lebih cepat di lurus dan siapa yang membawa kecepatan lebih tinggi melewati apex (titik terendah grafik)."
            >
              <TelemetryChart laps={session} selected={selected} channel="speed" height={220} />
            </HudPanel>

            <HudPanel
              title="Throttle Input"
              subtitle="0–100%"
              accent="green"
              hint="Pembalap yang lebih dulu kembali ke 100% gas saat keluar tikungan biasanya lebih cepat di lurus berikutnya."
            >
              <TelemetryChart laps={session} selected={selected} channel="throttle" height={220} />
            </HudPanel>

            <HudPanel
              title="Brake Pressure"
              subtitle="0–100%"
              accent="red"
              hint="Brake yang naik lebih lambat (later braking) berarti pembalap menunda pengereman — biasanya menghemat waktu jika apex tetap terjaga."
            >
              <TelemetryChart laps={session} selected={selected} channel="brake" height={220} />
            </HudPanel>

            <HudPanel
              title="Steering Angle"
              subtitle="kiri ◀  ▶ kanan"
              accent="amber"
              hint="Nilai ekstrim = mobil banyak menikung. Garis lebih halus menandakan racing line lebih bersih."
            >
              <TelemetryChart laps={session} selected={selected} channel="steering" height={220} />
            </HudPanel>

            <HudPanel title="Gear" subtitle="1 → 8" accent="cyan">
              <TelemetryChart laps={session} selected={selected} channel="gear" height={160} />
            </HudPanel>

            <HudPanel title="Engine RPM" subtitle="putaran mesin" accent="amber">
              <TelemetryChart laps={session} selected={selected} channel="rpm" height={160} />
            </HudPanel>
          </div>
        </section>

        {/* SPEED TRAPS */}
        <HudPanel
          id="speed"
          title="Speed Trap & Cornering Speed"
          subtitle="puncak vs minimum"
          accent="amber"
          hint={
            <>
              <strong>Top Speed</strong> diukur di trap lurus utama. <strong>Mid-corner speed</strong> adalah
              kecepatan minimum di pusat tikungan — semakin tinggi, semakin baik mobil/pembalap menjaga momentum.
            </>
          }
        >
          <SpeedTraps laps={session} selected={selected} />
        </HudPanel>

        {/* RAW */}
        <HudPanel
          id="raw"
          title="Data Telemetri Mentah"
          subtitle="sample setiap 10 m · siap diunduh"
          accent="green"
          hint="Pilih pembalap, gunakan ◀ ▶ untuk menelusuri baris, atau klik ⬇ CSV untuk mengunduh seluruh lap (~580 baris) dan menganalisanya di Excel / Python."
        >
          <RawDataTable laps={session} selected={selected} />
        </HudPanel>

        <footer className="text-center text-[10px] mono tracking-[0.3em] text-muted-foreground py-8 border-t border-border/50 mt-10">
          APEX/TELEMETRY · DATA SIMULASI
        </footer>
      </main>
    </div>
  );
};

const Stat = ({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) => (
  <div className="min-w-0">
    <div className="text-[10px] mono tracking-[0.25em] text-muted-foreground uppercase">▌ {label}</div>
    <div className={`display text-xl md:text-2xl mt-1.5 tabular-nums truncate ${accent ? "text-hud-red" : "text-foreground"}`}>
      {value}
    </div>
    {sub && <div className="text-[11px] text-muted-foreground mt-1 truncate">{sub}</div>}
  </div>
);

const cssVar = (v: string) => `hsl(var(${v}))`;

export default Index;
