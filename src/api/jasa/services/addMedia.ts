/**
 * POST /api/v1/admin/service/:serviceID/media - tambah media (icon/thumbnail/gallery) ke service (admin only)
 * Body: multipart/form-data
 * Fields: type (gallery | icon | thumbnail)
 * File: key = type (icon / thumbnail / gallery)
 */
import { getJasaFetchUrl } from "@/lib/api";

export type AddServiceMediaType = "gallery" | "icon" | "thumbnail";

export async function addServiceMedia(
  serviceID: number,
  type: AddServiceMediaType,
  file: File,
  token: string
): Promise<{ message: string }> {
  const form = new FormData();
  form.append("type", type);
  form.append(type, file);

  const res = await fetch(
    getJasaFetchUrl(`/api/v1/admin/service/${serviceID}/media`),
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error_message: res.statusText }));
    throw new Error((err as { error_message?: string }).error_message ?? "Upload media gagal");
  }
  return res.json() as Promise<{ message: string }>;
}
