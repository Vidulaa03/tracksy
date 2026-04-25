import { Sidebar } from '@/components/Navigation/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 max-w-7xl mx-auto px-4 py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
