export default function PortalLoading() {
  return (
    <div className="flex-1 px-6 py-6 animate-pulse">
      <div className="h-8 w-48 bg-slate-200 rounded mb-6" />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-48 bg-slate-200 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
