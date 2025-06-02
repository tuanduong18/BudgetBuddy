import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { API_BASE } from '@/constants/api';
import { getAccessToken } from '@/constants/authStorage';
import { useRouter } from 'expo-router';
import { useRefreshToken } from './auth';

export function useAddExpense() {
    return useAction(
        `${API_BASE}/expenses/action/add`, 
        "Successfully added new expense",
        "/personal_expenses/history"
    )}

export function useUpdateExpense() {
    return useAction(
        `${API_BASE}/expenses/action/update`, 
        "Successfully updated",
        "/personal_expenses/history"
    )}

export function useDeleteExpense() {
    return useAction(
        `${API_BASE}/expenses/action/delete`, 
        "Successfully deleted", 
        "/personal_expenses/history"
    )}

export function useAddLimit() {
    return useAction(
        `${API_BASE}/limits/action/add`, 
        "Successfully added new monthly limit", 
        "/monthly_limit/allLimits"
    )}

export function useUpdateLimit() {
    return useAction(
        `${API_BASE}/limits/action/update`, 
        "Successfully updated monthly limit", 
        "/monthly_limit/allLimits"
    )}

export function useDeleteLimit() {
    return useAction(
        `${API_BASE}/limits/action/delete`, 
        "Successfully deleted", 
        "/monthly_limit/allLimits"
    )}
    
function useAction(api, message, route) {
    const router = useRouter()
    const refreshToken = useRefreshToken();

    const action = useCallback(async (dict) => {
        try {
            await refreshToken()
            const tokenn = await getAccessToken()
            if (!tokenn) {
                console.log("Error", "No access token found.")
                Alert.alert("Error", "Unauthorized");
                return false;
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
                router.replace(route);
            } else {
                console.log(data.message)
                Alert.alert("Failed:", data.message || "");
            }
            return res.ok;
            
        } catch (error) {
            console.error("Database error:", error.message);
            Alert.alert("Network Error", error.message);
            return false;
        }
    }, [router]);

    return action;
}