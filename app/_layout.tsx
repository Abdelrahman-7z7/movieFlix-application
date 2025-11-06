import "react-native-url-polyfill/auto";
import { Stack } from "expo-router";
import "./globals.css";
import { StatusBar } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar
        hidden={true}
        backgroundColor="#030014"
        barStyle="light-content"
        translucent={true}
      />

      <SafeAreaView
        style={{ flex: 1, backgroundColor: "#030014" }}
        edges={["top", "left", "right"]}
      >
        <Stack
          screenOptions={{
            headerShown: false,
          }}
          initialRouteName="(tabs)"
        >
          <Stack.Screen
            name="(tabs)"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="movie/[id]"
            options={{
              headerShown: false,
            }}
          />
        </Stack>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}