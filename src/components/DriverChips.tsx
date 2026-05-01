import { DRIVERS, Driver } from "@/lib/telemetry";
import { cn } from "@/lib/utils";

type Props = {
  selected: string[];
  onToggle: (id: string) => void;
};

const colorClass: Record<string, string> = {
  VER: "border-driver-3 text-driver-3",
  LEC: "border-driver-1 text-driver-1",
  HAM: "border-driver-2 text-driver-2",
  NOR: "border-driver-4 text-driver-4",
};
const bgClass: Record<string, string> = {
  VER: "bg-driver-3",
  LEC: "bg-driver-1",
  HAM: "bg-driver-2",
  NOR: "bg-driver-4",
};

export const DriverChips = ({ selected, onToggle }: Props) => (
  <div className="flex flex-wrap gap-2">
    {DRIVERS.map((d: Driver) => {
      const active = selected.includes(d.id);
      return (
        <button
          key={d.id}
          onClick={() => onToggle(d.id)}
          className={cn(
            "group flex items-center gap-2 pl-2 pr-3 py-1.5 border rounded-md transition-all",
            "hover:bg-secondary/60",
            active ? cn("bg-secondary/80", colorClass[d.id]) : "border-border text-muted-foreground"
          )}
        >
          <span className={cn("w-1 h-4 rounded-full", active ? bgClass[d.id] : "bg-muted")} />
          <span className="display text-[10px] tracking-widest opacity-70">#{d.number}</span>
          <span className="text-xs font-bold">{d.code}</span>
          <span className="text-[10px] opacity-60 hidden sm:inline">{d.team}</span>
        </button>
      );
    })}
  </div>
);

export const driverColorVar = (id: string) =>
  ({ VER: "hsl(var(--driver-3))", LEC: "hsl(var(--driver-1))", HAM: "hsl(var(--driver-2))", NOR: "hsl(var(--driver-4))" }[id]!);
