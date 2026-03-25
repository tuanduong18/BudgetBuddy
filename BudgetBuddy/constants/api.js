/**
 * Centralised API base URL.
 * 
 * Loaded from .env (not committed to Git). 
 * If no env variable is found, defaults to localhost for web testing.
 */
export const API_BASE = process.env.EXPO_PUBLIC_API_BASE || 'http://localhost:5000';
