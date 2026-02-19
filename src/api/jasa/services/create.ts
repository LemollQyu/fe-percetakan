/**
 * POST /api/v1/admin/service - buat service + upload icon, thumbnail, gallery (admin only)
 * Body: multipart/form-data
 * Fields: category_id, name, description, base_price
 * Files: icon (optional), thumbnail (required), gallery (required, bisa banyak)
 */
import { getJasaFetchUrl } from "@/lib/api";
import type { ServiceJasa } from "./types";

export type CreateServiceForm = {
  category_id: number;
  name: string;
  description: string;
  base_price?: number;
};

export type CreateServiceResponse = {
  message: string;
  data: ServiceJasa;
};

export async function createService(
  form: CreateServiceForm,
  files: { icon?: File; thumbnail: File | File[]; gallery: File | File[] },
  token: string
): Promise<CreateServiceResponse> {
  const body = new FormData();
  body.append("category_id", String(form.category_id));
  body.append("name", form.name);
  body.append("description", form.description);
  if (form.base_price != null) {
    body.append("base_price", String(form.base_price));
  }
  if (files.icon) body.append("icon", files.icon);
  const thumbnailFiles = Array.isArray(files.thumbnail) ? files.thumbnail : [files.thumbnail];
  thumbnailFiles.forEach((f) => body.append("thumbnail", f));
  const galleryFiles = Array.isArray(files.gallery) ? files.gallery : [files.gallery];
  galleryFiles.forEach((f) => body.append("gallery", f));

  const res = await fetch(getJasaFetchUrl("/api/v1/admin/service"), {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error_message: res.statusText }));
    throw new Error((err as { error_message?: string }).error_message ?? "Gagal membuat service");
  }
  return res.json() as Promise<CreateServiceResponse>;
}
