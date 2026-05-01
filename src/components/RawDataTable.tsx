import { useMemo, useState } from "react";
import { DriverLap } from "@/lib/telemetry";

type Props = { laps: DriverLap[]; selected: string[] };

const COLS: { key: keyof import("@/lib/telemetry").TelemetryPoint; label: string }[] = [
  { key: "distance", label: "dist_m" },
  { key: "time",     label: "t_s" },
  { key: "speed",    label: "speed_kmh" },
  { key: "throttle", label: "throttle_%" },
  { key: "brake",    label: "brake_%" },
  { key: "gear",     label: "gear" },
  { key: "rpm",      label: "rpm" },
  { key: "steering", label: "steer_°" },
  { key: "drs",      label: "drs" },
];

export const RawDataTable = ({ laps, selected }: Props) => {
  const visibleLaps = laps.filter(l => selected.includes(l.driver.id));
  const [driverId, setDriverId] = useState(visibleLaps[0]?.driver.id ?? "");
  const [page, setPage] = useState(0);
  const PAGE = 25;

  const lap = visibleLaps.find(l => l.driver.id === driverId) ?? visibleLaps[0];

  const slice = useMemo(() => {
    if (!lap) return [];
    return lap.telemetry.slice(page * PAGE, page * PAGE + PAGE);
  }, [lap, page]);

  if (!lap) return <p className="text-xs text-muted-foreground">No data.</p>;

  const totalPages = Math.ceil(lap.telemetry.length / PAGE);

  const downloadCsv = () => {
    const header = ["driver", ...COLS.map(c => c.label)].join(",");
    const rows = lap.telemetry.map(p =>
      [lap.driver.code, ...COLS.map(c => p[c.key])].join(",")
    );
    const blob = new Blob([header + "\n" + rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `telemetry_${lap.driver.code}_monza.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex flex-wrap gap-1">
          {visibleLaps.map(l => (
            <button
              key={l.driver.id}
              onClick={() => { setDriverId(l.driver.id); setPage(0); }}
              className={`px-2 py-1 text-[10px] tracking-widest border rounded-sm ${
                l.driver.id === driverId
                  ? "border-hud-red text-hud-red bg-secondary"
                  : "border-border text-muted-foreground hover:bg-secondary/40"
              }`}
            >
              {l.driver.code}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground tracking-widest">
            ROW {page * PAGE + 1}–{Math.min((page + 1) * PAGE, lap.telemetry.length)} / {lap.telemetry.length}
          </span>
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            className="px-2 py-1 text-[10px] border border-border hover:bg-secondary/40">◀</button>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            className="px-2 py-1 text-[10px] border border-border hover:bg-secondary/40">▶</button>
          <button
            onClick={downloadCsv}
            className="px-3 py-1 text-[10px] tracking-widest border border-hud-amber text-hud-amber hover:bg-hud-amber/10">
            ⬇ CSV
          </button>
        </div>
      </div>

      <div className="overflow-x-auto border border-border max-h-[420px] overflow-y-auto">
        <table className="w-full text-[11px] tabular-nums">
          <thead className="bg-secondary/60 sticky top-0">
            <tr className="text-[10px] tracking-widest text-muted-foreground">
              {COLS.map(c => (
                <th key={c.key} className="text-right py-1.5 px-2 font-normal">{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.map((p, i) => (
              <tr key={i} className="border-t border-border/40 hover:bg-secondary/30">
                {COLS.map(c => (
                  <td key={c.key} className="text-right py-1 px-2">
                    {typeof p[c.key] === "number" ? (p[c.key] as number).toString() : String(p[c.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
