import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
} from "react-native";
import { ThemeContext } from "@/context/ThemeContext";
import { useRouter } from "expo-router";

export default function SignUpScreen() {
  const { theme, colorScheme } = useContext(ThemeContext);
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const rules = {
    minLength: password.length >= 8,
    hasNumber: /\d/.test(password),
    hasUppercase: /[A-Z]/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    matchesConfirm: password === confirm && password.length > 0,
  };

  const renderRule = (label, passed) => (
    <Text style={{ color: passed ? "green" : "red", marginBottom: 2 }}>
      {passed ? "✔" : "✖"} {label}
    </Text>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#ffde1a' }}>
      {/* Top Illustration */}
      <View style={styles.imageContainer}>
        <Image
          source={require("@/assets/images/sign-up-image.png")}
          style={styles.image}
          resizeMode="contain"
        />
      </View>

      {/* Scrollable Card Form */}
      <View style={styles.card}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Create account</Text>

          <TextInput
            placeholder="Username"
            value={username}
            onChangeText={setUsername}
            style={styles.input}
            placeholderTextColor="#888"
            autoCapitalize="none"
          />

          <TextInput
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
            placeholderTextColor="#888"
          />

          <TextInput
            placeholder="Confirm Password"
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
            style={styles.input}
            placeholderTextColor="#888"
          />

          {/* Password Rules */}
          <View style={{ marginBottom: 10 }}>
            {renderRule("At least 8 characters", rules.minLength)}
            {renderRule("Contains a number", rules.hasNumber)}
            {renderRule("Contains a capital letter", rules.hasUppercase)}
            {renderRule("Contains a special character", rules.hasSpecialChar)}
            {renderRule("Passwords match", rules.matchesConfirm)}
          </View>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.button }]}
            onPress={() => console.log("Sign up")}
            disabled={Object.values(rules).some((v) => !v)}
          >
            <Text
              style={[
                styles.buttonText,
                { color: 'black' },
              ]}
            >
              Sign Up
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push("/auth/sign_in")}>
            <Text style={styles.footerText}>
              Already have an account?{" "}
              <Text style={styles.link}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  imageContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 5,
  },
  image: {
    width: 240,
    height: 240,
  },
  card: {
    flex: 2.25,
    backgroundColor: "#fff",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    paddingBottom: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 6,
  },
  title: {
    fontSize: 24,
    fontFamily: "Poppins_700Bold",
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#f5f5f5",
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
});
