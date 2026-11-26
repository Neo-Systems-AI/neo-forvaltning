// Maskinporten: token med JWT-grant (RS256), uten avhengigheter. Klientene beskrives ett sted, i
// `maskinporten.klienter.<navn>` i config-fila (clientId, kid, scopes), for miljøet i `maskinporten.miljo`. Altinn, Fiks
// og KRR viser til en klient med navn. Nøkkelen er referansen `maskinporten.hemmeligheter.<navn>-nokkel`,
// en PEM i hvelvet, hentet for kjøringen. Klienten, nøkkelen og virksomhetssertifikatet er kundens; vi har koden.
import { createHash, createPrivateKey, createPublicKey, createSign, randomUUID } from "node:crypto";
import { get, need } from "./neo-config.mjs";
import { ref, secret } from "./hemmeligheter.mjs";
import { call } from "./http.mjs";

export const HOSTS = { test: "https://test.maskinporten.no", produksjon: "https://maskinporten.no" };

// Maskinporten godtar høyst 180 sekunder mellom iat og exp; 120 er anbefalt.
const LIFETIME = 120;
const b64url = (buf) => Buffer.from(buf).toString("base64").replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");

// Nøkkelen fra en PEM. Uten kid brukes thumbprinten (RFC 7638), slik selvbetjeningen gjør.
export function loadKey(pem, kid) {
  const key = createPrivateKey(pem);
  if (kid) return { key, kid };
  const jwk = createPublicKey(key).export({ format: "jwk" });
  return { key, kid: b64url(createHash("sha256").update(JSON.stringify({ e: jwk.e, kty: jwk.kty, n: jwk.n })).digest()) };
}

export function assertion({ issuer, clientId, scopes, key, kid, consumerOrg, now = Math.floor(Date.now() / 1000) }) {
  const header = b64url(JSON.stringify({ alg: "RS256", kid }));
  const claims = { aud: issuer, iss: clientId, scope: scopes.join(" "), iat: now, exp: now + LIFETIME, jti: randomUUID(), ...(consumerOrg ? { consumer_org: consumerOrg } : {}) };
  const payload = b64url(JSON.stringify(claims));
  return `${header}.${payload}.${b64url(createSign("RSA-SHA256").update(`${header}.${payload}`).sign(key))}`;
}

// aud må være issuer slik Maskinporten selv oppgir den, så den slås opp i well-known i stedet for å hardkodes.
export async function token({ miljo, clientId, scopes, pem, kid, consumerOrg, fetchImpl = fetch }) {
  const host = HOSTS[miljo];
  if (!host) throw new Error(`Ukjent Maskinporten-miljø «${miljo}». Miljøene: ${Object.keys(HOSTS).join(", ")}`);
  const wk = await call(`${host}/.well-known/oauth-authorization-server`, { fetchImpl });
  if (!wk.ok || !wk.body?.issuer || !wk.body?.token_endpoint) throw new Error(`Well-known feilet: ${wk.status}`);
  const { key, kid: usedKid } = loadKey(pem, kid);
  const res = await call(wk.body.token_endpoint, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: assertion({ issuer: wk.body.issuer, clientId, scopes, key, kid: usedKid, consumerOrg }) }),
    fetchImpl,
  });
  if (!res.ok || !res.body?.access_token) {
    const why = typeof res.body === "object" ? `${res.body.error ?? ""} ${res.body.error_description ?? ""}`.trim() : String(res.body).slice(0, 300);
    throw new Error(`Maskinporten avslo: ${res.status} ${why}`);
  }
  return { accessToken: res.body.access_token, scope: res.body.scope ?? "", expiresIn: res.body.expires_in };
}

// Klienten med navnet, for miljøet i maskinporten.miljo. Et system i et annet miljø enn klientene er en feil, ikke en
// stille blanding av test og produksjon.
export function klient(data, navn, { miljo } = {}) {
  if (!navn) throw new Error("Si hvilken Maskinporten-klient (navnet under maskinporten.klienter)");
  const klienter = get(data, "maskinporten.klienter") ?? {};
  if (!klienter[navn]) throw new Error(`Klienten «${navn}» står ikke under maskinporten.klienter${Object.keys(klienter).length ? ` (der står: ${Object.keys(klienter).join(", ")})` : ""}`);
  const env = need(data, "maskinporten.miljo", `miljøet klientene er registrert i (${Object.keys(HOSTS).join(" eller ")})`);
  if (!HOSTS[env]) throw new Error(`maskinporten.miljo er «${env}». Miljøene: ${Object.keys(HOSTS).join(", ")}`);
  if (miljo && miljo !== env) throw new Error(`Klientene i maskinporten.klienter er for ${env}, men kallet går mot ${miljo}. Bytt maskinporten.miljo og klientene sammen`);
  const k = klienter[navn];
  const sted = `maskinporten.klienter.${navn}`;
  if (!k.clientId) throw new Error(`clientId mangler for ${sted}`);
  return { navn, sted, miljo: env, clientId: k.clientId, kid: k.kid, scopes: k.scopes ?? [] };
}

// Et token for klienten med navnet. Nøkkelen hentes fra hvelvet for kjøringen; verdien legges i `secrets` så den sladdes.
export async function tokenFor({ data, navn, miljo, scopes, consumerOrg, fetchImpl = fetch, hemmelighet = secret, secrets = [] }) {
  const k = klient(data, navn, { miljo });
  const wanted = scopes?.length ? scopes : k.scopes;
  if (!wanted.length) throw new Error(`Ingen scopes for ${k.sted}. Sett scopes der, eller bruk --scope`);
  const pem = hemmelighet(ref(data, "maskinporten", `${navn}-nokkel`));
  secrets.push(pem);
  const t = await token({ miljo: k.miljo, clientId: k.clientId, scopes: wanted, pem, kid: k.kid, consumerOrg, fetchImpl });
  secrets.push(t.accessToken);
  return { klient: k, ba: wanted, ...t };
}
