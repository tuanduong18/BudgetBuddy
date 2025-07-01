import { useCallback } from 'react';
import { Alert } from 'react-native';
import { API_BASE } from '@/constants/api';
import { getAccessToken } from '@/constants/authStorage';
import { useRefreshToken } from './auth';

export function useAddExpense() {
    return useAction(
        `${API_BASE}/expenses/action/add`, 
        "Successfully added new expense",
    )}

export function useUpdateExpense() {
    return useAction(
        `${API_BASE}/expenses/action/update`, 
        "Successfully updated",
    )}

export function useDeleteExpense() {
    return useAction(
        `${API_BASE}/expenses/action/delete`, 
        "Successfully deleted", 
    )}

export function useAddLimit() {
    return useAction(
        `${API_BASE}/limits/action/add`, 
        "Successfully added new monthly limit", 
    )}

export function useUpdateLimit() {
    return useAction(
        `${API_BASE}/limits/action/update`, 
        "Successfully updated monthly limit", 
    )}

export function useDeleteLimit() {
    return useAction(
        `${API_BASE}/limits/action/delete`, 
        "Successfully deleted", 
    )}

export function useUpdateProfileCurrency() {
    return useAction(
        `${API_BASE}/profile/action/currency`, 
        "Successfully updated", 
    )}    
    
export function useCreateGroup() {
    return useAction(
        `${API_BASE}/group/action/create`, 
        "Successfully created",
    )
}

export function useJoinGroup() {
    return useAction(
        `${API_BASE}/group/action/join`, 
        "Successfully joined",
    )
}

export function useLeaveGroup() {
    return useAction(
        `${API_BASE}/group/action/leave`, 
        "Successfully left",
    )
}

export function useAddGroupExpense() {
    return useAction(
        `${API_BASE}/group/groupExpense/add`, 
        "Successfully added",
    )
}

export function useSettleGroupExpense() {
    return useAction(
        `${API_BASE}/group/groupExpense/settle`, 
        "Successfully settled",
    )
}

function useAction(api, message) {
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
    }, []);

    return action;
}