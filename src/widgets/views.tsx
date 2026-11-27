import { FlexWidget, ImageWidget, SvgWidget, TextWidget } from "react-native-android-widget";
import { EMOJI_IMAGES } from "../lib/emojiImages";
import { mascotSvgString } from "../components/mascot/svgString";
import type { ParentWidgetState, WidgetData, WidgetState } from "./data";

// Les widgets Android de Cervelle : texte centré et aéré, Cervelle qui dort
// tant que l'enfant n'a pas révisé. Trois styles au choix pour chaque widget
// (dégradé coloré, clair, sombre) ; texte ≥ 4,5:1 sur chacun.

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

/** Style choisi pour chaque widget : dégradé coloré, fond clair ou fond sombre. */
export type WidgetStyle = "couleur" | "clair" | "sombre";
export const WIDGET_STYLES: { key: WidgetStyle; label: string }[] = [
  { key: "couleur", label: "Couleur" },
  { key: "clair", label: "Clair" },
  { key: "sombre", label: "Sombre" },
];

type Color = Hex | `rgba(${number}, ${number}, ${number}, ${number})`;
interface Theme {
  bg: { backgroundGradient: { from: Hex; to: Hex; orientation: "TL_BR" } } | { backgroundColor: Hex };
  text: Hex;
  soft: Hex;
  track: Color;
  /** Barres, ronds cochés. */
  fill: Hex;
  pillBg: Hex;
  pillText: Hex;
  /** Coche dans un rond plein. */
  check: Hex;
}

/** Version claire de chaque couleur de base, lisible sur le fond sombre (≥ 3:1 pour le décor, ≥ 4,5:1 en texte). */
const LIGHTER: Record<string, Hex> = { "#6D3FD9": "#A98BFF", "#BC0F54": "#FF8FB1", "#02786D": "#4FD6C6", "#0B61CF": "#8EC5FF", "#1F1A3D": "#A98BFF" };

function theme(style: WidgetStyle, g: Gradient): Theme {
  const accent = g[0];
  if (style === "clair") {
    return { bg: { backgroundColor: "#FFFFFF" }, text: "#1F1A3D", soft: "#6B6889", track: "#E3E6EF", fill: accent === "#1F1A3D" ? "#6D3FD9" : accent, pillBg: accent === "#1F1A3D" ? "#6D3FD9" : accent, pillText: WHITE, check: WHITE };
  }
  if (style === "sombre") {
    const light = LIGHTER[accent] ?? "#A98BFF";
    return { bg: { backgroundColor: "#141A2E" }, text: "#EEF0FF", soft: "#A9AECB", track: "#2A3150", fill: light, pillBg: light, pillText: "#1F1A3D", check: "#1F1A3D" };
  }
  return { bg: { backgroundGradient: { from: g[0], to: g[1], orientation: "TL_BR" } }, text: WHITE, soft: SOFT, track: TRACK, fill: WHITE, pillBg: WHITE, pillText: accent === "#1F1A3D" ? "#6D3FD9" : accent, check: accent };
}

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

function Frame({ th, children, uri, click = "OPEN_APP", label, row = false, pad = 16 }: { th: Theme; children: React.ReactNode; uri?: string; click?: string; label: string; row?: boolean; pad?: number }) {
  return (
    <FlexWidget
      clickAction={uri ? "OPEN_URI" : click}
      clickActionData={uri ? { uri } : undefined}
      accessibilityLabel={label}
      style={{
        height: "match_parent",
        width: "match_parent",
        ...th.bg,
        borderRadius: 24,
        padding: pad,
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

/** A big emoji on its own: the 3D image, like in the app. */
function Big({ e, size }: { e: string; size: number }) {
  return <ImageWidget image={EMOJI_IMAGES[e] as number} imageWidth={size} imageHeight={size} />;
}

function Txt({ th, text, size, color, font = TEXT, lines = 1 }: { th: Theme; text: string; size: number; color?: Hex; font?: string; lines?: number }) {
  return <TextWidget text={text} maxLines={lines} truncate="END" style={{ fontSize: size, color: color ?? th.text, fontFamily: font, textAlign: "center" }} />;
}

/** Un mot qui rétrécit pour tenir en entier dans un petit widget. */
function Fit({ th, text }: { th: Theme; text: string }) {
  return <TextWidget text={text} maxLines={1} style={{ fontSize: 12, color: th.text, fontFamily: BOLD, textAlign: "center", width: "match_parent", adjustsFontSizeToFit: true }} />;
}

function Bar({ th, value, color }: { th: Theme; value: number; color?: Hex }) {
  const v = Math.max(0, Math.min(1, value));
  return (
    <FlexWidget style={{ width: "match_parent", height: 10, borderRadius: 5, backgroundColor: th.track, flexDirection: "row" }}>
      {v > 0 ? <FlexWidget style={{ flex: Math.max(1, Math.round(v * 100)), height: 10, borderRadius: 5, backgroundColor: color ?? th.fill }} /> : null}
      {v < 1 ? <FlexWidget style={{ flex: Math.max(1, Math.round((1 - v) * 100)), height: 10 }} /> : null}
    </FlexWidget>
  );
}

/** Bouton plein (blanc sur le dégradé, couleur du widget sur fond clair ou sombre). */
function Pill({ th, text, uri, label }: { th: Theme; text: string; uri: string; label: string }) {
  return (
    <FlexWidget clickAction="OPEN_URI" clickActionData={{ uri }} accessibilityLabel={label} style={{ backgroundColor: th.pillBg, borderRadius: 18, paddingVertical: 8, paddingHorizontal: 18 }}>
      <TextWidget text={text} style={{ fontSize: 15, color: th.pillText, fontFamily: BOLD }} />
    </FlexWidget>
  );
}

const LETTERS = ["L", "M", "M", "J", "V", "S", "D"];

/** Les 7 jours de la semaine : coche blanche quand l'enfant a travaillé. */
function Week({ th, week, dot = 24 }: { th: Theme; week: NonNullable<WidgetData["week"]>; dot?: number }) {
  return (
    <FlexWidget style={{ flexDirection: "row", justifyContent: "center" }}>
      {week.map((d, i) => (
        <FlexWidget key={d.day} style={{ flexDirection: "column", alignItems: "center", marginHorizontal: 3 }}>
          <TextWidget text={LETTERS[i]} style={{ fontSize: 11, color: d.today ? th.text : th.soft, fontFamily: d.today ? BOLD : TEXT }} />
          <FlexWidget
            style={{
              width: dot,
              height: dot,
              borderRadius: dot / 2,
              marginTop: 3,
              backgroundColor: d.done ? th.fill : th.track,
              borderWidth: d.today && !d.done ? 2 : 0,
              borderColor: th.fill,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {d.done ? <TextWidget text="✓" style={{ fontSize: dot * 0.55, color: th.check, fontFamily: BOLD }} /> : null}
          </FlexWidget>
        </FlexWidget>
      ))}
    </FlexWidget>
  );
}

const shortDays = (n: number) => (n <= 0 ? "aujourd'hui" : n === 1 ? "demain" : `dans ${n} j`);
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

function Serie({ d, size, style }: { d: WidgetData; size: Size; style: WidgetStyle }) {
  const th = theme(style, G.serie);
  const wide = size.width >= 230;
  const label = `Cervelle. ${d.streak} jour${d.streak > 1 ? "s" : ""} d'affilée. ${d.studiedToday ? "Tu as révisé aujourd'hui." : "Pas encore révisé aujourd'hui."}`;
  const mascot = <SvgWidget svg={mascotSvgString(d.equipped, d.studiedToday ? "happy" : "sleep")} style={wide ? { width: 110, height: 107 } : { width: 64, height: 62 }} />;
  const count = (
    <FlexWidget style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
      <Big e="🔥" size={wide ? 36 : 26} />
      <TextWidget text={` ${d.streak}`} style={{ fontSize: wide ? 44 : 30, color: th.text, fontFamily: TITLE }} />
    </FlexWidget>
  );
  const status = <Txt th={th} text={d.studiedToday ? "Bravo, c'est fait !" : d.streak > 0 ? "Garde le rythme !" : "C'est parti !"} size={13} color={th.soft} font={BOLD} />;
  if (!wide) {
    return (
      <Frame th={th} label={label}>
        {mascot}
        <Gap h={2} />
        {count}
        {status}
      </Frame>
    );
  }
  return (
    <Frame th={th} label={label} row>
      <FlexWidget style={{ flex: 1, flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        {count}
        {status}
        {d.week ? (
          <>
            <Gap h={10} />
            <Week th={th} week={d.week} />
          </>
        ) : null}
      </FlexWidget>
      <Gap h={8} />
      {mascot}
    </Frame>
  );
}

function Interro({ d, style }: { d: WidgetData; style: WidgetStyle }) {
  const th = theme(style, G.interro);
  const e = d.exam;
  if (!e) {
    return (
      <Frame th={th} label="Pas d'interro prévue">
        <Big e="📅" size={30} />
        <Gap h={6} />
        <Txt th={th} text="Pas d'interro prévue" size={17} font={TITLE} />
        <Gap h={4} />
        <Txt th={th} text="Ajoute la date dans une révision pour la voir ici." size={13} color={th.soft} lines={2} />
      </Frame>
    );
  }
  const subject = subjectOf(e);
  return (
    <Frame th={th} label={`Interro ${subject} ${days(e.daysLeft)}`} uri={`cervelle://revision/${e.revisionId}`}>
      <Txt th={th} text={`📅 Interro ${days(e.daysLeft)}`} size={14} color={th.soft} font={BOLD} />
      <Gap h={4} />
      <Txt th={th} text={subject ? `${subject} · ${e.title}` : e.title} size={18} font={TITLE} lines={2} />
      <Gap h={10} />
      <Bar th={th} value={e.notions ? e.mastered / e.notions : 0} />
      <Gap h={4} />
      <Txt th={th} text={`Tu as compris ${e.mastered} notion${e.mastered > 1 ? "s" : ""} sur ${e.notions}`} size={12} color={th.soft} />
      <Gap h={10} />
      <Pill th={th} text="⚡ Révision express" uri={expressUri(d)} label="Révision express" />
    </Frame>
  );
}

function Missions({ d, style }: { d: WidgetData; style: WidgetStyle }) {
  const th = theme(style, G.missions);
  const m = d.missions;
  const all = m.total > 0 && m.done >= m.total;
  return (
    <Frame th={th} label={`Missions du jour : ${m.done} sur ${m.total}. ${d.stars.total} étoiles ce mois-ci.`}>
      <Txt th={th} text={all ? (m.chestOpened ? "🎉 Missions finies !" : "🎁 Ton coffre t'attend !") : "🎯 Missions du jour"} size={14} color={th.soft} font={BOLD} />
      <Gap h={2} />
      <Txt th={th} text={`${m.done} / ${m.total}`} size={34} font={TITLE} />
      <Bar th={th} value={m.total ? m.done / m.total : 0} />
      <Gap h={12} />
      <Txt th={th} text={`⭐ ${d.stars.total} étoile${d.stars.total > 1 ? "s" : ""} ce mois-ci`} size={13} font={BOLD} />
      <Gap h={4} />
      <Bar th={th} value={d.stars.end ? d.stars.total / d.stars.end : 0} color={style === "clair" ? "#856000" : "#FFD45C"} />
    </Frame>
  );
}

function Carte({ d, flipped, style }: { d: WidgetData; flipped: boolean; style: WidgetStyle }) {
  const th = theme(style, G.carte);
  const c = d.card;
  if (!c) {
    return (
      <Frame th={th} label="Fiche-question du jour">
        <Txt th={th} text="🃏" size={26} />
        <Gap h={6} />
        <Txt th={th} text="Carte du jour" size={17} font={TITLE} />
        <Gap h={4} />
        <Txt th={th} text="Prends une leçon en photo pour avoir tes questions." size={13} color={th.soft} lines={2} />
      </Frame>
    );
  }
  return (
    <Frame th={th} label={flipped ? `Réponse : ${c.back}` : `Question : ${c.front}. Touche pour retourner.`} click="FLIP">
      <Txt th={th} text={flipped ? "✓ La réponse" : "🃏 Carte du jour"} size={13} color={th.soft} font={BOLD} />
      <Gap h={8} />
      <Txt th={th} text={flipped ? c.back : c.front} size={c.front.length > 60 ? 16 : 20} font={TITLE} lines={4} />
      <Gap h={10} />
      <Txt th={th} text={flipped ? "Touche pour revoir la question" : "Touche pour voir la réponse"} size={12} color={th.soft} />
    </Frame>
  );
}

function Minuteur({ d, style }: { d: WidgetData; style: WidgetStyle }) {
  const th = theme(style, G.minuteur);
  const focus = d.timer?.focus ?? 25;
  const week = d.timer?.weekMinutes ?? 0;
  return (
    <Frame th={th} label={`Minuteur. ${mins(week)} de travail cette semaine.`} uri="cervelle://child/minuteur">
      <Txt th={th} text="⏱️ Cette semaine" size={13} color={th.soft} font={BOLD} />
      <Txt th={th} text={week > 0 ? mins(week) : "0 min"} size={30} font={TITLE} />
      <Txt th={th} text="de travail" size={12} color={th.soft} />
      <Gap h={10} />
      <Pill th={th} text={`▶ ${focus} min`} uri="cervelle://child/minuteur?start=1" label={`Je me lance : ${focus} minutes`} />
    </Frame>
  );
}

function Amis({ d, style }: { d: WidgetData; style: WidgetStyle }) {
  const th = theme(style, G.amis);
  const f = d.friends;
  const c = f?.challenge;
  const cheer = f?.lastCheer;
  const label = [c ? `Défi avec ${c.otherName} : toi ${mins(c.myMinutes)}, ${c.otherName} ${mins(c.theirMinutes)}.` : "", f?.cheers ? `${f.cheers} encouragement${f.cheers > 1 ? "s" : ""}.` : ""].filter(Boolean).join(" ") || "Mes amis";
  return (
    <Frame th={th} label={label} uri="cervelle://child/amis">
      <Txt th={th} text="🤝 Mes amis" size={13} color={th.soft} font={BOLD} />
      <Gap h={6} />
      {c ? (
        <>
          <Txt th={th} text={`Défi avec ${c.otherName}`} size={17} font={TITLE} />
          <Gap h={6} />
          <Bar th={th} value={c.myMinutes + c.theirMinutes ? c.myMinutes / (c.myMinutes + c.theirMinutes) : 0.5} />
          <Gap h={4} />
          <Txt th={th} text={`Toi ${mins(c.myMinutes)} · ${c.otherName} ${mins(c.theirMinutes)}`} size={12} color={th.soft} />
        </>
      ) : f?.invites ? (
        <Txt th={th} text={`📨 ${f.invites} défi${f.invites > 1 ? "s" : ""} à accepter`} size={16} font={TITLE} />
      ) : (
        <Txt th={th} text="Lance un défi à un ami !" size={16} font={TITLE} lines={2} />
      )}
      <Gap h={10} />
      <Txt th={th} text={cheer ? `${cheer.emoji} ${cheer.fromName} t'encourage${f!.cheers > 1 ? ` (+${f!.cheers - 1})` : ""}` : "Pas de nouvel encouragement"} size={13} font={cheer ? BOLD : TEXT} color={cheer ? th.text : th.soft} />
    </Frame>
  );
}

/** 1 × 1 : un seul bouton, la révision express. */
function Express({ d, style }: { d: WidgetData; style: WidgetStyle }) {
  const th = theme(style, G.express);
  return (
    <Frame th={th} label={d.exam ? "Révision express pour ta prochaine interro" : "Révision express de tes notions à revoir"} uri={expressUri(d)} pad={4}>
      <Big e="⚡" size={26} />
      <Fit th={th} text="Express" />
    </Frame>
  );
}

// ── Widget parent ──

const PARENT: Gradient = ["#1F1A3D", "#6D3FD9"];

export function renderParentWidget(state: ParentWidgetState, style: WidgetStyle = "couleur") {
  const th = theme(style, PARENT);
  if (state.kind === "signedOut" || state.data.children.length === 0) {
    return (
      <Frame th={th} label="Ouvre Cervelle en parent">
        <Txt th={th} text="👨‍👩‍👧 Mes enfants" size={15} font={TITLE} />
        <Gap h={6} />
        <Txt th={th} text="Ouvre Cervelle avec ton compte parent pour remplir ce widget." size={13} color={th.soft} lines={3} />
      </Frame>
    );
  }
  const kids = state.data.children.slice(0, 3);
  const label = kids.map((c) => `${c.name} : ${c.studiedToday ? "a révisé aujourd'hui" : "pas encore révisé"}${c.exam ? `, interro ${days(c.exam.daysLeft)}` : ""}.`).join(" ");
  return (
    <Frame th={th} label={label} pad={12}>
      {kids.map((c, i) => (
        <FlexWidget key={c.id} style={{ width: "match_parent", flexDirection: "row", alignItems: "center", marginTop: i ? 8 : 0 }}>
          <SvgWidget svg={mascotSvgString(c.equipped, c.studiedToday ? "happy" : "sleep")} style={{ width: 40, height: 39 }} />
          <FlexWidget style={{ flex: 1, flexDirection: "column", marginLeft: 10 }}>
            <FlexWidget style={{ flexDirection: "row", alignItems: "center" }}>
              <TextWidget text={c.name} maxLines={1} truncate="END" style={{ fontSize: 16, color: th.text, fontFamily: TITLE }} />
              <TextWidget text={c.streak > 0 ? `  🔥 ${c.streak}` : ""} style={{ fontSize: 13, color: th.soft, fontFamily: BOLD }} />
            </FlexWidget>
            <TextWidget
              text={c.exam ? `📅 ${subjectOf(c.exam) || c.exam.title} ${shortDays(c.exam.daysLeft)} · ${c.exam.mastered}/${c.exam.notions} compris` : "Pas d'interro prévue"}
              maxLines={1}
              truncate="END"
              style={{ fontSize: 12, color: th.soft, fontFamily: TEXT }}
            />
          </FlexWidget>
          <FlexWidget style={{ backgroundColor: c.studiedToday ? th.pillBg : th.track, borderRadius: 12, paddingVertical: 4, paddingHorizontal: 10, marginLeft: 6 }}>
            <TextWidget text={c.studiedToday ? "✓ Révisé" : "Pas encore"} style={{ fontSize: 12, color: c.studiedToday ? th.pillText : th.text, fontFamily: BOLD }} />
          </FlexWidget>
        </FlexWidget>
      ))}
    </Frame>
  );
}

function SignedOut({ name, style }: { name: string; style: WidgetStyle }) {
  if (name === "Express") {
    const th = theme(style, G.express);
    return (
      <Frame th={th} label="Ouvre Cervelle" pad={4}>
        <Big e="⚡" size={26} />
        <Fit th={th} text="Cervelle" />
      </Frame>
    );
  }
  const th = theme(style, G.serie);
  return (
    <Frame th={th} label="Ouvre Cervelle">
      <SvgWidget svg={mascotSvgString([], "sleep")} style={{ width: 56, height: 54 }} />
      <Gap h={6} />
      <Txt th={th} text="Ouvre Cervelle avec ton code pour remplir ce widget." size={13} lines={3} />
    </Frame>
  );
}

export function renderWidgetFor(name: string, state: WidgetState, size: Size = { width: 300, height: 150 }, style: WidgetStyle = "couleur") {
  if (state.kind === "signedOut") return <SignedOut name={name} style={style} />;
  const { data, flipped } = state;
  switch (name as WidgetName) {
    case "Interro":
      return <Interro d={data} style={style} />;
    case "Missions":
      return <Missions d={data} style={style} />;
    case "Carte":
      return <Carte d={data} flipped={flipped} style={style} />;
    case "Minuteur":
      return <Minuteur d={data} style={style} />;
    case "Amis":
      return <Amis d={data} style={style} />;
    case "Express":
      return <Express d={data} style={style} />;
    default:
      return <Serie d={data} size={size} style={style} />;
  }
}
