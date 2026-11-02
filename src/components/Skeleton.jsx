export const Skeleton = ({ className = '' }) => <div className={`skeleton ${className}`} aria-hidden="true" />;

export function SkeletonIdeaCard({ i = 0 }) {
  return (
    <div className="card enter space-y-3 p-4" style={{ '--i': i }} aria-hidden="true">
      <Skeleton className="h-3 w-24" /><Skeleton className="h-5 w-full" /><Skeleton className="h-5 w-4/5" />
      <div className="space-y-2 pt-1"><Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-11/12" /><Skeleton className="h-3 w-2/3" /></div>
      <div className="flex gap-2 pt-1"><Skeleton className="h-8 w-24" /><Skeleton className="h-8 w-24" /></div>
    </div>
  );
}

/** Shown briefly while a view's data is (re)computed. Shapes roughly mirror the real layouts. */
export function ViewSkeleton({ view }) {
  const box = (n, cls) => Array.from({ length: n }, (_, k) => <Skeleton key={k} className={cls} />);
  return (
    <div role="status" aria-label="Loading view" className="space-y-4">
      {view === 'calendar' ? (
        <div className="card p-4"><Skeleton className="mb-4 h-8 w-64" /><div className="grid grid-cols-7 gap-2">{box(35, 'h-20')}</div></div>
      ) : view === 'queue' ? (
        <div className="grid gap-4 lg:grid-cols-3">{[0, 1, 2].map((c) => <div key={c} className="card space-y-3 p-3"><Skeleton className="h-6 w-32" />{box(3, 'h-24')}</div>)}</div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{box(4, 'h-28')}</div>
          <div className="card space-y-2 p-4">{box(6, 'h-10')}</div>
        </>
      )}
    </div>
  );
}
