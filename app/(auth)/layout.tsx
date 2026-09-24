export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen flex items-center justify-center px-5 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-full.png" alt="eBirds" className="h-9 w-auto object-contain mx-auto" />
        </div>
        <div className="card p-6">{children}</div>
      </div>
    </main>
  );
}
