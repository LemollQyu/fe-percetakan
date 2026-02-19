import { RequireUser } from "@/components/main/RequireUser";

export default function RiwayatOrderPage() {
  return (
    <main className="flex-1 w-full max-w-[430px] mx-auto px-4 py-6 pb-24">
      <RequireUser title="Riwayat Order" description="Silakan login atau daftar untuk melihat riwayat pesanan Anda.">
        <div className="rounded-2xl bg-white border border-stone-100 shadow-lg shadow-stone-200/30 p-6">
          <h1 className="font-barlow-bold text-xl font-bold text-stone-900 mb-2">
            Riwayat Order
          </h1>
          <p className="font-monterat-tipis text-sm text-stone-600">
            Daftar pesanan Anda akan tampil di sini.
          </p>
        </div>
      </RequireUser>
    </main>
  );
}
