import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminHeader } from "@/components/admin/AdminHeader";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
      <div className="min-h-screen flex flex-col bg-[#f5f0eb]">
        <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(214,211,209,0.4),transparent)] pointer-events-none" aria-hidden />
        <AdminHeader />
        {children}
      </div>
    </AdminGuard>
  );
}
