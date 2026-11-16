import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClientProvider } from "@tanstack/react-query";
import * as SplashScreen from "expo-splash-screen";
import * as SystemUI from "expo-system-ui";
import * as Updates from "expo-updates";
import { useFonts, Baloo2_700Bold, Baloo2_800ExtraBold } from "@expo-google-fonts/baloo-2";
import { Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold, Nunito_800ExtraBold } from "@expo-google-fonts/nunito";
import { queryClient } from "../src/api/hooks";
import { API_URL, useSession } from "../src/state/session";
import { color } from "../src/theme/tokens";

SplashScreen.preventAutoHideAsync().catch(() => {});
SystemUI.setBackgroundColorAsync(color.bg).catch(() => {});

export default function RootLayout() {
  const [fonts] = useFonts({ Baloo2_700Bold, Baloo2_800ExtraBold, Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold, Nunito_800ExtraBold });
  const hydrated = useSession((s) => s.hydrated);
  const hydrate = useSession((s) => s.hydrate);
  const signedIn = useSession((s) => !!s.session);

  useEffect(() => {
    hydrate();
    // Wake the free-plan server while the app opens.
    fetch(`${API_URL}/health`).catch(() => {});
    // Install a JavaScript update published since this APK was built, at the next opening.
    if (!__DEV__) Updates.checkForUpdateAsync().then((r) => (r.isAvailable ? Updates.fetchUpdateAsync() : null)).catch(() => {});
  }, [hydrate]);

  useEffect(() => {
    if (fonts && hydrated) SplashScreen.hideAsync().catch(() => {});
  }, [fonts, hydrated]);

  // Signed out (or the phone was unlinked): forget everything cached for the previous user.
  useEffect(() => {
    if (!signedIn) queryClient.clear();
  }, [signedIn]);

  if (!fonts || !hydrated) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: color.bg }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.bg }, animation: "slide_from_right" }} />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
