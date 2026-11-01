const groups = [
  { title: "Surfaces", tokens: ["bg", "surface", "surface-2", "line", "line-strong"] },
  { title: "Text", tokens: ["fg", "muted"] },
  { title: "Brand", tokens: ["accent", "accent-2", "glow"] },
  { title: "Status", tokens: ["success", "warning", "danger"] },
];

/** Live swatches: they read the CSS variables, so they follow the theme toolbar. */
export function Swatches() {
  return (
    <div className="not-prose space-y-6">
      {groups.map((g) => (
        <section key={g.title}>
          <h3 className="mb-2 text-sm font-semibold text-fg">{g.title}</h3>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {g.tokens.map((t) => (
              <li key={t} className="overflow-hidden rounded-xl border border-line bg-surface">
                <div className="h-14 border-b border-line" style={{ background: `var(--${t})` }} />
                <div className="px-3 py-2">
                  <code className="font-mono text-xs text-fg">--{t}</code>
                  <p className="text-xs text-muted">{`bg-${t} / text-${t}`}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
