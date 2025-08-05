import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { API_BASE } from '@/constants/api';
import { getAccessToken } from '@/constants/authStorage';
import { useRefreshToken } from './auth';

// User and Expense, Currency types
export function useUsername()                   {return getData(`${API_BASE}/expenses/data/username`)}
export function useExpenseTypes()               {return getData(`${API_BASE}/expenses/data/expense_types`)}
export function useCurrencyTypes()              {return getData(`${API_BASE}/expenses/data/currency_types`)}

// Expenses
export function useExpenses(dict = null)        {return getData(`${API_BASE}/expenses/data/expenses`, dict)}
export function useUpdatingExpense(dict)        {return getData(`${API_BASE}/expenses/data/updating`, dict)}
export function useNewestExpenses()             {return getData(`${API_BASE}/expenses/data/dashboard`)}

// Subscriptions
export function useSubscriptions()              {return getData(`${API_BASE}/subscriptions/data/all`)}
export function useUpdatingSubs(dict)           {return getData(`${API_BASE}/subscriptions/data/updating`, dict)}

// Limits
export function useMonthlyLimits(dict = null)   {return getData(`${API_BASE}/limits/data/all`, dict)}
export function useUpdatingLimit(dict)          {return getData(`${API_BASE}/limits/data/updating`, dict)}

// Profile
export function useCurrencyPreference()         {return getData(`${API_BASE}/profile/data/currency`)}

// Split
export function useGroupNames()                 {return getData(`${API_BASE}/group/data/all`)}
export function useGroupDetails(dict)           {return getData(`${API_BASE}/group/data/current`, dict)}
export function useGroupOwes(dict)              {return getData(`${API_BASE}/group/data/owes`, dict)}


function getData(api, dict = null) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const refreshToken = useRefreshToken();

    const loadData = useCallback(async (dict) => {
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
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dict)
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
        loadData(dict);
    }, [loadData]);
    
    return {data, loading, refetch: loadData}
}