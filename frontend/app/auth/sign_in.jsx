import React, { useState, useContext } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image } from "react-native";
import { ThemeContext } from "@/context/ThemeContext";
import { useRouter } from "expo-router";

export default function SignInScreen() {
  const { theme, colorScheme } = useContext(ThemeContext);
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  return (
    <View style={styles.screen}>
      <Text style={[styles.title, { color: theme.text }]}>Welcome back!</Text>

      <Text style={[styles.subtitle, { color: theme.text }]}>
        Just made one transaction?{"\n"}Log it in to get your budget started!
      </Text>

      <TextInput
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        style={[styles.input, { color: theme.text }]}
        placeholderTextColor="#888"
        autoCapitalize="none"
      />

      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={[styles.input, { color: theme.text }]}
        placeholderTextColor="#888"
      />

      <TouchableOpacity
        style={[styles.button, { backgroundColor: theme.button }]}
        onPress={() => console.log("Sign in")}
      >
        <Text style={[styles.buttonText, { color: 'black' }]}>
          Sign In
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/auth/sign_up")}>
        <Text style={[styles.footerText, { color: theme.text }]}>
          Don’t have an account yet? <Text style={styles.link}>Sign Up</Text>
        </Text>
      </TouchableOpacity>

      <Image
        source={require("@/assets/images/sign-in-image.png")}
        style={{ width: "100%", height: 250, marginTop: 50 }}
        resizeMode="contain"
      />
      
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: 26,
    fontFamily: "Poppins_700Bold",
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
    marginBottom: 15,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  button: {
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  footerText: {
    fontSize: 14,
    textAlign: "center",
    fontFamily: "Inter_400Regular",
  },
  link: {
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 22,
  },
});
