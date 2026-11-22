import { FlexWidget, SvgWidget, TextWidget } from "react-native-android-widget";
import { mascotSvgString } from "../components/mascot/svgString";
import type { WidgetData, WidgetState } from "./data";

// Les 4 widgets Android. Mêmes couleurs que l'appli (texte ≥ 4,5:1) ; une
// version claire et une sombre, choisie par le téléphone.

type Hex = `#${string}`;
interface Palette {
  bg: Hex;
  card: Hex;
  ink: Hex;
  muted: Hex;
  brand: Hex;
  teal: Hex;
  sky: Hex;
  sunText: Hex;
  track: Hex;
}

const LIGHT: Palette = { bg: "#FFFFFF", card: "#F3F6FB", ink: "#1F1A3D", muted: "#6B6889", brand: "#BC0F54", teal: "#02786D", sky: "#0B61CF", sunText: "#856000", track: "#E3E6EF" };
const DARK: Palette = { bg: "#141A2E", card: "#0A0C1A", ink: "#EEF0FF", muted: "#A9AECB", brand: "#FF8FB1", teal: "#4FD6C6", sky: "#8EC5FF", sunText: "#FFD45C", track: "#2A3150" };

const TITLE = "Outfit_700Bold";
const TEXT = "AtkinsonHyperlegible_400Regular";
const BOLD = "AtkinsonHyperlegible_700Bold";

export const WIDGETS = ["CervelleSerie", "Interro", "Missions", "Carte", "Minuteur", "Amis"] as const;
export type WidgetName = (typeof WIDGETS)[number];

/** Fond du widget : arrondi, ouvre l'appli au toucher (sauf mention contraire). */
function Frame({ p, children, click = "OPEN_APP", uri, label, center = false }: { p: Palette; children: React.ReactNode; click?: string; uri?: string; label: string; center?: boolean }) {
  return (
    <FlexWidget
      clickAction={uri ? "OPEN_URI" : click}
      clickActionData={uri ? { uri } : undefined}
      accessibilityLabel={label}
      style={{ height: "match_parent", width: "match_parent", backgroundColor: p.bg, borderRadius: 22, padding: 14, flexDirection: "column", justifyContent: center ? "center" : "space-between", alignItems: center ? "center" : "flex-start" }}
    >
      {children}
    </FlexWidget>
  );
}

function Bar({ p, value, color }: { p: Palette; value: number; color: Hex }) {
  const v = Math.max(0, Math.min(1, value));
  return (
    <FlexWidget style={{ width: "match_parent", height: 10, borderRadius: 5, backgroundColor: p.track, flexDirection: "row" }}>
      {v > 0 ? <FlexWidget style={{ flex: Math.round(v * 100), height: 10, borderRadius: 5, backgroundColor: color }} /> : null}
      {v < 1 ? <FlexWidget style={{ flex: Math.round((1 - v) * 100), height: 10 }} /> : null}
    </FlexWidget>
  );
}

function Txt({ text, size, color, font = TEXT, lines = 1, align }: { text: string; size: number; color: Hex; font?: string; lines?: number; align?: "center" | "left" }) {
  return <TextWidget text={text} maxLines={lines} truncate="END" style={{ fontSize: size, color, fontFamily: font, textAlign: align }} />;
}

const days = (n: number) => (n <= 0 ? "aujourd'hui" : n === 1 ? "demain" : `dans ${n} jours`);

function examLabel(e: NonNullable<WidgetData["exam"]>): string {
  const s = e.subject.trim();
  if (!s) return e.title;
  return s.length > 1 && s[1] === s[1].toLowerCase() ? s[0].toUpperCase() + s.slice(1) : s;
}

// ── Les widgets ──

function Serie({ d, p }: { d: WidgetData; p: Palette }) {
  const label = d.studiedToday ? `Cervelle. Série de ${d.streak} jours. Tu as révisé aujourd'hui.` : `Cervelle. Série de ${d.streak} jours. Pas encore révisé aujourd'hui.`;
  return (
    <Frame p={p} label={label} center>
      <SvgWidget svg={mascotSvgString(d.equipped, d.studiedToday ? "happy" : "sleep")} style={{ width: 84, height: 82 }} />
      <Txt text={d.streak > 0 ? `🔥 ${d.streak} jour${d.streak > 1 ? "s" : ""}` : "🔥 C'est parti !"} size={17} color={p.ink} font={TITLE} align="center" />
      <Txt text={d.studiedToday ? "✓ Révisé aujourd'hui" : "Cervelle t'attend"} size={13} color={d.studiedToday ? p.teal : p.brand} font={BOLD} align="center" />
    </Frame>
  );
}

function Interro({ d, p }: { d: WidgetData; p: Palette }) {
  const e = d.exam;
  if (!e) {
    return (
      <Frame p={p} label="Pas d'interro prévue" center>
        <Txt text="📅 Pas d'interro prévue" size={16} color={p.ink} font={TITLE} align="center" />
        <Txt text="Ajoute la date dans un cours pour la voir ici." size={13} color={p.muted} lines={2} align="center" />
      </Frame>
    );
  }
  const share = e.notions ? e.mastered / e.notions : 0;
  return (
    <Frame p={p} label={`Interro de ${examLabel(e)} ${days(e.daysLeft)}`}>
      <FlexWidget style={{ width: "match_parent", flexDirection: "column" }} clickAction="OPEN_URI" clickActionData={{ uri: `cervelle://revision/${e.revisionId}` }}>
        <Txt text={`📅 Interro ${days(e.daysLeft)}`} size={13} color={p.sky} font={BOLD} />
        <Txt text={`${examLabel(e)} · ${e.title}`} size={16} color={p.ink} font={TITLE} />
      </FlexWidget>
      <FlexWidget style={{ width: "match_parent", flexDirection: "column" }}>
        <Txt text={`Tu as compris ${e.mastered} notion${e.mastered > 1 ? "s" : ""} sur ${e.notions}`} size={13} color={p.muted} />
        <FlexWidget style={{ height: 6 }} />
        <Bar p={p} value={share} color="#10B5A5" />
      </FlexWidget>
      <FlexWidget
        clickAction="OPEN_URI"
        clickActionData={{ uri: `cervelle://quiz?mode=express&revisionId=${e.revisionId}` }}
        accessibilityLabel="Révision express"
        style={{ backgroundColor: "#BC0F54", borderRadius: 14, paddingVertical: 7, paddingHorizontal: 14 }}
      >
        <Txt text="⚡ Révision express" size={14} color="#FFFFFF" font={BOLD} />
      </FlexWidget>
    </Frame>
  );
}

function Missions({ d, p }: { d: WidgetData; p: Palette }) {
  const m = d.missions;
  const all = m.total > 0 && m.done >= m.total;
  return (
    <Frame p={p} label={`Missions du jour : ${m.done} sur ${m.total}. ${d.stars.total} étoiles ce mois-ci.`}>
      <FlexWidget style={{ width: "match_parent", flexDirection: "column" }}>
        <Txt text={all ? (m.chestOpened ? "🎉 Missions finies !" : "🎁 Ton coffre t'attend !") : "🎯 Missions du jour"} size={15} color={p.ink} font={TITLE} />
        <FlexWidget style={{ height: 4 }} />
        <Txt text={`${m.done} sur ${m.total}`} size={13} color={p.teal} font={BOLD} />
        <FlexWidget style={{ height: 4 }} />
        <Bar p={p} value={m.total ? m.done / m.total : 0} color="#10B5A5" />
      </FlexWidget>
      <FlexWidget style={{ width: "match_parent", flexDirection: "column" }}>
        <Txt text={`⭐ ${d.stars.total} étoile${d.stars.total > 1 ? "s" : ""} ce mois-ci`} size={13} color={p.sunText} font={BOLD} />
        <FlexWidget style={{ height: 4 }} />
        <Bar p={p} value={d.stars.end ? d.stars.total / d.stars.end : 0} color="#FFC23D" />
      </FlexWidget>
    </Frame>
  );
}

function Carte({ d, p, flipped }: { d: WidgetData; p: Palette; flipped: boolean }) {
  const c = d.card;
  if (!c) {
    return (
      <Frame p={p} label="Carte mémoire du jour" center>
        <Txt text="🃏 Carte du jour" size={16} color={p.ink} font={TITLE} align="center" />
        <Txt text="Photographie un cours pour avoir tes cartes." size={13} color={p.muted} lines={2} align="center" />
      </Frame>
    );
  }
  return (
    <Frame p={p} label={flipped ? `Réponse : ${c.back}` : `Question : ${c.front}. Touche pour retourner.`} click="FLIP">
      <Txt text={flipped ? "✓ La réponse" : "🃏 Carte du jour"} size={13} color={flipped ? p.teal : p.brand} font={BOLD} />
      <FlexWidget style={{ width: "match_parent", backgroundColor: p.card, borderRadius: 14, padding: 10, flex: 1, marginVertical: 6, justifyContent: "center" }}>
        <Txt text={flipped ? c.back : c.front} size={15} color={p.ink} font={flipped ? TEXT : BOLD} lines={4} />
      </FlexWidget>
      <Txt text={flipped ? `${c.title} · touche pour revoir la question` : "Touche pour voir la réponse"} size={12} color={p.muted} />
    </Frame>
  );
}

const mins = (n: number) => (n >= 60 ? `${Math.floor(n / 60)} h ${String(n % 60).padStart(2, "0")}` : `${n} min`);

function Minuteur({ d, p }: { d: WidgetData; p: Palette }) {
  const focus = d.timer?.focus ?? 25;
  const week = d.timer?.weekMinutes ?? 0;
  return (
    <Frame p={p} label={`Minuteur. ${mins(week)} de travail cette semaine. Touche pour lancer ${focus} minutes.`} uri="cervelle://child/minuteur">
      <FlexWidget style={{ width: "match_parent", flexDirection: "column" }}>
        <Txt text="⏱️ Minuteur" size={15} color={p.ink} font={TITLE} />
        <Txt text={week > 0 ? `${mins(week)} de travail cette semaine` : "Prêt à te concentrer ?"} size={13} color={p.teal} font={BOLD} lines={2} />
      </FlexWidget>
      <FlexWidget
        clickAction="OPEN_URI"
        clickActionData={{ uri: "cervelle://child/minuteur?start=1" }}
        accessibilityLabel={`Je me lance : ${focus} minutes`}
        style={{ backgroundColor: "#BC0F54", borderRadius: 14, paddingVertical: 7, paddingHorizontal: 14 }}
      >
        <Txt text={`▶ Je me lance · ${focus} min`} size={14} color="#FFFFFF" font={BOLD} />
      </FlexWidget>
    </Frame>
  );
}

function Amis({ d, p }: { d: WidgetData; p: Palette }) {
  const f = d.friends;
  const c = f?.challenge;
  const cheer = f?.lastCheer;
  const label = [c ? `Défi avec ${c.otherName} : toi ${mins(c.myMinutes)}, ${c.otherName} ${mins(c.theirMinutes)}.` : "", f?.cheers ? `${f.cheers} encouragement${f.cheers > 1 ? "s" : ""}.` : ""].filter(Boolean).join(" ") || "Tes amis";
  return (
    <Frame p={p} label={label} uri="cervelle://child/amis">
      <Txt text="🤝 Mes amis" size={15} color={p.ink} font={TITLE} />
      {c ? (
        <FlexWidget style={{ width: "match_parent", flexDirection: "column" }}>
          <Txt text={`Défi avec ${c.otherName}`} size={13} color={p.sky} font={BOLD} />
          <Txt text={`Toi ${mins(c.myMinutes)} · ${c.otherName} ${mins(c.theirMinutes)}`} size={13} color={p.muted} />
          <FlexWidget style={{ height: 4 }} />
          <Bar p={p} value={c.myMinutes + c.theirMinutes ? c.myMinutes / (c.myMinutes + c.theirMinutes) : 0.5} color="#3D8BFD" />
        </FlexWidget>
      ) : f?.invites ? (
        <Txt text={`📨 ${f.invites} défi${f.invites > 1 ? "s" : ""} à accepter`} size={13} color={p.sky} font={BOLD} />
      ) : (
        <Txt text="Lance un défi à un ami !" size={13} color={p.muted} />
      )}
      <Txt
        text={cheer ? `${cheer.emoji} ${cheer.fromName} t'encourage${f!.cheers > 1 ? ` (+${f!.cheers - 1})` : ""}` : "Pas de nouvel encouragement"}
        size={13}
        color={cheer ? p.brand : p.muted}
        font={cheer ? BOLD : TEXT}
      />
    </Frame>
  );
}

function SignedOut({ p }: { p: Palette }) {
  return (
    <Frame p={p} label="Ouvre Cervelle" center>
      <SvgWidget svg={mascotSvgString([], "sleep")} style={{ width: 56, height: 54 }} />
      <Txt text="Ouvre Cervelle avec ton code pour remplir ce widget." size={13} color={p.muted} lines={3} align="center" />
    </Frame>
  );
}

function one(name: string, state: WidgetState, p: Palette) {
  if (state.kind === "signedOut") return <SignedOut p={p} />;
  const { data, flipped } = state;
  switch (name as WidgetName) {
    case "Interro":
      return <Interro d={data} p={p} />;
    case "Missions":
      return <Missions d={data} p={p} />;
    case "Carte":
      return <Carte d={data} p={p} flipped={flipped} />;
    case "Minuteur":
      return <Minuteur d={data} p={p} />;
    case "Amis":
      return <Amis d={data} p={p} />;
    default:
      return <Serie d={data} p={p} />;
  }
}

export function renderWidgetFor(name: string, state: WidgetState) {
  return { light: one(name, state, LIGHT), dark: one(name, state, DARK) };
}
