import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClientProvider } from "@tanstack/react-query";
import * as SplashScreen from "expo-splash-screen";
import * as SystemUI from "expo-system-ui";
import * as Updates from "expo-updates";
import { useFonts } from "expo-font";
import { Outfit_600SemiBold, Outfit_700Bold } from "@expo-google-fonts/outfit";
import { AtkinsonHyperlegible_400Regular, AtkinsonHyperlegible_700Bold } from "@expo-google-fonts/atkinson-hyperlegible";
import { useReading } from "../src/state/reading";
import { queryClient } from "../src/api/hooks";
import { clearNotifications } from "../src/lib/notifications";
import { API_URL, useSession } from "../src/state/session";
import { color, scheme } from "../src/theme/tokens";

SplashScreen.preventAutoHideAsync().catch(() => {});
SystemUI.setBackgroundColorAsync(color.bg).catch(() => {});

export default function RootLayout() {
  const [fonts] = useFonts({
    Outfit_600SemiBold,
    Outfit_700Bold,
    AtkinsonHyperlegible_400Regular,
    AtkinsonHyperlegible_700Bold,
    // Option « Police pour la dyslexie ».
    OpenDyslexic: require("../assets/fonts/OpenDyslexic-Regular.ttf"),
    OpenDyslexic_Bold: require("../assets/fonts/OpenDyslexic-Bold.ttf"),
  });
  const readingLoaded = useReading((s) => s.loaded);
  const loadReading = useReading((s) => s.load);
  const hydrated = useSession((s) => s.hydrated);
  const hydrate = useSession((s) => s.hydrate);
  const signedIn = useSession((s) => !!s.session);

  useEffect(() => {
    hydrate();
    loadReading();
    // Wake the free-plan server while the app opens.
    fetch(`${API_URL}/health`).catch(() => {});
    // Install a JavaScript update published since this APK was built, at the next opening.
    if (!__DEV__) Updates.checkForUpdateAsync().then((r) => (r.isAvailable ? Updates.fetchUpdateAsync() : null)).catch(() => {});
  }, [hydrate, loadReading]);

  useEffect(() => {
    if (fonts && hydrated && readingLoaded) SplashScreen.hideAsync().catch(() => {});
  }, [fonts, hydrated, readingLoaded]);

  // Signed out (or the phone was unlinked): forget everything cached for the previous user.
  useEffect(() => {
    if (!signedIn) {
      queryClient.clear();
      void clearNotifications();
    }
  }, [signedIn]);

  if (!fonts || !hydrated || !readingLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: color.bg }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style={scheme === "dark" ? "light" : "dark"} />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.bg }, animation: "slide_from_right" }} />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
