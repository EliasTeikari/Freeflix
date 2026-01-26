import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-dark flex flex-col">
      {/* Simple header for auth pages */}
      <header className="p-6">
        <Link href="/">
          <h1 className="text-3xl font-bold text-primary">FREEFLIX</h1>
        </Link>
      </header>

      {/* Centered content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        {children}
      </main>

      {/* Simple footer */}
      <footer className="p-6 text-center text-gray-500 text-sm">
        &copy; {new Date().getFullYear()} Freeflix. For educational purposes
        only.
      </footer>
    </div>
  );
}
