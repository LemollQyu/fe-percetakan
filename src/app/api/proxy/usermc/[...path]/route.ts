/**
 * app/api/proxy/usermc/[...path]/route.ts
 * Forward semua request ke usermc (localhost:8080)
 *
 * Contoh:
 *   GET  /api/proxy/usermc/users  →  GET  localhost:8080/users
 *   POST /api/proxy/usermc/login  →  POST localhost:8080/login
 */
import { createHandlers } from "../../_handler";

export const { GET, POST, PUT, PATCH, DELETE } = createHandlers("usermc");
