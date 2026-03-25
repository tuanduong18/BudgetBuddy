/**
 * Data-fetching hooks.
 *
 * Every exported hook is a thin wrapper around the private `getData` function,
 * which handles the full request lifecycle:
 *   1. Silently refresh the access token.
 *   2. Attach the fresh token to the Authorization header.
 *   3. POST to the given API endpoint with an optional JSON body.
 *   4. Expose `{ data, loading, refetch }` for the calling component.
 *
 * Passing a `dict` argument to a hook (or to `refetch`) serialises it as the
 * request body, allowing the same hook to serve both initial loads and
 * user-triggered filter/currency changes.
 */
import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { API_BASE } from '@/constants/api';
import { getAccessToken } from '@/constants/authStorage';
import { useRefreshToken } from './auth';

// ── Reference / lookup data ────────────────────────────────────────────────
export function useUsername()        { return getData(`${API_BASE}/expenses/data/username`); }
export function useExpenseTypes()    { return getData(`${API_BASE}/expenses/data/expense_types`); }
export function useCurrencyTypes()   { return getData(`${API_BASE}/expenses/data/currency_types`); }

// ── Personal expenses ──────────────────────────────────────────────────────
/** @param {object|null} dict - Optional filter body, e.g. `{ currency: 'SGD' }`. */
export function useExpenses(dict = null)      { return getData(`${API_BASE}/expenses/data/expenses`, dict); }
/** @param {object} dict - Must contain `{ id }` of the expense to load. */
export function useUpdatingExpense(dict)      { return getData(`${API_BASE}/expenses/data/updating`, dict); }
export function useNewestExpenses()           { return getData(`${API_BASE}/expenses/data/dashboard`); }

// ── Subscription reminders ─────────────────────────────────────────────────
export function useSubscriptions()            { return getData(`${API_BASE}/subscriptions/data/all`); }
/** @param {object} dict - Must contain `{ id }` of the reminder to load. */
export function useUpdatingSubs(dict)         { return getData(`${API_BASE}/subscriptions/data/updating`, dict); }

// ── Monthly limits ─────────────────────────────────────────────────────────
/** @param {object|null} dict - Optional filter body, e.g. `{ currency: 'SGD' }`. */
export function useMonthlyLimits(dict = null) { return getData(`${API_BASE}/limits/data/all`, dict); }
/** @param {object} dict - Must contain `{ id }` of the limit to load. */
export function useUpdatingLimit(dict)        { return getData(`${API_BASE}/limits/data/updating`, dict); }

// ── User profile ───────────────────────────────────────────────────────────
export function useCurrencyPreference()       { return getData(`${API_BASE}/profile/data/currency`); }

// ── Group / split bills ────────────────────────────────────────────────────
export function useGroupNames()               { return getData(`${API_BASE}/group/data/all`); }
/** @param {object} dict - Must contain `{ group_id }`. */
export function useGroupDetails(dict)         { return getData(`${API_BASE}/group/data/current`, dict); }
/** @param {object} dict - Must contain `{ group_id }` and optionally `{ currency }`. */
export function useGroupOwes(dict)            { return getData(`${API_BASE}/group/data/owes`, dict); }


/**
 * Core data-fetching primitive shared by all exported hooks.
 *
 * Automatically refreshes the JWT access token before every request so that
 * components never need to handle token expiry themselves.
 *
 * @param {string}      api  - Absolute API URL to POST to.
 * @param {object|null} dict - Optional JSON request body.
 * @returns {{ data: any, loading: boolean, refetch: Function }}
 */
function getData(api, dict = null) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const refreshToken = useRefreshToken();

    const loadData = useCallback(async (dict) => {
        try {
            // Silently refresh the access token before every request.
            await refreshToken();
            const token = await getAccessToken();

            if (!token) {
                console.log('Error', 'No access token found.');
                Alert.alert('Error', 'No access token found.');
                return;
            }

            const res = await fetch(api, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dict),
            });

            const json = await res.json();

            if (res.ok) {
                setData(json);
            } else {
                throw new Error(`Status ${res.status}`);
            }
        } catch (e) {
            Alert.alert('Error loading data', e.message);
            console.log('Error loading data', e.message);
        } finally {
            setLoading(false);
        }
    }, []);

    // Trigger initial load on mount.
    useEffect(() => {
        loadData(dict);
    }, [loadData]);

    return { data, loading, refetch: loadData };
}