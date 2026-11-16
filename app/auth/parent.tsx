import { useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { Field } from "../../src/components/Field";
import { Button, ErrorBox, Page, T, TopBar } from "../../src/components/ui";
import { postWithRetry, useSession } from "../../src/state/session";
import { space } from "../../src/theme/tokens";

export default function ParentLogin() {
  const save = useSession((s) => s.save);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const { status, data } = await postWithRetry("/auth/login", { email: email.trim(), password });
      if (status !== 200 || typeof data.accessToken !== "string" || typeof data.refreshToken !== "string") {
        throw new Error(typeof data.error === "string" ? data.error : "E-mail ou mot de passe incorrect.");
      }
      const user = data.user as { name?: string; email?: string };
      await save({ kind: "parent", accessToken: data.accessToken, refreshToken: data.refreshToken, name: user?.name ?? "", email: user?.email ?? email.trim() });
      router.replace("/parent");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Connexion impossible.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Page header={<TopBar title="Espace parent" />}>
      <T v="body">Connecte-toi avec ton compte Passerelle : tu retrouves ta famille et tu gères les révisions de tes enfants.</T>
      <View style={{ gap: space.lg }}>
        <Field label="E-mail" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" textContentType="emailAddress" />
        <Field label="Mot de passe" value={password} onChangeText={setPassword} secureTextEntry autoComplete="password" textContentType="password" onSubmitEditing={submit} />
      </View>
      {error ? <ErrorBox message={error} /> : null}
      <Button label="Se connecter" icon="log-in" loading={busy} disabled={!email.trim() || !password} onPress={submit} />
      <T v="small">Pas encore de compte ? Crée-le dans l'appli Passerelle, puis reviens ici. Le premier chargement peut prendre une minute : le serveur se réveille.</T>
    </Page>
  );
}
