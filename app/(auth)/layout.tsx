export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen flex items-center justify-center px-5 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="display text-2xl">Platform</h1>
        </div>
        <div className="card p-6">{children}</div>
      </div>
    </main>
  );
}
