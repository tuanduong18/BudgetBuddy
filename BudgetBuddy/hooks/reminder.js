import { useCallback } from 'react';
import { Alert } from 'react-native';
import { API_BASE } from '@/constants/api';
import { getAccessToken } from '@/constants/authStorage';
import { useRouter } from 'expo-router';
import { useRefreshToken } from './auth';
import * as Notifications from 'expo-notifications';

export function useAddSubscription(){return useAction(`${API_BASE}/subscriptions/action/add`, "Successfully added new subscription")}    
export function useUpdateSubscription() {return useAction(`${API_BASE}/subscriptions/action/update`, "Successfully updated")}
//export function useDeleteSubscription() {return useAction(`${API_BASE}/subscriptions/action/delete`, "Successfully deleted")}

function useAction(api, message) {
    const router = useRouter()
    const refreshToken = useRefreshToken();

    const action = useCallback(async (dict) => {
        try {
            await refreshToken()
            const tokenn = await getAccessToken()

            if (!tokenn) {
                console.log("Error", "No access token found.")
                Alert.alert("Error", "Unauthorized");
                return;
            }
            const res = await fetch(api, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${tokenn}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dict)

            });

            const data = await res.json()
            
            if (res.ok) {
                Alert.alert(message);
                router.replace("/reminders/allReminders");
            } else {
                console.log(data.message)
                Alert.alert("Failed:", data.message || "");
            }
        } catch (error) {
            console.error("Database error:", error.message);
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


export function useDeleteSubscription() {
    const router = useRouter()
    const refreshToken = useRefreshToken();

    const action = useCallback(async (dict) => {
        try {
            await refreshToken()
            const tokenn = await getAccessToken()

            if (!tokenn) {
                console.log("Error", "No access token found.")
                Alert.alert("Error", "Unauthorized");
                return;
            }
            const res = await fetch(`${API_BASE}/subscriptions/action/delete`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${tokenn}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dict)

            });

            const data = await res.json()
            
            if (res.ok) {
                await Notifications.cancelScheduledNotificationAsync(dict['noti_id']);
                Alert.alert("Successfully deleted");
                router.replace("/reminders/allReminders");
            } else {
                console.log(data.message)
                Alert.alert("Failed:", data.message || "");
            }
        } catch (error) {
            console.error("Database error:", error.message);
            Alert.alert("Network Error", error.message);
        }
    }, [router]);

    return action;
}