import React, { useContext } from "react";
import { useRouter } from 'expo-router';
import { API_BASE } from "@/constants/api";
import { Button, Alert } from "react-native";
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import createStyles from "./style";
import { Inter_500Medium, useFonts } from "@expo-google-fonts/inter";
import { ThemeContext } from "@/context/ThemeContext";
import { getAccessToken, getRefreshToken, clearTokens } from "../../constants/authStorage";

export default function NotFoundScreen() {
    const router = useRouter()
    const {colorScheme, setColorScheme, theme} = useContext(ThemeContext)
    const [loaded, error] = useFonts({
        Inter_500Medium,
    })

    if (!loaded && !error) {
        return null
    }

    const styles = createStyles(theme, colorScheme)

    const handleSignOut = async () => {
        
        const tokenn = await getAccessToken()
        
        if (!tokenn) {
            console.log("Error", "No access token found.")
            Alert.alert("Error", "No access token found.");
            return;
        }
        
        try {
            const res = await fetch(`${API_BASE}/auth/sign_out`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${tokenn}`,
                   
                },
            });
            
            const data = await res.json()
            if (res.ok) {
                
            Alert.alert("Successfully signed out", data.message);
            clearTokens()
            router.push("/index");
            } else {
            Alert.alert("Error", data.message || "Signout failed.");
            }
            
        } catch (error) {
            console.error("Signout error:", error.message);
            Alert.alert("Network Error", error.message);
        }
    };
    return (
        <>
        <ThemedView style={styles.container}>
            <ThemedText type="title">Coming soon.</ThemedText>
            <Button 
                    title="Sign out" 
                    onPress={handleSignOut} 
                    style = {styles.saveButton}
            />
        </ThemedView>
        </>
    );
}

