import { Redirect } from "expo-router";
import { useSession } from "../src/state/session";

export default function Index() {
  const session = useSession((s) => s.session);
  if (!session) return <Redirect href="/auth" />;
  return <Redirect href={session.kind === "parent" ? "/parent" : "/child"} />;
}
