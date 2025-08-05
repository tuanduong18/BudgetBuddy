import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useSignUp } from "@/hooks/auth";
import { GlobalStyles as GS } from "@/constants/GlobalStyles";

export default function SignUpScreen() {

  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const signUp = useSignUp();
  
  const rules = {
    minLength: password.length >= 8,
    hasNumber: /\d/.test(password),
    hasUppercase: /[A-Z]/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    matchesConfirm: password === confirm && password.length > 0,
  };

  const handleSignUp = async () => {
    const allRulesPass = Object.values(rules).every(v => v);

    if (!allRulesPass) {
      return Alert.alert(
        "Weak password",
        "Make sure it’s at least 8 chars, has a number, uppercase, special char, and matches confirmation."
      );
    }
    if (!password || !username) {
      Alert.alert("Signup failed", "Missing values")
      return
    }
    if (password != confirm) {
      Alert.alert("Signup failed", "Confirm password must be the same as password")
      return
    }
    signUp(username, password);
  }

  const renderRule = (label, passed) => (
    <Text style={{ color: passed ? "green" : "red", marginBottom: 2 }}>
      {passed ? "✔" : "✖"} {label}
    </Text>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#ffde1a' }}>
      {/* Top Illustration */}
      <View style={local.imageContainer}>
        <Image
          source={require("@/assets/images/sign-up-image.png")}
          style={local.image}
          resizeMode="contain"
        />
      </View>

      {/* Scrollable Card Form */}
      <View style={local.card}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={GS.title}>Create account</Text>

          <TextInput
            placeholder="Username"
            value={username}
            onChangeText={setUsername}
            style={GS.input}
            placeholderTextColor="#888"
            autoCapitalize="none"
          />

          <TextInput
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={GS.input}
            placeholderTextColor="#888"
          />

          <TextInput
            placeholder="Confirm Password"
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
            style={GS.input}
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
            style={GS.button}
            onPress={handleSignUp}
            disabled={Object.values(rules).some((v) => !v)}
          >
            <Text
              style={GS.buttonText}
            >
              Sign Up
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.replace("/auth/sign_in")}>
            <View
            style={{
              flexDirection: 'row',
              justifyContent:'center',
            }}> 
              <Text style={GS.footerText}>
                Already have an account? {" "}
              </Text>
              <Text style={GS.link}>Sign In</Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
}

const local = StyleSheet.create({
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
});
