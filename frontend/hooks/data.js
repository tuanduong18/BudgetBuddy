import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { API_BASE } from '@/constants/api';
import { getAccessToken } from '@/constants/authStorage';
import { useRefreshToken } from './auth';

export function useUsername() {
    const [data, setData] = useState(null);
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
            
            const res = await fetch(`${API_BASE}/home_page/data/username`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${tokenn}`,
                    
                },
            });

            const json = await res.json();
            
            if (res.ok) {
                setData(json.username)
            } else {
                throw new Error(`Status ${res.status}`);
            }
        } catch (e) {
            Alert.alert('Error loading dashboard', e.message);
            console.log('Error loading dashboard', e.message)
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);
    
    return {data, loading}
}

export function useTransactionTypes() {
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
            
            const res = await fetch(`${API_BASE}/home_page/data/types`, {
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
            Alert.alert('Error loading dashboard', e.message);
            console.log('Error loading dashboard', e.message)
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);
    
    return {data, loading}
}

export function useTransactions() {
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
            
            const res = await fetch(`${API_BASE}/home_page/data/transactions`, {
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
            Alert.alert('Error loading dashboard', e.message);
            console.log('Error loading dashboard', e.message)
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);
    
    return {data, loading}
}