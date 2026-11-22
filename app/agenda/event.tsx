import { useEffect, useState } from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { api, errorMessage } from "../../src/api/client";
import { keys, learnerPath, useAgenda, useQueryClient } from "../../src/api/hooks";
import type { AgendaEvent, EventKind } from "../../src/api/types";
import { BottomSheet } from "../../src/components/bits";
import { Chip } from "../../src/components/Chip";
import { DateField } from "../../src/components/DateField";
import { Field } from "../../src/components/Field";
import { DayPicker, TimeField } from "../../src/components/organize";
import { Button, ErrorBox, Page, Segmented, T, TopBar } from "../../src/components/ui";
import { EVENT_KIND, minutesBetween, styleOf } from "../../src/lib/agenda";
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
  // Plusieurs jours possibles : un créneau par jour coché (ex. les cours du lundi au vendredi).
  const [weekdays, setWeekdays] = useState<number[]>([weekdayOf(startDay)]);
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
    if (existing.weekday !== null) setWeekdays([existing.weekday]);
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
    mutationFn: async () => {
      const base = { title: title.trim(), kind, start, end, room: room.trim() };
      const url = `${learnerPath(lid)}/agenda/events`;
      if (repeat === "once") {
        const body = { ...base, weekday: null, day };
        return existing ? api.patch(`${url}/${existing.id}`, body) : api.post(url, body);
      }
      // Le créneau modifié garde son jour s'il est encore coché ; chaque autre jour coché devient un nouveau créneau.
      const keep = existing ? (existing.weekday !== null && weekdays.includes(existing.weekday) ? existing.weekday : weekdays[0]) : null;
      if (existing) await api.patch(`${url}/${existing.id}`, { ...base, weekday: keep, day: null });
      for (const wd of weekdays.filter((w) => w !== keep)) await api.post(url, { ...base, weekday: wd, day: null });
    },
    onSuccess: done,
  });
  const remove = useMutation({ mutationFn: () => api.delete(`${learnerPath(lid)}/agenda/events/${existing!.id}`), onSuccess: done });

  const tooShort = minutesBetween(start, end) <= 0;

  return (
    <Page header={<TopBar title={existing ? "Modifier" : "Ajouter à l'agenda"} />}>
      <Field label="Quoi ?" value={title} onChangeText={setTitle} placeholder="Maths, Anglais, Piscine…" maxLength={60} />
      {existing?.source === "passerelle" ? (
        <View style={{ gap: space.sm }}>
          <T v="bodyBold">Catégorie</T>
          <PasserelleCategory event={existing} />
        </View>
      ) : (
        <View style={{ gap: space.sm }}>
          <T v="bodyBold">Type</T>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
            {(Object.keys(EVENT_KIND) as EventKind[]).map((k) => (
              <Chip key={k} label={EVENT_KIND[k].label} on={kind === k} onPress={() => setKind(k)} />
            ))}
          </View>
        </View>
      )}
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
          <T v="bodyBold">Quels jours ?</T>
          <DayPicker value={weekdays} onChange={(v) => v.length && setWeekdays(v)} />
          {weekdays.length > 1 ? <T v="small">Un créneau sera ajouté pour chaque jour coché.</T> : null}
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
      {existing?.source === "passerelle" ? <T v="small">Ceci vient du planning familial. Sa catégorie se change dans Passerelle ; la prochaine synchronisation remettra tout comme dans Passerelle.</T> : null}
      {save.error ? <ErrorBox message={errorMessage(save.error)} /> : null}
      <Button label="Enregistrer" icon="checkmark" loading={save.isPending} disabled={!title.trim() || tooShort || (repeat === "once" && !day)} onPress={() => save.mutate()} />
      {existing ? <Button tone="ghost" icon="trash" label="Supprimer de l'agenda" onPress={() => setConfirm(true)} /> : null}
      <BottomSheet open={confirm} onClose={() => setConfirm(false)} title="Supprimer de l'agenda ?">
        {remove.error ? <ErrorBox message={errorMessage(remove.error)} /> : null}
        <Button tone="danger" icon="trash" label="Supprimer" loading={remove.isPending} onPress={() => remove.mutate()} />
        <Button tone="white" label="Annuler" onPress={() => setConfirm(false)} />
      </BottomSheet>
    </Page>
  );
}

/** La catégorie Passerelle, affichée sans pouvoir la changer ici. */
function PasserelleCategory({ event }: { event: AgendaEvent }) {
  const c = styleOf(event);
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm, alignSelf: "flex-start", backgroundColor: c.soft, borderRadius: 999, paddingVertical: space.sm, paddingHorizontal: space.lg }}>
      <Ionicons name={c.icon as keyof typeof Ionicons.glyphMap} size={18} color={c.main} />
      <T v="bodyBold" style={{ color: c.main }}>
        {c.label}
      </T>
    </View>
  );
}
