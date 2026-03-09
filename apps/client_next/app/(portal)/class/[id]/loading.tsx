export default function ClassLoading() {
  return (
    <>
      <div className="w-64 bg-white border-r border-slate-200 p-4 animate-pulse">
        <div className="h-8 w-full bg-slate-200 rounded mb-4" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-8 w-full bg-slate-200 rounded" />
          ))}
        </div>
      </div>
      <div className="flex-1 p-6 animate-pulse">
        <div className="h-8 w-48 bg-slate-200 rounded mb-6" />
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-200 rounded-lg" />
          ))}
        </div>
      </div>
    </>
  );
}
