import { useEffect, useRef } from "react";
import { Alert, AppState } from "react-native";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import { api } from "../../../src/api/client";
import { learnerPath, useFriends, useHome, useRefreshLearner } from "../../../src/api/hooks";
import type { FocusResult } from "../../../src/api/types";
import { useLid } from "../../../src/lib/lid";
import { useChildNotifications } from "../../../src/lib/notifications";
import { useTimer } from "../../../src/state/timer";
import { color, font } from "../../../src/theme/tokens";

type IconName = keyof typeof Ionicons.glyphMap;

const TABS: { name: string; title: string; icon: IconName; on: IconName }[] = [
  { name: "index", title: "Accueil", icon: "home-outline", on: "home" },
  { name: "agenda", title: "Agenda", icon: "calendar-outline", on: "calendar" },
  { name: "minuteur", title: "Minuteur", icon: "timer-outline", on: "timer" },
  { name: "progres", title: "Progrès", icon: "stats-chart-outline", on: "stats-chart" },
  { name: "amis", title: "Amis", icon: "people-outline", on: "people" },
];

/** Ends the timer's phase when its time is up, whichever tab is open. */
function useTimerWatcher(lid: string) {
  const home = useHome(lid);
  const refresh = useRefreshLearner(lid);
  const busy = useRef(false);
  const finish = useMutation({
    mutationFn: (body: { seconds: number; label: string; revisionId: string | null; todoId: string | null }) => api.post<FocusResult>(`${learnerPath(lid)}/focus`, body),
    onSuccess: () => refresh(),
  });

  useEffect(() => {
    const check = () => {
      const t = useTimer.getState();
      if (busy.current || !t.running || !t.endsAt || t.endsAt > Date.now()) return;
      busy.current = true;
      const pause = home.data?.learner.timer.pause ?? 5;
      if (t.phase === "focus") {
        const target = t.target;
        const seconds = t.stop();
        finish.mutate(
          { seconds, label: target.label, revisionId: target.revisionId, todoId: target.todoId },
          {
            onSettled: (r, err) => {
              busy.current = false;
              const gain = r && r.coins > 0 ? ` +${r.coins} pièces.` : "";
              const grew = r?.levelUp ? ` Cervelle passe au niveau ${r.levelUp.level} !` : "";
              Alert.alert(
                "Séance terminée !",
                err ? "Ta séance n'a pas pu être enregistrée. Vérifie ta connexion." : `Bravo, ${Math.round(seconds / 60)} minutes de travail.${gain}${grew}`,
                [
                  { text: "Plus tard", style: "cancel" },
                  { text: `Pause de ${pause} min`, onPress: () => useTimer.getState().startPause(pause) },
                ],
              );
            },
          },
        );
      } else {
        t.stop();
        busy.current = false;
        Alert.alert("La pause est finie", "On repart pour une séance ?");
      }
    };
    const id = setInterval(check, 1000);
    const sub = AppState.addEventListener("change", (s) => s === "active" && check());
    return () => {
      clearInterval(id);
      sub.remove();
    };
  }, [finish, home.data?.learner.timer.pause]);
}

export default function ChildTabs() {
  const { lid } = useLid();
  useTimerWatcher(lid);
  useChildNotifications(lid);
  const friends = useFriends(lid);
  const news = (friends.data?.cheers.length ?? 0) + (friends.data?.challenges.filter((c) => c.status === "pending" && !c.sentByMe).length ?? 0);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: color.brand,
        tabBarInactiveTintColor: color.muted,
        tabBarLabelStyle: { fontFamily: font.textBold, fontSize: 12 },
        tabBarStyle: { backgroundColor: color.card, borderTopColor: color.line, borderTopWidth: 2, height: 64, paddingTop: 6 },
        sceneStyle: { backgroundColor: color.bg },
      }}
    >
      {TABS.map((t) => (
        <Tabs.Screen
          key={t.name}
          name={t.name}
          options={{
            title: t.title,
            tabBarIcon: ({ focused, color: c }) => <Ionicons name={focused ? t.on : t.icon} size={26} color={c as string} />,
            tabBarBadge: t.name === "amis" && news > 0 ? news : undefined,
            tabBarBadgeStyle: { backgroundColor: color.brand, fontFamily: font.textBlack },
          }}
        />
      ))}
    </Tabs>
  );
}
