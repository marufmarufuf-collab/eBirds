export default function PageLoading() {
  return (
    <div className="px-5 py-10 max-w-2xl">
      <div className="skeleton h-7 w-40 mb-6" />
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="card p-4 flex items-center gap-3">
            <div className="skeleton rounded-full" style={{ width: 44, height: 44 }} />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-3.5 w-1/3" />
              <div className="skeleton h-3 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
