import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
  <Stack initialRouteName="index" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
    );
}