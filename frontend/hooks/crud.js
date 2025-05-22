import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { API_BASE } from '@/constants/api';
import { getAccessToken } from '@/constants/authStorage';
import { useRouter } from 'expo-router';
import { useRefreshToken } from './auth';

export function useAddExpense() {
    const router = useRouter()
    const refreshToken = useRefreshToken();

    const addExpense = useCallback(async (dict) => {
        try {
            await refreshToken()
            const tokenn = await getAccessToken()

            if (!tokenn) {
                console.log("Error", "No access token found.")
                Alert.alert("Error", "No access token found.");
                return;
            }

            const res = await fetch(`${API_BASE}/home_page/action/add`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${tokenn}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dict)

            });

            const data = await res.json()
            
            if (res.ok) {
                Alert.alert("Successfully added");
                router.push("/tabs/home_page");
            } else {
                console.log(data.message)
                Alert.alert("Failed:", data.message || "");
            }
        } catch (error) {
            console.error("Save error:", error.message);
            Alert.alert("Network Error", error.message);
        }
    }, [router]);

    return addExpense;
}

export function useUpdateExpense() {
    const router = useRouter()
    const refreshToken = useRefreshToken();

    const updateExpense = useCallback(async (dict) => {
        try {
            await refreshToken()
            const tokenn = await getAccessToken()

            if (!tokenn) {
                console.log("Error", "No access token found.")
                Alert.alert("Error", "No access token found.");
                return;
            }

            const res = await fetch(`${API_BASE}/home_page/action/update`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${tokenn}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dict)

            });

            const data = await res.json()
            
            if (res.ok) {
                Alert.alert("Successfully updated");
                router.push("/tabs/home_page");
            } else {
                console.log(data.message)
                Alert.alert("Failed:", data.message || "");
            }
        } catch (error) {
            console.error("Save error:", error.message);
            Alert.alert("Network Error", error.message);
        }
    }, [router]);

    return updateExpense;
}

export function useDeleteExpense() {
    const router = useRouter()
    const refreshToken = useRefreshToken();

    const deleteExpense = useCallback(async (id) => {
        try {
            await refreshToken()
            const tokenn = await getAccessToken()

            if (!tokenn) {
                console.log("Error", "No access token found.")
                Alert.alert("Error", "No access token found.");
                return;
            }

            const res = await fetch(`${API_BASE}/home_page/action/delete`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${tokenn}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({id,})

            });

            const data = await res.json()
            
            if (res.ok) {
                Alert.alert("Successfully deleted");
                router.push("/tabs/home_page");
            } else {
                console.log(data.message)
                Alert.alert("Failed:", data.message || "");
            }
        } catch (error) {
            console.error("delete error:", error.message);
            Alert.alert("Network Error", error.message);
        }
    }, [router]);

    return deleteExpense;
}