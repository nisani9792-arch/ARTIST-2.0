export function WorkspaceLoadingSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 gap-4 animate-pulse">
      {[0, 1].map((col) => (
        <div
          key={col}
          className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-4"
        >
          <div className="flex items-center gap-2 border-b border-slate-200/80 pb-3">
            <div className="size-2 rounded-full bg-slate-300" />
            <div className="h-4 w-24 rounded-full bg-slate-300" />
            <div className="h-5 w-8 rounded-full bg-slate-200" />
          </div>
          <div className="flex flex-col gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-2.5 rounded-2xl border border-slate-100 bg-white p-3"
              >
                <div className="size-10 shrink-0 rounded-full bg-slate-200" />
                <div className="flex flex-1 flex-col gap-1.5">
                  <div className="h-3.5 w-3/4 rounded-full bg-slate-200" />
                  <div className="h-2.5 w-1/2 rounded-full bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
