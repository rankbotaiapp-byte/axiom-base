/** Renders the content engine's markdown-lite safely (no HTML injection). */
export function RichText({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return (
    <div className="space-y-5 text-[17px] leading-[1.75] text-white/80">
      {blocks.map((b, i) => {
        if (b.startsWith("## ")) return <h2 key={i} className="display pt-4 text-2xl text-white">{b.slice(3)}</h2>;
        const lines = b.split("\n");
        if (lines.every((l) => l.startsWith("- "))) {
          return (
            <ul key={i} className="list-disc space-y-1.5 pl-6">
              {lines.map((l, j) => <li key={j}>{l.slice(2)}</li>)}
            </ul>
          );
        }
        return <p key={i}>{b}</p>;
      })}
    </div>
  );
}
