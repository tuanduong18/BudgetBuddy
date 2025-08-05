import { Stack } from "expo-router";

export default function AuthLayout() {
  return (<Stack
      initialRouteName="allReminders"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="allReminders"
      />

      <Stack.Screen
        name="add"
      />
      
      <Stack.Screen
        name="update"
      />
    </Stack>)
}