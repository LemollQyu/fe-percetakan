/**
 * PATCH /api/v1/admin/category/:id/icon - upload icon kategori (admin only)
 * Body: multipart/form-data, field "icon" (file PNG/SVG, max 2MB)
 */
import { getJasaFetchUrl } from "@/lib/api";

export async function uploadCategoryIcon(
  id: number,
  file: File,
  token: string
): Promise<{ message: string }> {
  const form = new FormData();
  form.append("icon", file);

  const res = await fetch(getJasaFetchUrl(`/api/v1/admin/category/${id}/icon`), {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: form,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error_message: res.statusText }));
    throw new Error((err as { error_message?: string }).error_message ?? "Upload gagal");
  }
  return res.json() as Promise<{ message: string }>;
}
