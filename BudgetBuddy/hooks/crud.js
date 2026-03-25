/**
 * Generic CRUD action hooks.
 *
 * Every exported hook is a thin wrapper around `useAction`, which handles
 * the full mutation lifecycle:
 *   1. Silently refresh the access token.
 *   2. POST the JSON body to the given endpoint.
 *   3. Show a success alert or surface the server-side error message.
 *
 * Each hook returns a stable `action(dict)` callback that resolves to
 * `true` on success or `false` on failure, so callers can gate navigation
 * on the result.
 */
import { useCallback } from 'react';
import { Alert } from 'react-native';
import { API_BASE } from '@/constants/api';
import { getAccessToken } from '@/constants/authStorage';
import { useRefreshToken } from './auth';

// ── Personal expenses ──────────────────────────────────────────────────────
export function useAddExpense()    { return useAction(`${API_BASE}/expenses/action/add`,    "Successfully added new expense"); }
export function useUpdateExpense() { return useAction(`${API_BASE}/expenses/action/update`, "Successfully updated"); }
export function useDeleteExpense() { return useAction(`${API_BASE}/expenses/action/delete`, "Successfully deleted"); }

// ── Monthly budget limits ──────────────────────────────────────────────────
export function useAddLimit()    { return useAction(`${API_BASE}/limits/action/add`,    "Successfully added new monthly limit"); }
export function useUpdateLimit() { return useAction(`${API_BASE}/limits/action/update`, "Successfully updated monthly limit"); }
export function useDeleteLimit() { return useAction(`${API_BASE}/limits/action/delete`, "Successfully deleted"); }

// ── User profile ───────────────────────────────────────────────────────────
export function useUpdateProfileCurrency() { return useAction(`${API_BASE}/profile/action/currency`, "Successfully updated"); }

// ── Group / split bills ────────────────────────────────────────────────────
export function useCreateGroup()        { return useAction(`${API_BASE}/group/action/create`,       "Successfully created"); }
export function useJoinGroup()          { return useAction(`${API_BASE}/group/action/join`,         "Successfully joined"); }
export function useLeaveGroup()         { return useAction(`${API_BASE}/group/action/leave`,        "Successfully left"); }
export function useAddGroupExpense()    { return useAction(`${API_BASE}/group/groupExpense/add`,    "Successfully added"); }
export function useSettleGroupExpense() { return useAction(`${API_BASE}/group/groupExpense/settle`, "Successfully settled"); }

/**
 * Core mutation primitive shared by all exported hooks.
 *
 * @param {string} api     - Absolute API URL to POST to.
 * @param {string} message - Alert text shown on a successful response.
 * @returns {Function} `action(dict)` — resolves to `true` on success, `false` on failure.
 */
function useAction(api, message) {
    const refreshToken = useRefreshToken();

    const action = useCallback(async (dict) => {
        try {
            await refreshToken();
            const token = await getAccessToken();

            if (!token) {
                console.log("Error", "No access token found.");
                Alert.alert("Error", "Unauthorized");
                return false;
            }

            const res = await fetch(api, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dict),
            });

            const data = await res.json();

            if (res.ok) {
                Alert.alert(message);
            } else {
                console.log(data.error);
                Alert.alert("Failed:", data.error || "");
            }
            return res.ok;

        } catch (error) {
            console.error("Database error:", error.message);
            Alert.alert("Network Error", error.message);
            return false;
        }
    }, []);

    return action;
}