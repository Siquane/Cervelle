import { FlexWidget, SvgWidget, TextWidget } from "react-native-android-widget";
import { mascotSvgString } from "../components/mascot/svgString";
import type { WidgetData, WidgetState } from "./data";

// Les widgets Android de Cervelle : un fond en dégradé vif (le même en mode
// clair et sombre), du texte blanc centré et aéré, Cervelle qui dort tant
// que l'enfant n'a pas révisé. Blanc sur chaque dégradé : contraste ≥ 4,5:1.

type Hex = `#${string}`;
type Gradient = [Hex, Hex];

const G = {
  serie: ["#6D3FD9", "#0B61CF"],
  interro: ["#BC0F54", "#6D3FD9"],
  missions: ["#02786D", "#0B61CF"],
  carte: ["#6D3FD9", "#BC0F54"],
  minuteur: ["#0B61CF", "#6D3FD9"],
  amis: ["#0B61CF", "#02786D"],
  express: ["#BC0F54", "#6D3FD9"],
} satisfies Record<string, Gradient>;

const WHITE: Hex = "#FFFFFF";
/** Texte secondaire : blanc légèrement bleuté, encore lisible sur les dégradés. */
const SOFT: Hex = "#EAE6FF";
const TRACK = "rgba(255, 255, 255, 0.28)" as const;

const TITLE = "Outfit_700Bold";
const TEXT = "AtkinsonHyperlegible_400Regular";
const BOLD = "AtkinsonHyperlegible_700Bold";

export const WIDGETS = ["CervelleSerie", "Interro", "Missions", "Carte", "Minuteur", "Amis", "Express"] as const;
export type WidgetName = (typeof WIDGETS)[number];

/** Taille du widget posé (dp), pour choisir une mise en page. */
export interface Size {
  width: number;
  height: number;
}

function Frame({ g, children, uri, click = "OPEN_APP", label, row = false }: { g: Gradient; children: React.ReactNode; uri?: string; click?: string; label: string; row?: boolean }) {
  return (
    <FlexWidget
      clickAction={uri ? "OPEN_URI" : click}
      clickActionData={uri ? { uri } : undefined}
      accessibilityLabel={label}
      style={{
        height: "match_parent",
        width: "match_parent",
        backgroundGradient: { from: g[0], to: g[1], orientation: "TL_BR" },
        borderRadius: 24,
        padding: 16,
        flexDirection: row ? "row" : "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {children}
    </FlexWidget>
  );
}

const Gap = ({ h = 8 }: { h?: number }) => <FlexWidget style={{ height: h, width: h }} />;

function Txt({ text, size, color = WHITE, font = TEXT, lines = 1 }: { text: string; size: number; color?: Hex; font?: string; lines?: number }) {
  return <TextWidget text={text} maxLines={lines} truncate="END" style={{ fontSize: size, color, fontFamily: font, textAlign: "center" }} />;
}

function Bar({ value, color = WHITE }: { value: number; color?: Hex }) {
  const v = Math.max(0, Math.min(1, value));
  return (
    <FlexWidget style={{ width: "match_parent", height: 10, borderRadius: 5, backgroundColor: TRACK, flexDirection: "row" }}>
      {v > 0 ? <FlexWidget style={{ flex: Math.max(1, Math.round(v * 100)), height: 10, borderRadius: 5, backgroundColor: color }} /> : null}
      {v < 1 ? <FlexWidget style={{ flex: Math.max(1, Math.round((1 - v) * 100)), height: 10 }} /> : null}
    </FlexWidget>
  );
}

/** Bouton blanc, texte de la couleur du widget. */
function Pill({ text, uri, color, label }: { text: string; uri: string; color: Hex; label: string }) {
  return (
    <FlexWidget clickAction="OPEN_URI" clickActionData={{ uri }} accessibilityLabel={label} style={{ backgroundColor: WHITE, borderRadius: 18, paddingVertical: 8, paddingHorizontal: 18 }}>
      <TextWidget text={text} style={{ fontSize: 15, color, fontFamily: BOLD }} />
    </FlexWidget>
  );
}

const LETTERS = ["L", "M", "M", "J", "V", "S", "D"];

/** Les 7 jours de la semaine : coche blanche quand l'enfant a travaillé. */
function Week({ week, dot = 24 }: { week: NonNullable<WidgetData["week"]>; dot?: number }) {
  return (
    <FlexWidget style={{ flexDirection: "row", justifyContent: "center" }}>
      {week.map((d, i) => (
        <FlexWidget key={d.day} style={{ flexDirection: "column", alignItems: "center", marginHorizontal: 3 }}>
          <TextWidget text={LETTERS[i]} style={{ fontSize: 11, color: d.today ? WHITE : SOFT, fontFamily: d.today ? BOLD : TEXT }} />
          <FlexWidget
            style={{
              width: dot,
              height: dot,
              borderRadius: dot / 2,
              marginTop: 3,
              backgroundColor: d.done ? WHITE : TRACK,
              borderWidth: d.today && !d.done ? 2 : 0,
              borderColor: WHITE,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {d.done ? <TextWidget text="✓" style={{ fontSize: dot * 0.55, color: "#6D3FD9", fontFamily: BOLD }} /> : null}
          </FlexWidget>
        </FlexWidget>
      ))}
    </FlexWidget>
  );
}

const days = (n: number) => (n <= 0 ? "aujourd'hui" : n === 1 ? "demain" : `dans ${n} jours`);
const mins = (n: number) => (n >= 60 ? `${Math.floor(n / 60)} h ${String(n % 60).padStart(2, "0")}` : `${n} min`);

function subjectOf(e: NonNullable<WidgetData["exam"]>): string {
  const s = e.subject.trim();
  if (!s) return "";
  return s.length > 1 && s[1] === s[1].toLowerCase() ? s[0].toUpperCase() + s.slice(1) : s;
}

/** Ce que lance « Révision express » : l'interro qui arrive, sinon les notions à revoir. */
function expressUri(d: WidgetData): string {
  return d.exam ? `cervelle://quiz?mode=express&revisionId=${d.exam.revisionId}` : "cervelle://quiz?mode=a_revoir";
}

// ── Les widgets ──

function Serie({ d, size }: { d: WidgetData; size: Size }) {
  const wide = size.width >= 230;
  const label = `Cervelle. ${d.streak} jour${d.streak > 1 ? "s" : ""} de suite. ${d.studiedToday ? "Tu as révisé aujourd'hui." : "Pas encore révisé aujourd'hui."}`;
  const mascot = <SvgWidget svg={mascotSvgString(d.equipped, d.studiedToday ? "happy" : "sleep")} style={wide ? { width: 110, height: 107 } : { width: 64, height: 62 }} />;
  const count = (
    <FlexWidget style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
      <TextWidget text="🔥" style={{ fontSize: wide ? 30 : 22 }} />
      <TextWidget text={` ${d.streak}`} style={{ fontSize: wide ? 44 : 30, color: WHITE, fontFamily: TITLE }} />
    </FlexWidget>
  );
  const status = <Txt text={d.studiedToday ? "Bravo, c'est fait !" : d.streak > 0 ? "Garde ta série !" : "C'est parti !"} size={13} color={SOFT} font={BOLD} />;
  if (!wide) {
    return (
      <Frame g={G.serie} label={label}>
        {mascot}
        <Gap h={2} />
        {count}
        {status}
      </Frame>
    );
  }
  return (
    <Frame g={G.serie} label={label} row>
      <FlexWidget style={{ flex: 1, flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        {count}
        {status}
        {d.week ? (
          <>
            <Gap h={10} />
            <Week week={d.week} />
          </>
        ) : null}
      </FlexWidget>
      <Gap h={8} />
      {mascot}
    </Frame>
  );
}

function Interro({ d }: { d: WidgetData }) {
  const e = d.exam;
  if (!e) {
    return (
      <Frame g={G.interro} label="Pas d'interro prévue">
        <Txt text="📅" size={26} />
        <Gap h={6} />
        <Txt text="Pas d'interro prévue" size={17} font={TITLE} />
        <Gap h={4} />
        <Txt text="Ajoute la date dans un cours pour la voir ici." size={13} color={SOFT} lines={2} />
      </Frame>
    );
  }
  const subject = subjectOf(e);
  return (
    <Frame g={G.interro} label={`Interro ${subject} ${days(e.daysLeft)}`} uri={`cervelle://revision/${e.revisionId}`}>
      <Txt text={`📅 Interro ${days(e.daysLeft)}`} size={14} color={SOFT} font={BOLD} />
      <Gap h={4} />
      <Txt text={subject ? `${subject} · ${e.title}` : e.title} size={18} font={TITLE} lines={2} />
      <Gap h={10} />
      <Bar value={e.notions ? e.mastered / e.notions : 0} />
      <Gap h={4} />
      <Txt text={`Tu as compris ${e.mastered} notion${e.mastered > 1 ? "s" : ""} sur ${e.notions}`} size={12} color={SOFT} />
      <Gap h={10} />
      <Pill text="⚡ Révision express" uri={expressUri(d)} color="#BC0F54" label="Révision express" />
    </Frame>
  );
}

function Missions({ d }: { d: WidgetData }) {
  const m = d.missions;
  const all = m.total > 0 && m.done >= m.total;
  return (
    <Frame g={G.missions} label={`Missions du jour : ${m.done} sur ${m.total}. ${d.stars.total} étoiles ce mois-ci.`}>
      <Txt text={all ? (m.chestOpened ? "🎉 Missions finies !" : "🎁 Ton coffre t'attend !") : "🎯 Missions du jour"} size={14} color={SOFT} font={BOLD} />
      <Gap h={2} />
      <Txt text={`${m.done} / ${m.total}`} size={34} font={TITLE} />
      <Bar value={m.total ? m.done / m.total : 0} />
      <Gap h={12} />
      <Txt text={`⭐ ${d.stars.total} étoile${d.stars.total > 1 ? "s" : ""} ce mois-ci`} size={13} font={BOLD} />
      <Gap h={4} />
      <Bar value={d.stars.end ? d.stars.total / d.stars.end : 0} color="#FFD45C" />
    </Frame>
  );
}

function Carte({ d, flipped }: { d: WidgetData; flipped: boolean }) {
  const c = d.card;
  if (!c) {
    return (
      <Frame g={G.carte} label="Carte mémoire du jour">
        <Txt text="🃏" size={26} />
        <Gap h={6} />
        <Txt text="Carte du jour" size={17} font={TITLE} />
        <Gap h={4} />
        <Txt text="Photographie un cours pour avoir tes cartes." size={13} color={SOFT} lines={2} />
      </Frame>
    );
  }
  return (
    <Frame g={G.carte} label={flipped ? `Réponse : ${c.back}` : `Question : ${c.front}. Touche pour retourner.`} click="FLIP">
      <Txt text={flipped ? "✓ La réponse" : "🃏 Carte du jour"} size={13} color={SOFT} font={BOLD} />
      <Gap h={8} />
      <Txt text={flipped ? c.back : c.front} size={c.front.length > 60 ? 16 : 20} font={TITLE} lines={4} />
      <Gap h={10} />
      <Txt text={flipped ? "Touche pour revoir la question" : "Touche pour voir la réponse"} size={12} color={SOFT} />
    </Frame>
  );
}

function Minuteur({ d }: { d: WidgetData }) {
  const focus = d.timer?.focus ?? 25;
  const week = d.timer?.weekMinutes ?? 0;
  return (
    <Frame g={G.minuteur} label={`Minuteur. ${mins(week)} de travail cette semaine.`} uri="cervelle://child/minuteur">
      <Txt text="⏱️ Cette semaine" size={13} color={SOFT} font={BOLD} />
      <Txt text={week > 0 ? mins(week) : "0 min"} size={30} font={TITLE} />
      <Txt text="de travail" size={12} color={SOFT} />
      <Gap h={10} />
      <Pill text={`▶ ${focus} min`} uri="cervelle://child/minuteur?start=1" color="#0B61CF" label={`Je me lance : ${focus} minutes`} />
    </Frame>
  );
}

function Amis({ d }: { d: WidgetData }) {
  const f = d.friends;
  const c = f?.challenge;
  const cheer = f?.lastCheer;
  const label = [c ? `Défi avec ${c.otherName} : toi ${mins(c.myMinutes)}, ${c.otherName} ${mins(c.theirMinutes)}.` : "", f?.cheers ? `${f.cheers} encouragement${f.cheers > 1 ? "s" : ""}.` : ""].filter(Boolean).join(" ") || "Mes amis";
  return (
    <Frame g={G.amis} label={label} uri="cervelle://child/amis">
      <Txt text="🤝 Mes amis" size={13} color={SOFT} font={BOLD} />
      <Gap h={6} />
      {c ? (
        <>
          <Txt text={`Défi avec ${c.otherName}`} size={17} font={TITLE} />
          <Gap h={6} />
          <Bar value={c.myMinutes + c.theirMinutes ? c.myMinutes / (c.myMinutes + c.theirMinutes) : 0.5} />
          <Gap h={4} />
          <Txt text={`Toi ${mins(c.myMinutes)} · ${c.otherName} ${mins(c.theirMinutes)}`} size={12} color={SOFT} />
        </>
      ) : f?.invites ? (
        <Txt text={`📨 ${f.invites} défi${f.invites > 1 ? "s" : ""} à accepter`} size={16} font={TITLE} />
      ) : (
        <Txt text="Lance un défi à un ami !" size={16} font={TITLE} lines={2} />
      )}
      <Gap h={10} />
      <Txt text={cheer ? `${cheer.emoji} ${cheer.fromName} t'encourage${f!.cheers > 1 ? ` (+${f!.cheers - 1})` : ""}` : "Pas de nouvel encouragement"} size={13} font={cheer ? BOLD : TEXT} color={cheer ? WHITE : SOFT} />
    </Frame>
  );
}

/** 1 × 1 : un seul bouton, la révision express. */
function Express({ d }: { d: WidgetData }) {
  return (
    <Frame g={G.express} label={d.exam ? "Révision express pour ta prochaine interro" : "Révision express de tes notions à revoir"} uri={expressUri(d)}>
      <Txt text="⚡" size={26} />
      <Txt text="Express" size={13} font={BOLD} />
    </Frame>
  );
}

function SignedOut({ name }: { name: string }) {
  if (name === "Express") {
    return (
      <Frame g={G.express} label="Ouvre Cervelle">
        <Txt text="⚡" size={26} />
        <Txt text="Cervelle" size={12} font={BOLD} />
      </Frame>
    );
  }
  return (
    <Frame g={G.serie} label="Ouvre Cervelle">
      <SvgWidget svg={mascotSvgString([], "sleep")} style={{ width: 56, height: 54 }} />
      <Gap h={6} />
      <Txt text="Ouvre Cervelle avec ton code pour remplir ce widget." size={13} lines={3} />
    </Frame>
  );
}

export function renderWidgetFor(name: string, state: WidgetState, size: Size = { width: 300, height: 150 }) {
  if (state.kind === "signedOut") return <SignedOut name={name} />;
  const { data, flipped } = state;
  switch (name as WidgetName) {
    case "Interro":
      return <Interro d={data} />;
    case "Missions":
      return <Missions d={data} />;
    case "Carte":
      return <Carte d={data} flipped={flipped} />;
    case "Minuteur":
      return <Minuteur d={data} />;
    case "Amis":
      return <Amis d={data} />;
    case "Express":
      return <Express d={data} />;
    default:
      return <Serie d={data} size={size} />;
  }
}
