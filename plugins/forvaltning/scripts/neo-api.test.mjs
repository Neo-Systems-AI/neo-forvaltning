import { test } from "node:test";
import assert from "node:assert/strict";
import { apiSettings, neoApi, neoToken, NeoApiError } from "./lib/neo-api.mjs";

// En oppdiktet verdi, bygget ved kjøring så den ikke ser ut som en nøkkel i fila.
const FAKE = ["ikke", "ekte", "verdi"].join("-");
const config = (apiClient) => ({
  version: 1,
  hvelv: "kv-test",
  neo: {
    environments: ["sandkasse"],
    defaultEnv: "sandkasse",
    byEnv: { sandkasse: { mcpServer: "neo-sandkasse", url: "https://neo.example/", apiClient } },
  },
});

const response = (status, body) => ({
  status,
  ok: status >= 200 && status < 300,
  headers: new Headers({ "content-type": "application/json" }),
  text: async () => JSON.stringify(body),
});

test("innstillingene: adressen uten skråstrek til slutt, og hemmeligheten er nøkkelen neo--<miljø>-klient, ikke i fila", () => {
  const data = config({ clientId: "klient-1" });
  const s = apiSettings(data);
  assert.deepEqual(s, { miljo: "sandkasse", url: "https://neo.example", clientId: "klient-1", nokkel: "neo--sandkasse-klient", data });
  assert.throws(() => apiSettings(config(undefined)), /apiClient er ikke satt/);
  assert.throws(() => apiSettings(config({ clientId: "klient-1", clientSecret: FAKE })), /clientSecret skal ikke stå i fila: hemmeligheten er nøkkelen neo--sandkasse-klient/);
  assert.throws(() => apiSettings(config({})), /clientId er ikke satt/);
});

test("tokenet: client_credentials med Basic, og en avvisning sier Neo sitt svar uten hemmeligheten", async () => {
  process.env.NEO_SANDKASSE_KLIENT = FAKE;
  const s = apiSettings(config({ clientId: "klient-1" }));
  let sent;
  const ok = await neoToken(s, {
    fetchImpl: async (url, init) => {
      sent = { url, init };
      return response(200, { access_token: "tok", expires_in: 3600, scope: "workflow:read" });
    },
  });
  assert.equal(sent.url, "https://neo.example/api/auth/oauth2/token");
  assert.equal(sent.init.headers.authorization, `Basic ${Buffer.from(`klient-1:${FAKE}`).toString("base64")}`);
  assert.equal(String(sent.init.body), "grant_type=client_credentials");
  assert.deepEqual(ok, { accessToken: "tok", expiresIn: 3600, scope: "workflow:read" });

  await assert.rejects(
    neoToken(s, { fetchImpl: async () => response(401, { error: "invalid_client", error_description: `feil ${FAKE}` }) }),
    (e) => /401 invalid_client/.test(e.message) && !e.message.includes(FAKE),
  );
});

test("et kall med tokenet, og en ikke-2xx blir NeoApiError med status", async () => {
  process.env.NEO_SANDKASSE_KLIENT = FAKE;
  const s = apiSettings(config({ clientId: "klient-1" }));
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
