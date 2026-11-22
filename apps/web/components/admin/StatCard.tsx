export function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border border-charcoal-200 p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-charcoal-400 mb-2">{label}</p>
      <p className="text-2xl font-display">{value}</p>
    </div>
  );
}
