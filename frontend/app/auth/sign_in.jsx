import React, { useState, useContext } from "react";
import { Text, View, TextInput, Button, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from 'expo-router';
import { API_BASE } from "@/constants/api";
import createStyles from "./style";
import { Inter_500Medium, useFonts } from "@expo-google-fonts/inter";
import { ThemeContext } from "@/context/ThemeContext";
import { saveTokens } from "../../constants/authStorage";

export default function SignUpScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter()
  const {colorScheme, setColorScheme, theme} = useContext(ThemeContext)
  const [loaded, error] = useFonts({
        Inter_500Medium,
  })

  if (!loaded && !error) {
        return null
  }

  const styles = createStyles(theme, colorScheme)

  const handleSignIn = async () => {

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

          saveTokens(access_token, refresh_token)

          Alert.alert("Success", "Successfully logging in");
          router.push("/tabs/home_page");
        } else {
          Alert.alert("Error", data.message || "Signin failed.");
        }
        
    } catch (error) {
        console.error("Signin error:", error.message);
        Alert.alert("Network Error", error.message);
    }
  };

  return (
    <SafeAreaView style ={{ flex: 1 }}>
      <View style={{ padding: 20 }}>
        <TextInput
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          style={styles.inputContainer}
        />
        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.inputContainer}
        />
        <Button 
          title="Sign In" 
          onPress={handleSignIn} 
          style = {styles.saveButton}
        />
        <Button 
          title="Sign up" 
          onPress={()=>router.push('/auth/sign_up')} 
          style = {styles.saveButton}
        />
      </View>
    </SafeAreaView>
  );
}