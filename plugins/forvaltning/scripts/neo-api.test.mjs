import { test } from "node:test";
import assert from "node:assert/strict";
import { apiSettings, neoApi, neoToken, NeoApiError } from "./lib/neo-api.mjs";

const SECRET = "hemmelig-verdi-123";
const config = (apiClient) => ({
  version: 1,
  neo: {
    environments: ["sandkasse"],
    defaultEnv: "sandkasse",
    byEnv: { sandkasse: { mcpServer: "neo-sandkasse", url: "https://neo.example/", apiClient } },
  },
});
const ref = { $env: "NEO_TEST_KLIENT_HEMMELIGHET", kilde: "azure-keyvault:kv/neo" };

const response = (status, body) => ({
  status,
  ok: status >= 200 && status < 300,
  headers: new Headers({ "content-type": "application/json" }),
  text: async () => JSON.stringify(body),
});

test("innstillingene: adressen uten skråstrek til slutt, og hemmeligheten bare som referanse", () => {
  const s = apiSettings(config({ clientId: "klient-1", clientSecret: ref }));
  assert.deepEqual(s, { miljo: "sandkasse", url: "https://neo.example", clientId: "klient-1", clientSecret: ref });
  assert.throws(() => apiSettings(config(undefined)), /apiClient er ikke satt/);
  assert.throws(() => apiSettings(config({ clientId: "klient-1", clientSecret: SECRET })), /skal være en referanse/);
  assert.throws(() => apiSettings(config({ clientSecret: ref })), /clientId er ikke satt/);
});

test("tokenet: client_credentials med Basic, og en avvisning sier Neo sitt svar uten hemmeligheten", async () => {
  process.env.NEO_TEST_KLIENT_HEMMELIGHET = SECRET;
  const s = apiSettings(config({ clientId: "klient-1", clientSecret: ref }));
  let sent;
  const ok = await neoToken(s, {
    fetchImpl: async (url, init) => {
      sent = { url, init };
      return response(200, { access_token: "tok", expires_in: 3600, scope: "workflow:read" });
    },
  });
  assert.equal(sent.url, "https://neo.example/api/auth/oauth2/token");
  assert.equal(sent.init.headers.authorization, `Basic ${Buffer.from(`klient-1:${SECRET}`).toString("base64")}`);
  assert.equal(String(sent.init.body), "grant_type=client_credentials");
  assert.deepEqual(ok, { accessToken: "tok", expiresIn: 3600, scope: "workflow:read" });

  await assert.rejects(
    neoToken(s, { fetchImpl: async () => response(401, { error: "invalid_client", error_description: `feil ${SECRET}` }) }),
    (e) => /401 invalid_client/.test(e.message) && !e.message.includes(SECRET),
  );
});

test("et kall med tokenet, og en ikke-2xx blir NeoApiError med status", async () => {
  process.env.NEO_TEST_KLIENT_HEMMELIGHET = SECRET;
  const s = apiSettings(config({ clientId: "klient-1", clientSecret: ref }));
  const seen = [];
  const api = neoApi(s, {
    fetchImpl: async (url, init) => {
      seen.push([url, init.headers.authorization]);
      if (url.endsWith("/token")) return response(200, { access_token: "tok" });
      if (url.endsWith("/apply")) return response(409, { message: "PLAN_STALE" });
      return response(200, { ok: true });
    },
  });
  assert.deepEqual(await api.get("/api/config/export"), { ok: true });
  await assert.rejects(api.post("/api/config/apply", {}), (e) => e instanceof NeoApiError && e.status === 409);
  // Ett token per prosess.
  assert.equal(seen.filter(([u]) => u.endsWith("/token")).length, 1);
  assert.equal(seen.at(-1)[1], "Bearer tok");
});
