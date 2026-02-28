/**
 * app/api/proxy/paymentmc/[...path]/route.ts
 * Forward semua request ke paymentmc (localhost:8083)
 *
 * Contoh:
 *   GET  /api/proxy/paymentmc/users  →  GET  localhost:8083/users
 *   POST /api/proxy/paymentmc/login  →  POST localhost:8083/login
 */
import { createHandlers } from "../../_handler";

export const { GET, POST, PUT, PATCH, DELETE } = createHandlers("paymentmc");
