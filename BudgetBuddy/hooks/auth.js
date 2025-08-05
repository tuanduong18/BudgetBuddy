import { useCallback } from 'react';
import { Alert } from 'react-native';
import { API_BASE } from "../constants/api";
import { getRefreshToken, clearTokens, saveTokens } from "../constants/authStorage";
import { useRouter } from 'expo-router';

export function useSignUp() {
    const router = useRouter()

    const signUp = useCallback(async (username, password) => {
        try {
            const res = await fetch(`${API_BASE}/auth/sign_up`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username,
                    password,
                }),
            });
            const data = await res.json()
            if (res.ok) {
            Alert.alert("Success", data.message);
            router.push("/auth/sign_in");
            } else {
            Alert.alert("Signup failed", data.message || "Signup failed.");
            }
            
        } catch (error) {
            console.error("Signup error:", error.message);
            Alert.alert("Network Error", error.message);
        }
    }, [router]);

    return signUp;
}

export function useSignIn() {
    const router = useRouter()
    const signIn = useCallback(async (username, password) => {
        try {
            const res = await fetch(`${API_BASE}/auth/sign_in`, {
                method: 'POST',
                headers: {
                'Content-Type': 'application/json',
                }, 
                body: JSON.stringify({
                    username,
                    password,
                }),
            });
            
            const data = await res.json()
            
            if (res.ok) {
            // save the tokens
            const access_token = data.access_token
            const refresh_token = data.refresh_token

            await saveTokens(access_token, refresh_token)

            Alert.alert("Success", "Successfully logging in");
            router.replace("/(tabs)/personal_expenses/expenses");
            } else {
            Alert.alert("Error", data.message || "Signin failed.");
            }
        
        } catch (error) {
            console.error("Signin error:", error.message);
            Alert.alert("Network Error", error.message);
        }
    }, [router]);

    return signIn;
}

export function useSignOut() {
    const router = useRouter()
    const signOut = useCallback(async () => {
        Alert.alert("Successfully signed out"); 
        await clearTokens()
        router.replace("/index");
    }, [router]);
  return signOut;
}

export function useRefreshToken() {
    const router = useRouter()

    const refreshToken = useCallback(async () => {
        
        const r_token = await getRefreshToken()
        
        if (!r_token) {
            console.log("Error", "No refresh token found.")
            Alert.alert("Unauthorized", "Please sign in");
            return;
        }
        
        try {
            const res = await fetch(`${API_BASE}/auth/refresh`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${r_token}`,
                   
                },
            });
            
            const data = await res.json()
            if (res.ok) {
            const a_token = data.access_token
            saveTokens(a_token, r_token)
            
            } else {
            Alert.alert("Authentication Error", "You have to sign in again");
            clearTokens()
            router.replace('/index')
            }
            
        } catch (error) {
            console.error("Signout error:", error.message);
            Alert.alert("Network Error", error.message);
        }
    }, [router]);

    return refreshToken;
}