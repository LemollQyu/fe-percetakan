import { getServicesList } from "@/api/jasa/services";
import type { ServiceJasa } from "@/api/jasa/services/types";
import { getCategoriesList } from "@/api/jasa/categories";
import { ShuffledServices } from "./ShuffledServices";

export async function ServicesSection() {
  let services: ServiceJasa[] = [];

  try {
    // Pakai allSettled agar kalau salah satu gagal, yang lain tetap jalan
    const [servicesRes, categoriesRes] = await Promise.allSettled([
      getServicesList(),
      getCategoriesList(),
    ]);

    const servicesData =
      servicesRes.status === "fulfilled" ? (servicesRes.value.data ?? []) : [];

    const categoriesData =
      categoriesRes.status === "fulfilled"
        ? (categoriesRes.value.data ?? [])
        : [];

    if (servicesData.length === 0) {
      console.warn("[ServicesSection] Services data kosong atau gagal fetch.");
    }

    const activeCategories = new Set(
      categoriesData.filter((c) => c.is_active).map((c) => c.id),
    );

    services = servicesData.filter((s) => {
      if (!s.is_active) return false;
      // Kalau categories gagal diambil, tampilkan semua service aktif
      if (activeCategories.size === 0) return true;
      return activeCategories.has(s.category_id);
    });
  } catch (err) {
    console.error("[ServicesSection] Unexpected error:", err);
    return (
      <p className="font-monterat-tipis text-sm text-red-500 px-1">
        Gagal memuat layanan.
      </p>
    );
  }

  if (services.length === 0) {
    return (
      <p className="font-monterat-tipis text-sm text-stone-500 px-1">
        Belum ada layanan tersedia.
      </p>
    );
  }

  // Shuffle diserahkan ke client component agar tidak ada hydration mismatch
  return <ShuffledServices services={services} />;
}
