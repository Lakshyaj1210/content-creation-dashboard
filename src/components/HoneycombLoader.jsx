export default function HoneycombLoader({ label = "Synthesizing AI Ideas..." }) {
  return (
    <div className="flex flex-col items-center justify-center p-10 space-y-6">
      <div className="honeycomb">
        <div /><div /><div /><div /><div /><div /><div />
      </div>
      <p className="text-xs uppercase tracking-widest font-mono animate-pulse" style={{ color: '#10b981' }}>
        {label}
      </p>
    </div>
  );
}

