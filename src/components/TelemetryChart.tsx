import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from "recharts";
import { DriverLap, CIRCUIT } from "@/lib/telemetry";
import { driverColorVar } from "./DriverChips";

type Channel = "speed" | "throttle" | "brake" | "steering" | "gear" | "rpm";

type Props = {
  laps: DriverLap[];
  selected: string[];
  channel: Channel;
  height?: number;
};

const channelMeta: Record<Channel, { label: string; unit: string; domain?: [number, number] }> = {
  speed:    { label: "SPEED",    unit: "km/h",   domain: [0, 360] },
  throttle: { label: "THROTTLE", unit: "%",      domain: [0, 100] },
  brake:    { label: "BRAKE",    unit: "%",      domain: [0, 100] },
  steering: { label: "STEERING", unit: "°",      domain: [-100, 100] },
  gear:     { label: "GEAR",     unit: "",       domain: [1, 8] },
  rpm:      { label: "RPM",      unit: "",       domain: [8000, 13500] },
};

export const TelemetryChart = ({ laps, selected, channel, height = 180 }: Props) => {
  const visible = laps.filter(l => selected.includes(l.driver.id));
  if (!visible.length) return <p className="text-xs text-muted-foreground">No driver selected.</p>;

  // Build merged data by distance index
  const data = visible[0].telemetry.map((p, i) => {
    const row: Record<string, number> = { distance: +(p.distance / 1000).toFixed(3) };
    visible.forEach(l => {
      row[l.driver.id] = l.telemetry[i]?.[channel] ?? 0;
    });
    return row;
  });

  const meta = channelMeta[channel];
  const cornerMarkers = [0.65, 1.20, 1.85, 2.55, 2.95, 4.10, 5.30];

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 12, left: -8, bottom: 4 }}>
          <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="2 4" vertical={false} />
          <XAxis
            dataKey="distance"
            type="number"
            domain={[0, CIRCUIT.length_km]}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10, fontFamily: "JetBrains Mono" }}
            tickFormatter={v => `${v.toFixed(1)}km`}
            stroke="hsl(var(--border))"
          />
          <YAxis
            domain={meta.domain}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10, fontFamily: "JetBrains Mono" }}
            stroke="hsl(var(--border))"
            width={42}
          />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--hud-red))",
              borderRadius: 2,
              fontFamily: "JetBrains Mono",
              fontSize: 11,
            }}
            labelFormatter={(v) => `↓ ${(+v).toFixed(2)} km`}
            formatter={(val: number, name: string) => [`${val.toFixed(1)} ${meta.unit}`, name]}
          />
          {cornerMarkers.map((d, i) => (
            <ReferenceLine key={i} x={d} stroke="hsl(var(--hud-amber) / 0.25)" strokeDasharray="2 2" />
          ))}
          {visible.map(l => (
            <Line
              key={l.driver.id}
              type="monotone"
              dataKey={l.driver.id}
              stroke={driverColorVar(l.driver.id)}
              strokeWidth={1.6}
              dot={false}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      <div className="flex items-center justify-between mt-1">
        <span className="text-[10px] tracking-widest text-muted-foreground">{meta.label} · {meta.unit}</span>
        <span className="text-[10px] tracking-widest text-hud-amber/70">▲ corner markers</span>
      </div>
    </div>
  );
};
