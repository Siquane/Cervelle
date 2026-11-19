import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api, errorMessage } from "../../src/api/client";
import { useLearners, useQueryClient, keys } from "../../src/api/hooks";
import type { Learner, Level } from "../../src/api/types";
import { BottomSheet } from "../../src/components/bits";
import { Field } from "../../src/components/Field";
import { Button, ErrorBox, Page, T, TopBar } from "../../src/components/ui";
import { LEVEL_LABEL } from "../../src/lib/format";
import { useParentPrefs } from "../../src/state/parentPrefs";
import { color, learnerColor, radius, space } from "../../src/theme/tokens";
import { Chip } from "../../src/components/Chip";

const GRADES: Record<Level, string[]> = {
  primaire: ["CP", "CE1", "CE2", "CM1", "CM2"],
  college: ["6e", "5e", "4e", "3e"],
  lycee: ["2de", "1re", "Terminale"],
  superieur: [],
  adulte: [],
};

export default function LearnerForm() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const learners = useLearners();
  const existing = learners.data?.find((l) => l.id === id);
  const [name, setName] = useState("");
  const [level, setLevel] = useState<Level>("college");
  const [grade, setGrade] = useState("");
  const [tint, setTint] = useState("violet");
  const [confirm, setConfirm] = useState(false);
  const qc = useQueryClient();
  const setLearner = useParentPrefs((s) => s.setLearner);
  // Passerelle's family members, to link the profile (agenda synchronisation).
  const members = useQuery({ queryKey: ["members"], queryFn: () => api.get<{ members: { id: string; name: string }[] }>("/members").then((r) => r.members) });
  const [memberId, setMemberId] = useState<string | null>(null);

  useEffect(() => {
    if (existing) {
      setName(existing.name);
      setLevel(existing.level);
      setGrade(existing.grade);
      setTint(existing.color);
      setMemberId(existing.memberId);
    }
  }, [existing]);

  const save = useMutation({
    mutationFn: () => {
      const body = { name: name.trim(), level, grade: grade.trim(), color: tint, memberId };
      return id ? api.patch<{ learner: Learner }>(`/cervelle/learners/${id}`, body) : api.post<{ learner: Learner }>("/cervelle/learners", body);
    },
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: keys.learners });
      if (!id) setLearner(r.learner.id);
      router.back();
    },
  });
  const remove = useMutation({
    mutationFn: () => api.delete(`/cervelle/learners/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.learners });
      router.back();
    },
  });

  return (
    <Page header={<TopBar title={id ? "Modifier le profil" : "Nouvel enfant"} />}>
      <Field label="Prénom" value={name} onChangeText={setName} autoCapitalize="words" maxLength={40} />
      <View style={{ gap: space.sm }}>
        <T v="bodyBold">Niveau</T>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
          {(Object.keys(LEVEL_LABEL) as Level[]).map((l) => (
            <Chip key={l} label={LEVEL_LABEL[l]} on={level === l} onPress={() => { setLevel(l); setGrade(""); }} />
          ))}
        </View>
      </View>
      {GRADES[level].length ? (
        <View style={{ gap: space.sm }}>
          <T v="bodyBold">Classe</T>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
            {GRADES[level].map((g) => (
              <Chip key={g} label={g} on={grade === g} onPress={() => setGrade(g)} />
            ))}
          </View>
        </View>
      ) : (
        <Field label="Formation (facultatif)" value={grade} onChangeText={setGrade} placeholder={level === "adulte" ? "Code de la route, concours…" : "Licence 1, BTS…"} maxLength={30} />
      )}
      <View style={{ gap: space.sm }}>
        <T v="bodyBold">Couleur</T>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.md }}>
          {Object.entries(learnerColor).map(([k, c]) => (
            <Pressable key={k} accessibilityRole="radio" accessibilityState={{ selected: tint === k }} accessibilityLabel={k} onPress={() => setTint(k)} style={{ width: 46, height: 46, borderRadius: radius.pill, backgroundColor: c.main, borderWidth: 4, borderColor: tint === k ? color.ink : "transparent" }} />
          ))}
        </View>
      </View>
      {members.data?.length ? (
        <View style={{ gap: space.sm }}>
          <T v="bodyBold">Membre de la famille dans Passerelle</T>
          <T v="small">Pour synchroniser son agenda avec le planning familial, quand tu le demandes.</T>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
            <Chip label="Aucun" on={!memberId} onPress={() => setMemberId(null)} />
            {members.data.map((m) => (
              <Chip key={m.id} label={m.name} on={memberId === m.id} onPress={() => setMemberId(m.id)} />
            ))}
          </View>
        </View>
      ) : null}
      {save.error ? <ErrorBox message={errorMessage(save.error)} /> : null}
      <Button label="Enregistrer" icon="checkmark" loading={save.isPending} disabled={!name.trim()} onPress={() => save.mutate()} />
      {id ? <Button tone="ghost" label="Supprimer ce profil" icon="trash" onPress={() => setConfirm(true)} /> : null}
      <BottomSheet open={confirm} onClose={() => setConfirm(false)} title={`Supprimer le profil de ${name} ?`}>
        <T v="body">Ses révisions, ses progrès et ses pièces seront effacés, et ses téléphones déliés. C'est définitif.</T>
        {remove.error ? <ErrorBox message={errorMessage(remove.error)} /> : null}
        <Button tone="danger" label="Supprimer le profil" icon="trash" loading={remove.isPending} onPress={() => remove.mutate()} />
        <Button tone="white" label="Garder le profil" onPress={() => setConfirm(false)} />
      </BottomSheet>
    </Page>
  );
}
