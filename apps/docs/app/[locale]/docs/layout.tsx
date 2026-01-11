import { Header } from '@/components/header';
import { Sidebar, MobileSidebar } from '@/components/sidebar';

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 flex">
        <Sidebar />
        <main className="flex-1 px-4 md:px-8 py-8">{children}</main>
        <MobileSidebar />
      </div>
    </div>
  );
}
