import { useState } from "react";
import { Pressable, View } from "react-native";
import { router } from "expo-router";
import { Field } from "../../src/components/Field";
import { Check } from "../../src/components/organize";
import { Button, ErrorBox, Page, Segmented, T, TopBar } from "../../src/components/ui";
import { postWithRetry, useSession } from "../../src/state/session";
import { color, space } from "../../src/theme/tokens";

// Espace parent : un seul compte pour Cervelle et Passerelle (même serveur).
//   - « Code par e-mail » : sans mot de passe ; crée aussi le compte d'une
//     nouvelle adresse (prénom + 15 ans ou plus) ;
//   - « Mot de passe » : pour un compte qui en a un (ex. créé dans Passerelle).

type Mode = "code" | "password";
type Step = "email" | "code" | "profile";

const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());

export default function ParentLogin() {
  const save = useSession((s) => s.save);
  const [mode, setMode] = useState<Mode>("code");
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [age15, setAge15] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function signedIn(data: Record<string, unknown>) {
    const user = data.user as { name?: string; email?: string } | undefined;
    await save({ kind: "parent", accessToken: String(data.accessToken), refreshToken: String(data.refreshToken), name: user?.name ?? "", email: user?.email ?? email.trim() });
    router.replace("/parent");
  }

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Connexion impossible. Vérifie ta connexion Internet et réessaie.");
    } finally {
      setBusy(false);
    }
  }

  const errorOf = (data: Record<string, unknown>, fallback: string) => new Error(typeof data.error === "string" ? data.error : fallback);

  const sendCode = (again = false) =>
    run(async () => {
      const { status, data } = await postWithRetry("/auth/email-code", { email: email.trim(), app: "cervelle" });
      if (status !== 200) throw errorOf(data, "L'e-mail n'a pas pu être envoyé. Réessaie dans un instant.");
      setStep("code");
      setCode("");
      if (again) setInfo("C'est renvoyé. Regarde aussi dans les courriers indésirables.");
    });

  const verify = () =>
    run(async () => {
      const body: Record<string, unknown> = { email: email.trim(), code: code.trim() };
      if (step === "profile") Object.assign(body, { name: name.trim(), age15 });
      const { status, data } = await postWithRetry("/auth/email-code/verify", body);
      if (status === 400 && data.code === "needs_profile") {
        if (step === "profile") throw errorOf(data, "Complète ton prénom.");
        setStep("profile");
        return;
      }
      if ((status !== 200 && status !== 201) || typeof data.accessToken !== "string") throw errorOf(data, "Ce code ne marche pas ou a expiré. Demande un nouveau code.");
      await signedIn(data);
    });

  const login = () =>
    run(async () => {
      const { status, data } = await postWithRetry("/auth/login", { email: email.trim(), password });
      if (status !== 200 || typeof data.accessToken !== "string") throw errorOf(data, "E-mail ou mot de passe incorrect.");
      await signedIn(data);
    });

  const switchMode = (m: Mode) => {
    setMode(m);
    setStep("email");
    setError(null);
    setInfo(null);
  };

  return (
    <Page header={<TopBar title="Espace parent" />}>
      <T v="body">Connecte-toi ou crée ton compte pour suivre les révisions de tes enfants. Tu as déjà Passerelle ? C'est le même compte.</T>
      <Segmented
        options={[
          { key: "code", label: "Code par e-mail" },
          { key: "password", label: "Mot de passe" },
        ]}
        value={mode}
        onChange={switchMode}
      />

      {mode === "password" ? (
        <>
          <View style={{ gap: space.lg }}>
            <Field label="E-mail" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" textContentType="emailAddress" />
            <Field label="Mot de passe" value={password} onChangeText={setPassword} secureTextEntry autoComplete="password" textContentType="password" onSubmitEditing={login} />
          </View>
          {error ? <ErrorBox message={error} /> : null}
          <Button label="Se connecter" icon="log-in" loading={busy} disabled={!isEmail(email) || !password} onPress={login} />
          <Pressable accessibilityRole="button" onPress={() => switchMode("code")} hitSlop={8}>
            <T v="bodyBold" style={{ color: color.brand, textAlign: "center" }}>
              Pas de compte ou mot de passe oublié ? Reçois un code par e-mail
            </T>
          </Pressable>
        </>
      ) : step === "email" ? (
        <>
          <Field label="E-mail" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" textContentType="emailAddress" onSubmitEditing={() => isEmail(email) && sendCode()} />
          <T v="small">On t'envoie un code à 6 chiffres. Pas de mot de passe à retenir. Si tu n'as pas encore de compte, il sera créé.</T>
          {error ? <ErrorBox message={error} /> : null}
          <Button label="Recevoir un code" icon="mail" loading={busy} disabled={!isEmail(email)} onPress={() => sendCode()} />
        </>
      ) : (
        <>
          <T v="body">
            Code envoyé à <T v="bodyBold">{email.trim()}</T>. Il marche 15 minutes.
          </T>
          <Field label="Code reçu par e-mail" value={code} onChangeText={(t) => setCode(t.replace(/\D/g, "").slice(0, 6))} keyboardType="number-pad" autoComplete="one-time-code" textContentType="oneTimeCode" maxLength={6} />
          {step === "profile" ? (
            <View style={{ gap: space.md }}>
              <T v="bodyBold">Bienvenue ! On crée ton compte.</T>
              <Field label="Ton prénom" value={name} onChangeText={setName} autoComplete="given-name" textContentType="givenName" />
              <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: age15 }} onPress={() => setAge15(!age15)} style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
                <Check on={age15} onPress={() => setAge15(!age15)} tint={color.brand} label="J'ai 15 ans ou plus" />
                <T v="body" style={{ flex: 1 }}>
                  J'ai 15 ans ou plus
                </T>
              </Pressable>
            </View>
          ) : null}
          {info ? <T v="small">{info}</T> : null}
          {error ? <ErrorBox message={error} /> : null}
          <Button
            label={step === "profile" ? "Créer mon compte" : "Continuer"}
            icon={step === "profile" ? "person-add" : "log-in"}
            loading={busy}
            disabled={code.length !== 6 || (step === "profile" && (!name.trim() || !age15))}
            onPress={verify}
          />
          <View style={{ flexDirection: "row", justifyContent: "space-between", gap: space.md }}>
            <Pressable accessibilityRole="button" onPress={() => setStep("email")} hitSlop={8}>
              <T v="bodyBold" style={{ color: color.muted }}>
                Changer d'e-mail
              </T>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => sendCode(true)} hitSlop={8} disabled={busy}>
              <T v="bodyBold" style={{ color: color.brand }}>
                Renvoyer le code
              </T>
            </Pressable>
          </View>
        </>
      )}
      <T v="small">La première connexion peut prendre une minute.</T>
    </Page>
  );
}
