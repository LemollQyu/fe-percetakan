/**
 * app/api/proxy/ordermc/[...path]/route.ts
 * Forward semua request ke ordermc (localhost:8082)
 *
 * Contoh:
 *   GET  /api/proxy/ordermc/users  →  GET  localhost:8082/users
 *   POST /api/proxy/ordermc/login  →  POST localhost:8082/login
 */
import { createHandlers } from "../../_handler";

export const { GET, POST, PUT, PATCH, DELETE } = createHandlers("ordermc");
