/**
 * app/api/proxy/jasamc/[...path]/route.ts
 * Forward semua request ke jasamc (localhost:8081)
 *
 * Contoh:
 *   GET  /api/proxy/jasamc/users  →  GET  localhost:8081/users
 *   POST /api/proxy/jasamc/login  →  POST localhost:8081/login
 */
import { createHandlers } from "../../_handler";

export const { GET, POST, PUT, PATCH, DELETE } = createHandlers("jasamc");
