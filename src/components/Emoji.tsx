import { Children, Fragment, type ReactNode } from "react";
import { Image, Text, type ImageStyle, type StyleProp } from "react-native";
import { EMOJI_IMAGES } from "../lib/emojiImages";

// The phone's emojis change from one phone to the next: Cervelle draws them as
// 3D images instead (the same style as the card album). <T> does it by itself
// for the text it shows; <Emoji> is for an emoji on its own.

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// Longest first, so a sequence (🏴‍☠️) wins over its first emoji (🏴).
const KEYS = Object.keys(EMOJI_IMAGES).sort((a, b) => b.length - a.length);
const SPLIT = new RegExp(`(${KEYS.map(escape).join("|")})️?`, "gu");

/** One emoji as a 3D image; falls back to the phone's emoji if we don't have it. */
export function Emoji({ e, size = 24, style }: { e: string; size?: number; style?: StyleProp<ImageStyle> }) {
  const src = EMOJI_IMAGES[e.replace(/️/g, "")];
  if (!src) return <Text style={{ fontSize: size * 0.85 }}>{e}</Text>;
  return <Image source={src} style={[{ width: size, height: size }, style]} accessible={false} />;
}

/** Text with its emojis turned into images, inline, at the size of the letters. */
export function withEmojis(children: ReactNode, fontSize: number): ReactNode {
  let changed = false;
  const out = Children.map(children, (child) => {
    if (typeof child !== "string") return child;
    const parts = child.split(SPLIT);
    if (parts.length === 1) return child;
    changed = true;
    return (
      <Fragment>
        {parts.map((p, i) =>
          i % 2 === 1 ? (
            <Image key={i} source={EMOJI_IMAGES[p]} style={{ width: fontSize * 1.15, height: fontSize * 1.15 }} accessible={false} />
          ) : p ? (
            p
          ) : null,
        )}
      </Fragment>
    );
  });
  return changed ? out : children;
}

/** True when the text holds an emoji we draw (for tests and callers that need to know). */
export const hasEmoji = (s: string) => new RegExp(SPLIT.source, "u").test(s);
