// Kall mot Neo sitt API fra et skript, med en maskinklient (OAuth `client_credentials`). For det som skal gå likt hver
// gang og ikke gjennom modellen: snapshot, plan og gjennomføring av oppsettet, og uttrekkene gjennomgangen leser.
//
// Maskinklienten opprettes av org-admin i Neo (API-klienter → Ny API-klient, slaget «maskin») i miljøet skriptene skal
// kalle, i praksis sandkassen. Den handler som en tjenestekonto med scopene admin ga den, og revisjonen i Neo viser
// API-klienten. Plan og apply av oppsettet virker bare i en sandkasse, så en klient i sandkassen kan aldri skrive i
// produksjonen.
//
// Config: `neo.byEnv.<miljø>.url` (adressen til Neo) og `neo.byEnv.<miljø>.apiClient`:
//   { "clientId": "…", "clientSecret": { "$env": "NEO_SANDKASSE_KLIENT_HEMMELIGHET", "kilde": "azure-keyvault:<hvelv>/<navn>" } }
// Hemmeligheten står bare som referanse; et menneske henter verdien til .env.local (/forvaltning:hemmeligheter).
import { value, secretValues } from "./hemmeligheter.mjs";
import { call, redact } from "./http.mjs";

const get = (o, path) => path.split(".").reduce((x, k) => (x && typeof x === "object" ? x[k] : undefined), o);

// Adressen og klienten for miljøet. Mangler noe, sies stien; en hemmelighet som står med verdi i fila, er en feil.
export function apiSettings(data, miljo) {
  const env = miljo ?? get(data, "neo.defaultEnv") ?? "sandkasse";
  const base = `neo.byEnv.${env}`;
  const url = get(data, `${base}.url`);
  const client = get(data, `${base}.apiClient`);
  if (typeof url !== "string" || !url.trim()) throw new Error(`${base}.url er ikke satt i .claude/neo.config.json. Se /forvaltning:env`);
  if (!client || typeof client !== "object") throw new Error(`${base}.apiClient er ikke satt: maskinklienten skriptene kaller Neo med. Se /forvaltning:oppstart`);
  if (typeof client.clientId !== "string" || !client.clientId) throw new Error(`${base}.apiClient.clientId er ikke satt`);
  if (!client.clientSecret || typeof client.clientSecret !== "object") {
    throw new Error(`${base}.apiClient.clientSecret skal være en referanse ({ "$env": …, "kilde": … }), ikke en verdi. Fjern verdien fra fila`);
  }
  return { miljo: env, url: url.trim().replace(/\/+$/, ""), clientId: client.clientId, clientSecret: client.clientSecret };
}

const basic = (user, password) => `Basic ${Buffer.from(`${user}:${password}`).toString("base64")}`;

// Et token for maskinklienten. Feiler det, sies Neo sitt svar, aldri hemmeligheten.
export async function neoToken(s, { fetchImpl = fetch } = {}) {
  const secret = value(s.clientSecret);
  const res = await call(`${s.url}/api/auth/oauth2/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json", authorization: basic(s.clientId, secret) },
    body: new URLSearchParams({ grant_type: "client_credentials" }),
    fetchImpl,
  });
  if (!res.ok || !res.body?.access_token) {
    const why = typeof res.body === "object" ? `${res.body.error ?? ""} ${res.body.error_description ?? ""}`.trim() : String(res.body).slice(0, 300);
    throw new Error(redact(`Neo avslo tokenet for maskinklienten (${s.clientId}): ${res.status} ${why}`, [secret]));
  }
  return { accessToken: res.body.access_token, expiresIn: res.body.expires_in ?? null, scope: res.body.scope ?? "" };
}

export class NeoApiError extends Error {
  constructor(method, path, status, body) {
    const detail = typeof body === "object" && body !== null ? (body.message ?? body.error ?? JSON.stringify(body).slice(0, 300)) : String(body).slice(0, 300);
    super(`${method} ${path} → ${status}: ${detail}`);
    this.status = status;
    this.body = body;
  }
}

// En klient med ett token per prosess. `get` og `post` gir svaret som JSON, og kaster `NeoApiError` på en ikke-2xx.
export function neoApi(s, { fetchImpl = fetch } = {}) {
  let token;
  const auth = async () => (token ??= (await neoToken(s, { fetchImpl })).accessToken);
  const send = async (method, path, body) => {
    const res = await call(`${s.url}${path}`, {
      method,
      headers: { accept: "application/json", authorization: `Bearer ${await auth()}`, ...(body === undefined ? {} : { "content-type": "application/json" }) },
      body,
      timeout: 120_000,
      fetchImpl,
    });
    if (!res.ok) throw new NeoApiError(method, path, res.status, res.body);
    return res.body;
  };
  return {
    settings: s,
    get: (path) => send("GET", path),
    post: (path, body) => send("POST", path, body),
    secrets: () => secretValues({ clientSecret: s.clientSecret }),
  };
}
