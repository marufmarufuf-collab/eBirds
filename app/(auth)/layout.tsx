export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen flex items-center justify-center px-5 py-16 relative overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(650px circle at 12% 8%, #ffe2c2 0%, transparent 55%), radial-gradient(550px circle at 90% 92%, #ffd2ac 0%, transparent 55%)",
        }}
      />
      <div className="w-full max-w-sm enter">
        <div className="mb-8 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-full.png" alt="eBirds" className="h-9 w-auto object-contain mx-auto" />
        </div>
        <div className="card p-7" style={{ boxShadow: "var(--shadow-lg)" }}>
          {children}
        </div>
      </div>
    </main>
  );
}
