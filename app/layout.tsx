import '@/styles/globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 min-h-screen">
        <header className="p-4 bg-white shadow">
          <a href="/" className="text-xl font-bold">OpenShield</a>
        </header>
        <main className="p-6 mx-auto w-full">{children}</main>
      </body>
    </html>
  );
}