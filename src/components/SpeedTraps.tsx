import { DriverLap, CORNERS_INFO } from "@/lib/telemetry-extra";
import { driverColorVar } from "./DriverChips";
import { cn } from "@/lib/utils";

type Props = { laps: import("@/lib/telemetry").DriverLap[]; selected: string[] };

// Speed snapshot table: top speed per driver + min speed at each major corner
export const SpeedTraps = ({ laps, selected }: Props) => {
  const visible = laps.filter(l => selected.includes(l.driver.id));
  if (!visible.length) return null;

  const cornerStats = CORNERS_INFO.map(c => {
    const perDriver = visible.map(l => {
      // find min speed within +/- 80m around center
      const window = l.telemetry.filter(p => Math.abs(p.distance - c.center_m) < 80);
      const minS = Math.min(...window.map(p => p.speed));
      return { id: l.driver.id, code: l.driver.code, minS };
    });
    const fastest = Math.max(...perDriver.map(d => d.minS));
    return { ...c, perDriver, fastest };
  });

  const topSpeedFastest = Math.max(...visible.map(l => l.topSpeed));

  return (
    <div className="space-y-4">
      <div>
        <div className="text-[10px] tracking-widest text-muted-foreground mb-2">▌ TOP SPEED · SPEED TRAP</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {visible.map(l => (
            <div key={l.driver.id} className="border border-border bg-secondary/30 p-2">
              <div className="flex items-center gap-2 text-[10px] tracking-widest text-muted-foreground">
                <span className="w-1 h-3" style={{ background: driverColorVar(l.driver.id) }} />
                {l.driver.code}
              </div>
              <div className={cn(
                "display text-2xl tabular-nums mt-1",
                l.topSpeed === topSpeedFastest ? "text-hud-magenta" : "text-foreground"
              )}>
                {l.topSpeed.toFixed(0)}
                <span className="text-xs text-muted-foreground ml-1">km/h</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="text-[10px] tracking-widest text-muted-foreground mb-2">▌ MID-CORNER MIN SPEED</div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="text-[10px] tracking-widest text-muted-foreground uppercase">
                <th className="text-left py-1.5 pr-2">Corner</th>
                {visible.map(l => (
                  <th key={l.driver.id} className="text-right py-1.5 px-2">{l.driver.code}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cornerStats.map(c => (
                <tr key={c.name} className="border-t border-border/50">
                  <td className="py-1.5 pr-2">
                    <span className="text-hud-amber mr-2">T{c.turn}</span>
                    <span className="text-muted-foreground">{c.name}</span>
                  </td>
                  {c.perDriver.map(d => (
                    <td key={d.id} className={cn(
                      "text-right py-1.5 px-2 tabular-nums",
                      Math.abs(d.minS - c.fastest) < 0.5 ? "text-hud-green font-bold" : "text-foreground/80"
                    )}>
                      {d.minS.toFixed(0)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 tracking-wider">
          <span className="text-hud-green">■</span> highest mid-corner speed = best apex carry
        </p>
      </div>
    </div>
  );
};
