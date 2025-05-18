import React, { useState, useContext } from "react";
import { Text, View, TextInput, Button, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from 'expo-router';
import { API_BASE } from "@/constants/api";
import createStyles from "./style";
import { Inter_500Medium, useFonts } from "@expo-google-fonts/inter";
import { ThemeContext } from "@/context/ThemeContext";

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

  const validatePasswordRules = (password) => ({
    minLength: password.length >= 6,
    maxLength: password.length <= 100,
    hasNumber: /\d/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasUppercase: /[A-Z]/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  });

  const renderRule = (label, passed) => (
    <Text style={{ color: passed ? "green" : "red" }}>{passed ? "✔" : "✖"} {label}</Text>
  );

  const handleSignUp = async () => {
    const passwordRules = validatePasswordRules(password);
    const allPassed = Object.values(passwordRules).every(Boolean);

    if (!allPassed) {
      Alert.alert("Password Invalid", "Please make sure all password requirements are met.");
      return;
    }

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
        Alert.alert("Error", data.message || "Signup failed.");
        }
        
    } catch (error) {
        console.error("Signup error:", error.message);
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
        <View style={{ marginBottom: 10 }}>
        {(() => {
          const passwordRules = validatePasswordRules(password);
          return (
            <>
              {renderRule("At least 6 characters", passwordRules.minLength)}
              {renderRule("No more than 100 characters", passwordRules.maxLength)}
              {renderRule("Contains a number", passwordRules.hasNumber)}
              {renderRule("Contains a lowercase letter", passwordRules.hasLowercase)}
              {renderRule("Contains an uppercase letter", passwordRules.hasUppercase)}
              {renderRule("Contains a special character", passwordRules.hasSpecialChar)}
            </>
          );
        })()}
      </View>
        <Button 
          title="Sign Up" 
          onPress={handleSignUp} 
          style = {styles.saveButton}
        />
        <Button 
          title="Sign In" 
          onPress={()=>router.push('/auth/sign_in')} 
          style = {styles.saveButton}
        />
      </View>
    </SafeAreaView>
  );
}