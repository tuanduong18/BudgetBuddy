/**
 * Subscription/reminder CRUD hooks with local notification management.
 *
 * Unlike hooks/crud.js, these hooks also manage device-side scheduled
 * notifications via expo-notifications.  When a subscription is deleted,
 * the corresponding push notification is cancelled so the user doesn't
 * receive a stale reminder.
 */
import { useCallback } from 'react';
import { Alert } from 'react-native';
import { API_BASE } from '@/constants/api';
import { getAccessToken } from '@/constants/authStorage';
import { useRouter } from 'expo-router';
import { useRefreshToken } from './auth';
import * as Notifications from 'expo-notifications';

export function useAddSubscription()    { return useAction(`${API_BASE}/subscriptions/action/add`,    "Successfully added new subscription"); }
export function useUpdateSubscription() { return useAction(`${API_BASE}/subscriptions/action/update`, "Successfully updated"); }

/**
 * Generic action helper for add/update subscription mutations.
 *
 * On a network error, if a `noti_id` is present in `dict`, the scheduled
 * local notification is proactively cancelled because the backend may not
 * have persisted the record — keeping the notification alive would be misleading.
 */
function useAction(api, message) {
    const router = useRouter();
    const refreshToken = useRefreshToken();

    const action = useCallback(async (dict) => {
        try {
            await refreshToken();
            const token = await getAccessToken();

            if (!token) {
                console.log("Error", "No access token found.");
                Alert.alert("Error", "Unauthorized");
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

            const data = await res.json();

            if (res.ok) {
                Alert.alert(message);
                router.replace("/reminders/allReminders");
            } else {
                console.log(data.message);
                Alert.alert("Failed:", data.message || "");
            }
        } catch (error) {
            console.error("Database error:", error.message);
            // Cancel the local notification on failure to avoid orphaned reminders.
            if (dict.noti_id) {
                try {
                    await Notifications.cancelScheduledNotificationAsync(dict.noti_id);
                } catch (notifErr) {
                    console.warn("Failed to cancel local notification:", notifErr);
                }
            }
            Alert.alert("Network Error", error.message);
        }
    }, [router]);

    return action;
}

/**
 * Delete a subscription from the backend and cancel its local notification.
 *
 * This hook is separate from the generic `useAction` above because deletion
 * requires an *additional* step — cancelling the scheduled notification — that
 * must happen only after the server confirms the deletion was successful.
 */
export function useDeleteSubscription() {
    const router = useRouter();
    const refreshToken = useRefreshToken();

    const action = useCallback(async (dict) => {
        try {
            await refreshToken();
            const token = await getAccessToken();

            if (!token) {
                console.log("Error", "No access token found.");
                Alert.alert("Error", "Unauthorized");
                return;
            }

            const res = await fetch(`${API_BASE}/subscriptions/action/delete`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dict),
            });

            const data = await res.json();

            if (res.ok) {
                // Only cancel the notification after the server confirms deletion.
                await Notifications.cancelScheduledNotificationAsync(dict['noti_id']);
                Alert.alert("Successfully deleted");
                router.replace("/reminders/allReminders");
            } else {
                console.log(data.message);
                Alert.alert("Failed:", data.message || "");
            }
        } catch (error) {
            console.error("Database error:", error.message);
            Alert.alert("Network Error", error.message);
        }
    }, [router]);

    return action;
}