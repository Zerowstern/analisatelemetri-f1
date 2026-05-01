type Item = { color: string; label: string; note?: string };

export const Legend = ({ items }: { items: Item[] }) => (
  <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground">
    {items.map((it, i) => (
      <span key={i} className="inline-flex items-center gap-1.5">
        <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: it.color }} />
        <span className="text-foreground/80">{it.label}</span>
        {it.note && <span className="opacity-70">— {it.note}</span>}
      </span>
    ))}
  </div>
);
