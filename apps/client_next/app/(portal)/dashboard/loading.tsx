export default function DashboardLoading() {
  return (
    <>
      <div className="bg-blue-600 px-6 py-4 animate-pulse">
        <div className="h-4 w-20 bg-blue-400 rounded mb-2" />
        <div className="h-6 w-32 bg-blue-400 rounded" />
      </div>
      <div className="px-6 py-6 animate-pulse">
        <div className="h-6 w-40 bg-slate-200 rounded mb-2" />
        <div className="h-4 w-56 bg-slate-200 rounded mb-6" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-slate-200 rounded-lg" />
          ))}
        </div>
      </div>
    </>
  );
}
