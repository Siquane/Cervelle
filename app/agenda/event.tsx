import { useEffect, useState } from "react";
import { View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { api, errorMessage } from "../../src/api/client";
import { keys, learnerPath, useAgenda, useQueryClient } from "../../src/api/hooks";
import type { EventKind } from "../../src/api/types";
import { BottomSheet } from "../../src/components/bits";
import { Chip } from "../../src/components/Chip";
import { DateField } from "../../src/components/DateField";
import { Field } from "../../src/components/Field";
import { DayPicker, TimeField } from "../../src/components/organize";
import { Button, ErrorBox, Page, Segmented, T, TopBar } from "../../src/components/ui";
import { EVENT_KIND, minutesBetween } from "../../src/lib/agenda";
import { weekdayOf } from "../../src/lib/dates";
import { todayIso } from "../../src/lib/format";
import { useLid } from "../../src/lib/lid";
import { color, space } from "../../src/theme/tokens";

export default function EventForm() {
  const { lid } = useLid();
  const params = useLocalSearchParams<{ id?: string; day?: string }>();
  const agenda = useAgenda(lid);
  const existing = agenda.data?.events.find((e) => e.id === params.id);
  const qc = useQueryClient();
  const startDay = params.day ?? todayIso();

  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<EventKind>("cours");
  const [repeat, setRepeat] = useState<"week" | "once">("week");
  const [weekday, setWeekday] = useState(weekdayOf(startDay));
  const [day, setDay] = useState<string | null>(startDay);
  const [start, setStart] = useState("08:00");
  const [end, setEnd] = useState("09:00");
  const [room, setRoom] = useState("");
  const [confirm, setConfirm] = useState(false);

  useEffect(() => {
    if (!existing) return;
    setTitle(existing.title);
    setKind(existing.kind);
    setRepeat(existing.weekday !== null ? "week" : "once");
    if (existing.weekday !== null) setWeekday(existing.weekday);
    setDay(existing.day ?? startDay);
    setStart(existing.start);
    setEnd(existing.end);
    setRoom(existing.room);
  }, [existing, startDay]);

  const done = () => {
    qc.invalidateQueries({ queryKey: keys.agenda(lid) });
    router.back();
  };
  const save = useMutation({
    mutationFn: () => {
      const body = { title: title.trim(), kind, weekday: repeat === "week" ? weekday : null, day: repeat === "once" ? day : null, start, end, room: room.trim() };
      return existing ? api.patch(`${learnerPath(lid)}/agenda/events/${existing.id}`, body) : api.post(`${learnerPath(lid)}/agenda/events`, body);
    },
    onSuccess: done,
  });
  const remove = useMutation({ mutationFn: () => api.delete(`${learnerPath(lid)}/agenda/events/${existing!.id}`), onSuccess: done });

  const tooShort = minutesBetween(start, end) <= 0;

  return (
    <Page header={<TopBar title={existing ? "Modifier le créneau" : "Nouveau créneau"} />}>
      <Field label="Quoi ?" value={title} onChangeText={setTitle} placeholder="Maths, Anglais, Piscine…" maxLength={60} />
      <View style={{ gap: space.sm }}>
        <T v="bodyBold">Type</T>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
          {(Object.keys(EVENT_KIND) as EventKind[]).map((k) => (
            <Chip key={k} label={EVENT_KIND[k].label} on={kind === k} onPress={() => setKind(k)} />
          ))}
        </View>
      </View>
      <Segmented
        options={[
          { key: "week", label: "Chaque semaine" },
          { key: "once", label: "Une seule fois" },
        ]}
        value={repeat}
        onChange={setRepeat}
      />
      {repeat === "week" ? (
        <View style={{ gap: space.sm }}>
          <T v="bodyBold">Quel jour ?</T>
          <DayPicker value={[weekday]} onChange={(v) => setWeekday(v[0] ?? weekday)} multi={false} />
        </View>
      ) : (
        <DateField label="Quel jour ?" value={day} onChange={setDay} />
      )}
      <View style={{ flexDirection: "row", gap: space.md }}>
        <TimeField label="Début" value={start} onChange={setStart} />
        <TimeField label="Fin" value={end} onChange={setEnd} />
      </View>
      {tooShort ? (
        <T v="small" style={{ color: color.redDark }}>
          La fin doit être après le début.
        </T>
      ) : null}
      <Field label="Salle (facultatif)" value={room} onChangeText={setRoom} placeholder="2-004" maxLength={30} />
      {existing?.source === "passerelle" ? <T v="small">Ce créneau vient du planning familial : la prochaine synchronisation le remettra comme dans Passerelle.</T> : null}
      {save.error ? <ErrorBox message={errorMessage(save.error)} /> : null}
      <Button label="Enregistrer" icon="checkmark" loading={save.isPending} disabled={!title.trim() || tooShort || (repeat === "once" && !day)} onPress={() => save.mutate()} />
      {existing ? <Button tone="ghost" icon="trash" label="Supprimer ce créneau" onPress={() => setConfirm(true)} /> : null}
      <BottomSheet open={confirm} onClose={() => setConfirm(false)} title="Supprimer ce créneau ?">
        {remove.error ? <ErrorBox message={errorMessage(remove.error)} /> : null}
        <Button tone="danger" icon="trash" label="Supprimer" loading={remove.isPending} onPress={() => remove.mutate()} />
        <Button tone="white" label="Annuler" onPress={() => setConfirm(false)} />
      </BottomSheet>
    </Page>
  );
}
