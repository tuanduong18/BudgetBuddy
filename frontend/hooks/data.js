import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { API_BASE } from '@/constants/api';
import { getAccessToken } from '@/constants/authStorage';
import { useRefreshToken } from './auth';

export function useUsername()       {return getData(`${API_BASE}/expenses/data/username`)}
export function useExpenseTypes()   {return getData(`${API_BASE}/expenses/data/expense_types`)}
export function useCurrencyTypes()  {return getData(`${API_BASE}/expenses/data/currency_types`)}
export function useExpenses()       {return getData(`${API_BASE}/expenses/data/expenses`)}

function getData(api) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const refreshToken = useRefreshToken();

    const loadData = useCallback(async () => {
        try {
            await refreshToken()
            const tokenn = await getAccessToken()
        
            if (!tokenn) {
                console.log("Error", "No access token found.")
                Alert.alert("Error", "No access token found.");
                return;
            }
            
            const res = await fetch(`${api}`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${tokenn}`,
                    
                },
            });

            const json = await res.json();
            
            if (res.ok) {
                setData(json)
            } else {
                throw new Error(`Status ${res.status}`);
            }
        } catch (e) {
            Alert.alert('Error loading data', e.message);
            console.log('Error loading data', e.message)
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);
    
    return {data, loading}
}