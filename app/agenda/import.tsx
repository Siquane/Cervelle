import { useState } from "react";
import { Alert, Image, Pressable, Switch, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import { api, errorMessage } from "../../src/api/client";
import { keys, learnerPath, useQueryClient } from "../../src/api/hooks";
import type { TimetableSlot } from "../../src/api/types";
import { Mascot } from "../../src/components/mascot/Mascot";
import { Check } from "../../src/components/organize";
import { Button, Card, ErrorBox, Page, T, TopBar } from "../../src/components/ui";
import { WEEKDAYS } from "../../src/lib/dates";
import { PermissionDenied, pickPhotos, type PickedPage } from "../../src/lib/files";
import { useLid } from "../../src/lib/lid";
import { color, radius, space } from "../../src/theme/tokens";

const MAX = 3;

export default function ImportTimetable() {
  const { lid } = useLid();
  const qc = useQueryClient();
  const [pages, setPages] = useState<PickedPage[]>([]);
  const [slots, setSlots] = useState<(TimetableSlot & { keep: boolean })[] | null>(null);
  const [replace, setReplace] = useState(true);

  async function add(source: "camera" | "library") {
    try {
      const picked = await pickPhotos(source, MAX - pages.length);
      setPages((p) => [...p, ...picked].slice(0, MAX));
    } catch (e) {
      Alert.alert(e instanceof PermissionDenied ? "Autorisation" : "Photo", errorMessage(e));
    }
  }

  const read = useMutation({
    mutationFn: () => api.post<{ slots: TimetableSlot[] }>(`${learnerPath(lid)}/agenda/timetable`, { files: pages.map(({ data, mimeType }) => ({ data, mimeType })) }),
    onSuccess: (r) => setSlots(r.slots.map((s) => ({ ...s, keep: true }))),
  });
  const save = useMutation({
    mutationFn: () =>
      api.post<{ created: number }>(`${learnerPath(lid)}/agenda/events/bulk`, {
        replace,
        events: slots!.filter((s) => s.keep).map(({ keep: _keep, ...s }) => ({ ...s, kind: "cours" })),
      }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: keys.agenda(lid) });
      Alert.alert("C'est fait !", `${r.created} cours ajoutés à ton agenda.`);
      router.back();
    },
  });

  const kept = slots?.filter((s) => s.keep).length ?? 0;

  return (
    <Page header={<TopBar title="Mon emploi du temps" />}>
      {!slots ? (
        <>
          <View style={{ flexDirection: "row", gap: space.md, alignItems: "center" }}>
            <Mascot size={80} mood="wow" />
            <T v="body" style={{ flex: 1 }}>
              Prends ton emploi du temps en photo, bien à plat. Cervelle le lit et range tes cours dans ton agenda.
            </T>
          </View>
          {pages.length ? (
            <View style={{ flexDirection: "row", gap: space.sm }}>
              {pages.map((p, i) => (
                <View key={`${p.uri}-${i}`} style={{ width: 96, height: 128, borderRadius: radius.md, overflow: "hidden", borderWidth: 2, borderColor: color.line }}>
                  <Image source={{ uri: p.uri }} style={{ width: "100%", height: "100%" }} accessibilityLabel={`Photo ${i + 1}`} />
                  <Pressable accessibilityRole="button" accessibilityLabel={`Retirer la photo ${i + 1}`} onPress={() => setPages((all) => all.filter((_, j) => j !== i))} style={{ position: "absolute", top: 4, right: 4, backgroundColor: color.white, borderRadius: 14 }}>
                    <Ionicons name="close-circle" size={26} color={color.ink} />
                  </Pressable>
                </View>
              ))}
            </View>
          ) : null}
          {pages.length < MAX ? (
            <View style={{ flexDirection: "row", gap: space.md }}>
              <Button tone={pages.length ? "white" : "brand"} icon="camera" label="Photo" onPress={() => add("camera")} style={{ flex: 1 }} />
              <Button tone="white" icon="images" label="Galerie" onPress={() => add("library")} style={{ flex: 1 }} />
            </View>
          ) : null}
          {read.error ? <ErrorBox message={errorMessage(read.error)} /> : null}
          <Button label="Lire mon emploi du temps" icon="sparkles" disabled={!pages.length} loading={read.isPending} onPress={() => read.mutate()} />
          {read.isPending ? (
            <T v="small" style={{ textAlign: "center" }}>
              Cervelle lit ta photo… ça prend quelques secondes.
            </T>
          ) : null}
        </>
      ) : (
        <>
          <T v="body">Vérifie les cours trouvés. Décoche ceux qui sont faux, tu pourras tout modifier ensuite dans l'agenda.</T>
          {WEEKDAYS.map((name, wd) => {
            const ofDay = slots.map((s, i) => ({ s, i })).filter(({ s }) => s.weekday === wd);
            if (!ofDay.length) return null;
            return (
              <Card key={name} style={{ gap: space.sm }}>
                <T v="h3">{name}</T>
                {ofDay.map(({ s, i }) => (
                  <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
                    <Check on={s.keep} label={`${s.title} ${s.start}`} onPress={() => setSlots((all) => all!.map((x, j) => (j === i ? { ...x, keep: !x.keep } : x)))} />
                    <T v="bodyBold" style={{ width: 104, fontVariant: ["tabular-nums"] }}>
                      {s.start} – {s.end}
                    </T>
                    <T v="body" numberOfLines={1} style={{ flex: 1, color: s.keep ? color.ink : color.faint }}>
                      {s.title}
                      {s.room ? ` · ${s.room}` : ""}
                    </T>
                  </View>
                ))}
              </Card>
            );
          })}
          <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
            <T v="body" style={{ flex: 1 }}>
              Remplacer mon ancien emploi du temps
            </T>
            <Switch value={replace} onValueChange={setReplace} trackColor={{ true: color.brand, false: color.line }} accessibilityLabel="Remplacer mon ancien emploi du temps" />
          </View>
          {save.error ? <ErrorBox message={errorMessage(save.error)} /> : null}
          <Button label={`Ajouter ${kept} cours`} icon="checkmark" disabled={!kept} loading={save.isPending} onPress={() => save.mutate()} />
          <Button tone="ghost" label="Reprendre la photo" onPress={() => setSlots(null)} />
        </>
      )}
    </Page>
  );
}
