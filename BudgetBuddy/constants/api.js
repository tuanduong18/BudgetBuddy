/**
 * Centralised API base URL.
 *
 * All fetch calls in hooks/auth.js and hooks/data.js resolve their endpoints
 * relative to this constant so that switching environments (dev ↔ prod)
 * requires a change in exactly one place.
 */
export const API_BASE = 'https://budgetbuddy-e54b.onrender.com';
