import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
  <Stack initialRouteName="allLimits" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="allLimits" />
      <Stack.Screen name="add"      />
      <Stack.Screen name="update"    options={{ title: 'Update Expense'  }} />
    </Stack>
    );
}