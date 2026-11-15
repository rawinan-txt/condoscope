/** The big number. Only its final value is read out (the animated digits are hidden from screen readers, which would otherwise announce every step). */
export default function Counter({ value, total, label }: { value: number; total: number; label: string }) {
  return (
    <p>
      <span data-testid="story-count" aria-hidden="true" className="font-serif text-7xl tabular-nums text-champagne-soft md:text-9xl">{value}</span>
      <span className="sr-only">{label} {total} ห้อง</span>
    </p>
  );
}
