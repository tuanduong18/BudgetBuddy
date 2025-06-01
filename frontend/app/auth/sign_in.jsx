import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image } from "react-native";
import { useRouter } from "expo-router";
import { useSignIn } from "@/hooks/auth";
import { GlobalStyles as GS } from "@/constants/GlobalStyles";


export default function SignInScreen() {

  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const signIn = useSignIn();

  return (
    <View style={local.container}>
      <Text style={GS.title}>Welcome back!</Text>

      <Text style={[GS.footerText, { textAlign: 'center' }]}>
        Just made one transaction?{"\n"}Log it in to get your budget started!
      </Text>

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

      <TouchableOpacity
        style={local.button}
        onPress={() => signIn(username, password)}
      >
        <Text style={GS.buttonText}>
          Sign In
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.replace("/auth/sign_up")}>
        <Text style={GS.footerText}>
          Don’t have an account yet? <Text style={local.link}>Sign Up</Text>
        </Text>
      </TouchableOpacity>

      <Image
        source={require("@/assets/images/sign-in-image.png")}
        style={local.image}
        resizeMode="contain"
      />
      
    </View>
  );
}

const local = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "flex-start", // move content to the bottom
    alignItems: "center",
    paddingTop: 90,               // adjust image top position
    backgroundColor: "transparent",
  },
  image: {
    width: 250,
    height: 250,
    marginTop: 40,              // space above image
    alignSelf: 'center',        // center the image
  },
  subtitleSpacing: {
    marginBottom: 30,           // space between subtitle and buttons
  },
  legalText: {
    fontSize: 12,
    textAlign: 'center',
    fontFamily: 'Inter_400Regular',
    color: '#888',
    marginTop: 20,
  },
  link: {
    textDecorationLine: 'underline',
    color: '#88888',
    fontWeight: 'bold'
  },
  button: {
    paddingVertical: 13,
    paddingHorizontal: 100,
    borderRadius: 20,
    alignItems: 'center',
    backgroundColor: '#ffde1a',
    borderColor: '#000',
    borderWidth: 1,
    marginBottom: 16,
    alignSelf: 'center',
  }
});