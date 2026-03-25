/**
 * Analytics data-fetching hook.
 *
 * Unlike the generic getData() helper in hooks/data.js, analytics requires
 * two parallel API calls (expenses + categories) for the same time range,
 * so it uses its own `fetchWithAuth` wrapper that handles a 401 inline
 * (refresh → retry) rather than pre-refreshing before every call.
 */
import { useState, useEffect, useCallback } from "react";
import { formatISO } from "date-fns";
import { getAccessToken, getRefreshToken, saveTokens, clearTokens }
        from "../constants/authStorage";
import { API_BASE } from "../constants/api";

/**
 * Perform an authenticated fetch, automatically retrying once on 401
 * by refreshing the access token.
 *
 * @param {string} path - API path relative to API_BASE (e.g. "/analytics/data/expenses").
 * @param {RequestInit} init - Standard fetch options (method, body, etc.).
 * @returns {Promise<Response>}
 */
async function fetchWithAuth(path, init = {}) {
  let token = await getAccessToken();

  const call = (tok) =>
    fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tok}`,
        ...(init.headers || {}),
      },
    });

  let res = await call(token);

  if (res.status === 401) {
    const rTok = await getRefreshToken();
    if (!rTok) throw new Error("No refresh token – please sign in again.");

    const refRes = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { Authorization: `Bearer ${rTok}` },
    });

    if (!refRes.ok) {
      await clearTokens();
      throw new Error("Refresh failed – please sign in again.");
    }

    const { access_token: newAT } = await refRes.json();
    await saveTokens(newAT, rTok);
    res = await call(newAT);
  }
  return res;
}

/**
 * Fetch spending data for bars and category breakdown for a given period.
 *
 * Both requests are fired in parallel via Promise.all so the charts
 * update together rather than staggering.
 *
 * @param {"weekly"|"monthly"} period  - Aggregation window.
 * @param {Date}               refDate - Reference date for the range.
 * @returns {{ expenses: Array, categories: Array, loading: boolean, error: Error|null, reload: Function }}
 */
export function useAnalytics(period, refDate) {
  const [expenses,   setExpenses]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // For monthly, always start from the 1st of the month.
      const ref = period === "monthly"
        ? new Date(refDate.getFullYear(), refDate.getMonth(), 1)
        : refDate;

      const payload = {
        period,
        referenceDate: formatISO(ref, { representation: "date" }),
      };

      const [expRes, catRes] = await Promise.all([
        fetchWithAuth("/analytics/data/expenses",   { method: "POST", body: JSON.stringify(payload) }),
        fetchWithAuth("/analytics/data/categories", { method: "POST", body: JSON.stringify(payload) }),
      ]);

      setExpenses(await expRes.json());
      setCategories(await catRes.json());
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [period, refDate]);

  useEffect(() => { load(); }, [load]);

  return { expenses, categories, loading, error, reload: load };
}