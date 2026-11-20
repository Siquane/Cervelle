import { ApiError } from "../../api/client";

// In-memory files instead of the phone's mockDisk.
const mockDisk = new Map<string, string>();
jest.mock("expo-file-system", () => {
  class Directory {
    uri: string;
    constructor(...parts: (string | { uri: string })[]) {
      this.uri = parts.map((p) => (typeof p === "string" ? p : p.uri)).join("/");
    }
    get exists() {
      return true;
    }
    create() {}
  }
  class File {
    uri: string;
    constructor(dir: { uri: string }, name: string) {
      this.uri = `${dir.uri}/${name}`;
    }
    get exists() {
      return mockDisk.has(this.uri);
    }
    write(s: string) {
      mockDisk.set(this.uri, s);
    }
    textSync() {
      return mockDisk.get(this.uri) ?? "";
    }
  }
  return { Directory, File, Paths: { document: { uri: "doc" } } };
});

import { flushOutbox, queueOffline, readOffline, useOffline, withOffline } from "../offline";

const offlineError = () => new ApiError(0, "Pas de connexion au serveur.");

beforeEach(() => {
  mockDisk.clear();
  useOffline.getState().set(false);
});

test("keeps a copy and falls back to it without network", async () => {
  expect(await withOffline("revision-me-r1", async () => ({ title: "Versailles" }))).toEqual({ title: "Versailles" });
  expect(await withOffline("revision-me-r1", async () => Promise.reject(offlineError()))).toEqual({ title: "Versailles" });
  expect(useOffline.getState().offline).toBe(true);
  // Back online: the flag goes down.
  await withOffline("revision-me-r1", async () => ({ title: "Versailles !" }));
  expect(useOffline.getState().offline).toBe(false);
});

test("still fails when nothing was kept, or on a server error", async () => {
  await expect(withOffline("revision-me-r2", async () => Promise.reject(offlineError()))).rejects.toBeInstanceOf(ApiError);
  await withOffline("revision-me-r3", async () => 1);
  await expect(withOffline("revision-me-r3", async () => Promise.reject(new ApiError(500, "Oups")))).rejects.toThrow("Oups");
});

test("sends the outbox in order, keeps it while offline, drops what the server refuses", async () => {
  queueOffline("/a", { n: 1 });
  queueOffline("/b", { n: 2 });
  queueOffline("/c", { n: 3 });
  const sent: string[] = [];
  // First try: /a goes, /b finds no network → stops, /b and /c wait.
  await flushOutbox(async (path) => {
    if (path === "/b") throw offlineError();
    sent.push(path);
  });
  expect(sent).toEqual(["/a"]);
  expect(readOffline<{ path: string }[]>("outbox")?.map((p) => p.path)).toEqual(["/b", "/c"]);
  // Second try: /b is refused (dropped), /c goes.
  await flushOutbox(async (path) => {
    if (path === "/b") throw new ApiError(400, "Question supprimée");
    sent.push(path);
  });
  expect(sent).toEqual(["/a", "/c"]);
  expect(readOffline("outbox")).toEqual([]);
});
