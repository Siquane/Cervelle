import { useEffect, useState } from "react";
import { Share, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, errorMessage } from "../src/api/client";
import { learnerPath, usePride, useRefreshLearner } from "../src/api/hooks";
import type { Pride } from "../src/api/types";
import { Field } from "../src/components/Field";
import { Mascot } from "../src/components/mascot/Mascot";
import { StarBurst } from "../src/components/motion";
import { Button, Card, ErrorBox, Loading, Page, T, TopBar } from "../src/components/ui";
import { longDate } from "../src/lib/format";
import { useLid } from "../src/lib/lid";
import { API_URL } from "../src/state/session";
import { color, font, radius, space } from "../src/theme/tokens";

// Journal de fierté : chaque dimanche, la page de la semaine (ce que
// l'enfant a appris, ce dont il est fier, ses jours de travail). Il l'envoie
// à ses parents et peut partager le lien (grands-parents…).

function Stat({ value, label, tint }: { value: number; label: string; tint: string }) {
  return (
    <View style={{ flex: 1, alignItems: "center", backgroundColor: color.card, borderRadius: radius.md, borderWidth: 2, borderColor: color.line, padding: space.sm }}>
      <T style={{ fontFamily: font.title, fontSize: 26, color: tint }}>{value}</T>
      <T v="small" style={{ textAlign: "center" }}>
        {label}
      </T>
    </View>
  );
}

export default function PrideScreen() {
  const { lid, asParent } = useLid();
  const qc = useQueryClient();
  const refresh = useRefreshLearner(lid);
  const q = usePride(lid);
  const [message, setMessage] = useState("");
  const [stars, setStars] = useState(0);
  const p = q.data?.pride;

  useEffect(() => {
    if (p) setMessage(p.message);
  }, [p?.week]);

  const send = useMutation({
    mutationFn: () => api.post<{ pride: Pride; stars: number }>(`${learnerPath(lid)}/pride${p ? `?week=${p.week}` : ""}`, { message }),
    onSuccess: (r) => {
      qc.setQueryData(["pride", lid, ""], { pride: r.pride, stars: q.data?.stars ?? 1 });
      if (r.stars) {
        setStars(r.stars);
        refresh();
      }
    },
  });

  const share = async (path: string) => {
    try {
      await Share.share({ message: `Mon journal de fierté de la semaine : ${API_URL}${path}` });
    } catch {
      // L'enfant a fermé le partage.
    }
  };

  if (q.isLoading) return <Loading />;
  if (!p) {
    return (
      <Page header={<TopBar title="Journal de fierté" />}>
        <ErrorBox message={errorMessage(q.error)} onRetry={() => q.refetch()} />
      </Page>
    );
  }
  const empty = !p.learned.length && !p.proud.length && !p.notions.length && p.activeDays === 0;

  return (
    <Page header={<TopBar title="Journal de fierté" />}>
      <View style={{ alignItems: "center", gap: space.xs, backgroundColor: color.brandFill, borderRadius: radius.lg, padding: space.lg }}>
        <Mascot size={80} mood="happy" />
        <T style={{ fontFamily: font.title, fontSize: 22, color: color.white, textAlign: "center" }}>Ma semaine dont je suis fier</T>
        <T style={{ fontFamily: font.textSemi, color: color.white, textAlign: "center" }}>
          Du {longDate(p.week)} au {longDate(p.to)}
        </T>
      </View>

      <View style={{ flexDirection: "row", gap: space.sm }}>
        <Stat value={p.activeDays} label={p.activeDays > 1 ? "jours de travail" : "jour de travail"} tint={color.teal} />
        <Stat value={p.notions.length} label={p.notions.length > 1 ? "notions apprises" : "notion apprise"} tint={color.brand} />
        <Stat value={p.minutes} label="minutes" tint={color.sky} />
      </View>

      {empty ? (
        <Card style={{ gap: space.sm }}>
          <T v="body">Ta page est encore vide. Écris dans ton journal de bord ce que tu as appris aujourd'hui, et révise un peu : tout s'ajoutera ici.</T>
          {!asParent ? <Button small tone="white" icon="journal" label="Ouvrir mon journal de bord" onPress={() => router.push({ pathname: "/journal", params: { lid } })} /> : null}
        </Card>
      ) : null}

      {p.notions.length ? (
        <Card style={{ gap: space.xs }}>
          <T v="h3">Ce que j'ai appris</T>
          {p.notions.map((n) => (
            <View key={n} style={{ flexDirection: "row", gap: space.sm, alignItems: "center" }}>
              <Ionicons name="checkmark-circle" size={22} color={color.green} />
              <T v="body" style={{ flex: 1 }}>
                {n}
              </T>
            </View>
          ))}
        </Card>
      ) : null}
      {p.learned.length ? (
        <Card style={{ gap: space.xs }}>
          <T v="h3">Dans mon journal : « j'ai appris… »</T>
          {p.learned.map((x) => (
            <T key={x.day} v="body">
              {"•"} {x.text}
            </T>
          ))}
        </Card>
      ) : null}
      {p.proud.length ? (
        <Card style={{ gap: space.xs }}>
          <T v="h3">Ce dont je suis fier</T>
          {p.proud.map((x) => (
            <T key={x.day} v="body">
              {"•"} {x.text}
            </T>
          ))}
        </Card>
      ) : null}
      {p.badges.length ? (
        <Card style={{ gap: space.xs }}>
          <T v="h3">Mes badges de la semaine</T>
          <T v="body">{p.badges.join(", ")}</T>
        </Card>
      ) : null}

      {asParent ? (
        p.message ? (
          <Card>
            <T v="body">« {p.message} »</T>
          </Card>
        ) : null
      ) : (
        <>
          <Field label="Un mot pour mes parents (si tu veux)" value={message} onChangeText={setMessage} multiline maxLength={400} placeholder="Cette semaine, je suis le plus fier de…" />
          <Button icon={p.sent ? "refresh" : "send"} label={p.sent ? "Mettre à jour ma page" : "Envoyer à mes parents"} loading={send.isPending} onPress={() => send.mutate()} />
          {p.sent ? (
            <T v="small" style={{ textAlign: "center" }}>
              {p.seen ? "Tes parents ont lu ta page." : "Ta page est envoyée à tes parents."}
            </T>
          ) : null}
          {stars ? (
            <T v="bodyBold" style={{ textAlign: "center", color: color.sunDark }}>
              +{stars} étoile ! ⭐
            </T>
          ) : null}
        </>
      )}
      {p.sharePath ? <Button tone="white" icon="share-social" label="Partager ma page (grands-parents…)" onPress={() => share(p.sharePath!)} /> : null}
      {send.error ? <ErrorBox message={errorMessage(send.error)} /> : null}
      {stars ? <StarBurst k="sent" now /> : null}
    </Page>
  );
}
