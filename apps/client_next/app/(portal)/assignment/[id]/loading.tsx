export default function AssignmentLoading() {
  return (
    <div className="h-screen bg-white flex overflow-hidden">
      <div className="w-64 bg-white border-r border-slate-200 p-4 animate-pulse">
        <div className="h-8 w-full bg-slate-200 rounded mb-4" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-8 w-full bg-slate-200 rounded" />
          ))}
        </div>
      </div>
      <div className="flex-1 p-8 animate-pulse">
        <div className="h-10 w-64 bg-slate-200 rounded mb-4" />
        <div className="h-4 w-96 bg-slate-200 rounded mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6">
          <div className="space-y-4">
            <div className="h-48 bg-slate-200 rounded-lg" />
            <div className="h-32 bg-slate-200 rounded-lg" />
          </div>
          <div>
            <div className="h-64 bg-slate-200 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
