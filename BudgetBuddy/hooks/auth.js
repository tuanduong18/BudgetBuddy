/**
 * Authentication hooks.
 *
 * Each hook wraps a single auth API call in a `useCallback` so the returned
 * function reference is stable across renders and can be safely listed in
 * `useEffect` dependency arrays.
 *
 * Token persistence is delegated to authStorage.js; navigation is handled
 * via expo-router so these hooks remain UI-agnostic.
 */
import { useCallback } from 'react';
import { Alert } from 'react-native';
import { API_BASE } from '../constants/api';
import { getRefreshToken, clearTokens, saveTokens } from '../constants/authStorage';
import { useRouter } from 'expo-router';

/**
 * Returns a `signUp(username, password)` callback.
 *
 * On success the user is redirected to the sign-in screen so they can
 * immediately log in with their new credentials.
 */
export function useSignUp() {
    const router = useRouter();

    const signUp = useCallback(async (username, password) => {
        try {
            const res = await fetch(`${API_BASE}/auth/sign_up`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });
            const data = await res.json();
            if (res.ok) {
                Alert.alert('Success', data.message);
                router.push('/auth/sign_in');
            } else {
                Alert.alert('Signup failed', data.message || 'Signup failed.');
            }
        } catch (error) {
            console.error('Signup error:', error.message);
            Alert.alert('Network Error', error.message);
        }
    }, [router]);

    return signUp;
}

/**
 * Returns a `signIn(username, password)` callback.
 *
 * On success both JWTs are persisted via saveTokens() and the user is
 * forwarded to the main expenses screen.
 */
export function useSignIn() {
    const router = useRouter();

    const signIn = useCallback(async (username, password) => {
        try {
            const res = await fetch(`${API_BASE}/auth/sign_in`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });
            const data = await res.json();

            if (res.ok) {
                // Persist both tokens so subsequent API calls can attach the access token
                // and the background refresh flow can silently renew it when it expires.
                await saveTokens(data.access_token, data.refresh_token);
                Alert.alert('Success', 'Successfully logging in');
                router.replace('/(tabs)/personal_expenses/expenses');
            } else {
                Alert.alert('Error', data.message || 'Signin failed.');
            }
        } catch (error) {
            console.error('Signin error:', error.message);
            Alert.alert('Network Error', error.message);
        }
    }, [router]);

    return signIn;
}

/**
 * Returns a `signOut()` callback.
 *
 * Token invalidation is client-side only (tokens are deleted from storage).
 * The backend does not maintain a blocklist; the short access-token TTL limits
 * the exposure window for any leaked tokens.
 */
export function useSignOut() {
    const router = useRouter();

    const signOut = useCallback(async () => {
        Alert.alert('Successfully signed out');
        await clearTokens();
        router.replace('/index');
    }, [router]);

    return signOut;
}

/**
 * Returns a `refreshToken()` callback.
 *
 * Attempts to exchange the stored refresh token for a new access token.
 * If no refresh token exists, or if the server rejects it, both tokens are
 * cleared and the user is redirected to the landing screen.
 *
 * This hook is called at the start of every `getData()` invocation in
 * hooks/data.js to ensure the access token is always fresh before a request.
 */
export function useRefreshToken() {
    const router = useRouter();

    const refreshToken = useCallback(async () => {
        const r_token = await getRefreshToken();

        if (!r_token) {
            // No token stored — user has never signed in or already signed out.
            console.log('Error', 'No refresh token found.');
            Alert.alert('Unauthorized', 'Please sign in');
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/auth/refresh`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${r_token}` },
            });
            const data = await res.json();

            if (res.ok) {
                // Keep the existing refresh token; only the access token is rotated.
                saveTokens(data.access_token, r_token);
            } else {
                Alert.alert('Authentication Error', 'You have to sign in again');
                clearTokens();
                router.replace('/index');
            }
        } catch (error) {
            console.error('Token refresh error:', error.message);
            Alert.alert('Network Error', error.message);
        }
    }, [router]);

    return refreshToken;
}