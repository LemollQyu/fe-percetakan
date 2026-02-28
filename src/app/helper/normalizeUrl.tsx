/**
 * lib/static-url.ts
 *
 * Helper untuk normalize URL static file (gambar, PDF, dll)
 * yang datang dari response API microservice.
 *
 * Masalah:
 *   Response API menyimpan URL seperti:
 *     "localhost:8082/static/order/xxx.jpeg"   ← tanpa http://
 *     "localhost:8081/static/jasa/xxx.png"
 *
 *   URL ini tidak bisa diakses dari luar (ngrok / HP / laptop lain)
 *   karena mengarah ke localhost mesin server.
 *
 * Solusi:
 *   Strip "localhost:808x" → jadi path relative "/static/order/xxx.jpeg"
 *   Next.js rewrite di next.config.js akan forward path ini ke service yang tepat.
 *
 * Cara pakai:
 *   import { toStaticUrl } from "@/lib/static-url";
 *   <img src={toStaticUrl(order.order_file.file_url)} />
 *   <Image src={toStaticUrl(category.meta.icon)} />
 */

/**
 * Normalize URL static file dari response API.
 *
 * @example
 * toStaticUrl("localhost:8082/static/order/xxx.jpeg")
 * // → "/static/order/xxx.jpeg"
 *
 * toStaticUrl("http://localhost:8081/static/jasa/xxx.png")
 * // → "/static/jasa/xxx.png"
 *
 * toStaticUrl("/static/order/xxx.jpeg")
 * // → "/static/order/xxx.jpeg"  (sudah benar, tidak diubah)
 *
 * toStaticUrl("")
 * // → ""  (kosong dikembalikan apa adanya)
 */
export function toStaticUrl(raw: string | null | undefined): string {
  if (!raw) return "";

  // Sudah relative path → tidak perlu diubah
  if (raw.startsWith("/")) return raw;

  // Sudah absolute URL dengan domain bukan localhost → tidak diubah
  // (misal kalau suatu saat pakai CDN / object storage)
  if (raw.startsWith("http") && !raw.includes("localhost")) return raw;

  // Strip "http://localhost:808x" atau "localhost:808x"
  return raw.replace(/^(https?:\/\/)?localhost:\d+/, "");
}

/**
 * Cek apakah URL adalah file gambar berdasarkan ekstensi.
 */
export function isImageUrl(url: string): boolean {
  const ext = url.split(".").pop()?.toLowerCase() ?? "";
  return ["jpg", "jpeg", "png", "gif", "webp", "svg", "avif"].includes(ext);
}

/**
 * Cek apakah URL adalah file PDF.
 */
export function isPdfUrl(url: string): boolean {
  return url.split(".").pop()?.toLowerCase() === "pdf";
}
