import { Stack } from "expo-router";

export default function RootLayout() {
  <Stack screenOptions={{ headerShown: false }}>
    <Stack.Screen name="login" />
    <Stack.Screen name="signup" />
  </Stack>;
}
