/**
 * Helper auth: token + role (admin/user) di localStorage.
 * Dipakai untuk redirect guard dan cek akses.
 */

const TOKEN_KEY = "token";
const AUTH_ROLE_KEY = "auth_role";
const USER_ID_KEY = "user_id";       
const USER_AVATAR_URL_KEY = "user_avatar_url";
const USER_USERNAME_KEY = "user_username";
const USER_NAME_KEY = "user_name";
const USER_EMAIL_KEY = "user_email";
const USER_PHONE_KEY = "user_phone";

export type AuthRole = "admin" | "user";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getAuthRole(): AuthRole | null {
  if (typeof window === "undefined") return null;
  const r = localStorage.getItem(AUTH_ROLE_KEY);
  if (r === "admin" || r === "user") return r;
  return null;
}

export function setAuth(token: string, role: AuthRole): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(AUTH_ROLE_KEY, role);
}

export function clearAuth(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(AUTH_ROLE_KEY);
  localStorage.removeItem(USER_ID_KEY);
  localStorage.removeItem(USER_AVATAR_URL_KEY);
  localStorage.removeItem(USER_USERNAME_KEY);
  localStorage.removeItem(USER_NAME_KEY);
  localStorage.removeItem(USER_EMAIL_KEY);
  localStorage.removeItem(USER_PHONE_KEY);
}


/**
 * Logout (clear auth) dan redirect ke halaman login.
 * Dipanggil saat token kadaluarsa (401) dari API.
 */
export function logoutAndRedirect(): void {
  if (typeof window === "undefined") return;
  const role = getAuthRole();
  clearAuth();
  if (role === "admin") {
    window.location.replace("/admin/login");
  } else {
    window.location.replace("/auth/login");
  }
}

/** Info profil user (bisa diset saat login/profile API) */
export function getUserProfile(): { username: string; name: string; email: string; phone: string } {
  if (typeof window === "undefined") return { username: "", name: "", email: "", phone: "" };
  return {
    username: localStorage.getItem(USER_USERNAME_KEY) ?? "",
    name: localStorage.getItem(USER_NAME_KEY) ?? "",
    email: localStorage.getItem(USER_EMAIL_KEY) ?? "",
    phone: localStorage.getItem(USER_PHONE_KEY) ?? "",
  };
}

export function setUserProfile(profile: { username?: string; name?: string; email?: string; phone?: string }): void {
  if (typeof window === "undefined") return;
  if (profile.username != null) localStorage.setItem(USER_USERNAME_KEY, profile.username);
  if (profile.name != null) localStorage.setItem(USER_NAME_KEY, profile.name);
  if (profile.email != null) localStorage.setItem(USER_EMAIL_KEY, profile.email);
  if (profile.phone != null) localStorage.setItem(USER_PHONE_KEY, profile.phone);
}

/** URL foto profil user (bisa diset saat login/profile API) */
export function getUserAvatarUrl(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(USER_AVATAR_URL_KEY);
}

export function setUserAvatarUrl(url: string | null): void {
  if (typeof window === "undefined") return;
  if (url) localStorage.setItem(USER_AVATAR_URL_KEY, url);
  else localStorage.removeItem(USER_AVATAR_URL_KEY);
}

export function isAdmin(): boolean {
  return getAuthRole() === "admin";
}

export function isLoggedIn(): boolean {
  return !!getToken();
}


export function getUserId(): number | null {
  if (typeof window === "undefined") return null;
  
  // Coba dari localStorage dulu
  const id = localStorage.getItem(USER_ID_KEY);
  if (id) return Number(id);
  
  // Fallback: decode dari JWT token
  const token = getToken();
  if (!token) return null;
  
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.user_id ?? null;
  } catch {
    return null;
  }
}

export function setUserId(id: number): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(USER_ID_KEY, String(id));
}
