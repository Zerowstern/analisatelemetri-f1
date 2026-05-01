import { DriverLap, SECTORS, fmtDelta, fmtLap } from "@/lib/telemetry";
import { driverColorVar } from "./DriverChips";
import { cn } from "@/lib/utils";

type Props = { laps: DriverLap[]; selected: string[] };

export const SectorTable = ({ laps, selected }: Props) => {
  const visible = laps.filter(l => selected.includes(l.driver.id));
  if (visible.length === 0) return <p className="text-xs text-muted-foreground">No driver selected.</p>;

  // Find purple (fastest) per sector
  const purple = SECTORS.map((_, i) => Math.min(...visible.map(l => l.sectorTimes[i])));
  const fastestLap = Math.min(...visible.map(l => l.lapTime));

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="text-[10px] tracking-widest text-muted-foreground uppercase">
            <th className="text-left py-2 pr-3 sticky left-0 bg-card">Driver</th>
            {SECTORS.map(s => (
              <th key={s.id} className="text-right py-2 px-2 whitespace-nowrap" title={s.name}>
                <div className={cn(s.type === "corner" ? "text-hud-amber" : "text-hud-cyan")}>
                  {s.type === "corner" ? `T${s.cornerNum}` : `S${s.id}`}
                </div>
              </th>
            ))}
            <th className="text-right py-2 pl-3">Lap</th>
            <th className="text-right py-2 pl-3">Δ</th>
          </tr>
        </thead>
        <tbody>
          {visible.map(l => (
            <tr key={l.driver.id} className="border-t border-border/60 hover:bg-secondary/30">
              <td className="py-2 pr-3 sticky left-0 bg-card">
                <div className="flex items-center gap-2">
                  <span className="w-1 h-4" style={{ background: driverColorVar(l.driver.id) }} />
                  <span className="font-bold">{l.driver.code}</span>
                </div>
              </td>
              {l.sectorTimes.map((t, i) => {
                const isPurple = Math.abs(t - purple[i]) < 0.001;
                return (
                  <td key={i} className={cn(
                    "text-right py-2 px-2 tabular-nums",
                    isPurple ? "text-hud-magenta font-bold" : "text-foreground/80"
                  )}>
                    {t.toFixed(3)}
                  </td>
                );
              })}
              <td className={cn("text-right py-2 pl-3 tabular-nums font-bold",
                Math.abs(l.lapTime - fastestLap) < 0.001 ? "text-hud-magenta" : "text-foreground"
              )}>
                {fmtLap(l.lapTime)}
              </td>
              <td className={cn("text-right py-2 pl-3 tabular-nums text-[11px]",
                l.lapTime - fastestLap < 0.001 ? "text-hud-magenta" :
                l.lapTime - fastestLap < 0.3 ? "text-hud-green" : "text-hud-amber"
              )}>
                {l.lapTime === fastestLap ? "—" : fmtDelta(l.lapTime - fastestLap)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-[10px] text-muted-foreground mt-3 tracking-wider">
        <span className="text-hud-magenta">■</span> PURPLE = fastest in sector / lap
      </p>
    </div>
  );
};
