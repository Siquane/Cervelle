import { useEffect, useState } from "react";
import { AppState, Linking, Switch, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { TimeField } from "../src/components/organize";
import { Button, Card, Page, Segmented, T, TopBar } from "../src/components/ui";
import { askPermission, notificationsAllowed, useReminderPrefs } from "../src/lib/notifications";
import { EVE_HOUR, type ReminderPrefs } from "../src/lib/reminders";
import { useReading } from "../src/state/reading";
import { useSession } from "../src/state/session";
import { color, scheme, space, type Scheme } from "../src/theme/tokens";
import { setScheme } from "../src/state/theme";

type Key = "exams" | "review" | "ready";

const ROWS: { key: Key; icon: keyof typeof Ionicons.glyphMap; title: string; text: (p: ReminderPrefs) => string }[] = [
  { key: "exams", icon: "calendar", title: "Mes interros", text: (p) => `3 jours avant, à ${p.time}. Et la veille à ${EVE_HOUR} h, avec une révision express.` },
  { key: "review", icon: "refresh-circle", title: "Mes notions à revoir", text: (p) => `Chaque jour à ${p.time}, s'il y a des notions à revoir.` },
  { key: "ready", icon: "sparkles", title: "Fiches prêtes", text: () => "Quand Cervelle a fini de préparer tes fiches." },
];

function Row({ icon, title, text, value, onChange }: { icon: keyof typeof Ionicons.glyphMap; title: string; text: string; value: boolean; onChange: (on: boolean) => void }) {
  return (
    <Card style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
      <Ionicons name={icon} size={30} color={color.brand} />
      <View style={{ flex: 1, gap: 2 }}>
        <T v="bodyBold">{title}</T>
        <T v="small">{text}</T>
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: color.brand, false: color.line }} thumbColor={color.white} accessibilityLabel={title} />
    </Card>
  );
}

/** Les rappels de l'enfant (sur son téléphone) et la police de lecture. */
function Reminders() {
  const prefs = useReminderPrefs((s) => s.prefs);
  const load = useReminderPrefs((s) => s.load);
  const update = useReminderPrefs((s) => s.update);
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    void load();
    const check = () => notificationsAllowed().then(setAllowed);
    check();
    // Retour des réglages du téléphone.
    const sub = AppState.addEventListener("change", (s) => s === "active" && check());
    return () => sub.remove();
  }, [load]);

  const toggle = async (key: Key, on: boolean) => {
    if (on && !(await askPermission(true))) {
      setAllowed(false);
      return;
    }
    setAllowed(await notificationsAllowed());
    await update({ [key]: on });
  };

  return (
    <>
      <T v="label">Mes rappels</T>
      {allowed === false ? (
        <Card style={{ gap: space.sm, backgroundColor: color.sunSoft, borderColor: color.sun }}>
          <T v="bodyBold">Les notifications sont coupées sur ce téléphone.</T>
          <T v="body">Pour recevoir tes rappels, autorise les notifications de Cervelle dans les réglages du téléphone.</T>
          <Button tone="white" small icon="settings" label="Ouvrir les réglages" onPress={() => Linking.openSettings()} />
        </Card>
      ) : null}
      {ROWS.map((r) => (
        <Row key={r.key} icon={r.icon} title={r.title} text={r.text(prefs)} value={prefs[r.key] && allowed !== false} onChange={(on) => void toggle(r.key, on)} />
      ))}
      <TimeField label="Heure de mes rappels" value={prefs.time} onChange={(time) => void update({ time })} />
    </>
  );
}

export default function Reglages() {
  const child = useSession((s) => s.session?.kind === "child");
  const dyslexia = useReading((s) => s.dyslexia);
  const setDyslexia = useReading((s) => s.setDyslexia);

  return (
    <Page header={<TopBar title="Réglages" />}>
      {child ? <Reminders /> : null}

      <T v="label">Apparence</T>
      <Card style={{ gap: space.md }}>
        <T v="bodyBold">Thème</T>
        <Segmented<Scheme>
          options={[
            { key: "dark", label: "Sombre" },
            { key: "light", label: "Clair" },
          ]}
          value={scheme}
          onChange={(k) => void setScheme(k)}
        />
        <T v="small">L'appli redémarre pour changer de thème. Réglage de ce téléphone.</T>
      </Card>

      <T v="label">Lecture</T>
      <Row
        icon="text"
        title="Police pour la dyslexie"
        text="Une écriture pensée pour les lecteurs dyslexiques, avec plus d'espace entre les lignes. Seulement sur ce téléphone."
        value={dyslexia}
        onChange={(on) => void setDyslexia(on)}
      />
      <Card style={{ gap: space.sm }}>
        <T v="small">Exemple</T>
        <T v="bodyBold">La Révolution française</T>
        <T v="body">En 1789, les députés du tiers état se proclament Assemblée nationale. Le 14 juillet, le peuple de Paris prend la Bastille.</T>
      </Card>
    </Page>
  );
}
