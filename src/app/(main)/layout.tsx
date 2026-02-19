import { HomeHeader } from "@/components/main/HomeHeader";
import { SearchBarOnHome } from "@/components/main/SearchBarOnHome";
import { BottomNav } from "@/components/main/BottomNav";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[#f5f0eb] relative">
      <div
        className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(214,211,209,0.4),transparent)] pointer-events-none"
        aria-hidden
      />
      <HomeHeader />
      <SearchBarOnHome />
      {children}
      <BottomNav />
    </div>
  );
}
