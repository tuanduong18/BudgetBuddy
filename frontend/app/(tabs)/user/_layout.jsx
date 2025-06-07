import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
  <Stack initialRouteName="profile" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="profile" />
      <Stack.Screen name="saveCurrency"      />
    </Stack>);
}