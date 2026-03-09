export default function PublicLoading() {
  return (
    <div className="min-h-screen animate-pulse">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-20">
        <div className="h-12 w-80 bg-slate-200 rounded mx-auto mb-6" />
        <div className="h-6 w-96 bg-slate-200 rounded mx-auto mb-12" />
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 bg-slate-200 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
