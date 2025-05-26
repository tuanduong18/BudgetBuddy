import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { API_BASE } from '@/constants/api';
import { getAccessToken } from '@/constants/authStorage';
import { useRouter } from 'expo-router';
import { useRefreshToken } from './auth';

export function useAddExpense()     {return useAction(`${API_BASE}/expenses/action/add`, "Successfully added new expense")}
export function useUpdateExpense()  {return useAction(`${API_BASE}/expenses/action/update`, "Successfully updated")}
export function useDeleteExpense()  {return useAction(`${API_BASE}/expenses/action/delete`, "Successfully deleted")}
    
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
                router.replace("/personal_expenses/history");
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