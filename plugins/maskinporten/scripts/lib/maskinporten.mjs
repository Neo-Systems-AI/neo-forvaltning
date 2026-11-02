// Maskinporten: token med JWT-grant (RS256), uten avhengigheter. Klienten, nøkkelen og virksomhetssertifikatet er
// kundens; vi har bare koden. Fiks og KRR bruker tokenet direkte; Altinn veksler det (se altinn-pluginen).
import { createPrivateKey, createPublicKey, createHash, createSign, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { call } from "./http.mjs";

export const HOSTS = { test: "https://test.maskinporten.no", produksjon: "https://maskinporten.no" };

// Maskinporten godtar høyst 180 sekunder mellom iat og exp; 120 er anbefalt.
const LIFETIME = 120;

const b64url = (buf) => Buffer.from(buf).toString("base64").replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");

// Nøkkelen fra en PEM-fil eller fra en PEM i miljøet. Uten kid brukes thumbprinten (RFC 7638), slik selvbetjeningen gjør.
export function loadKey({ keyFile, keyPem, kid }) {
  const pem = keyPem ?? readFileSync(keyFile, "utf8");
  const key = createPrivateKey(pem);
  if (kid) return { key, kid };
  const jwk = createPublicKey(key).export({ format: "jwk" });
  const thumb = b64url(createHash("sha256").update(JSON.stringify({ e: jwk.e, kty: jwk.kty, n: jwk.n })).digest());
  return { key, kid: thumb };
}

export function assertion({ issuer, clientId, scopes, key, kid, consumerOrg, now = Math.floor(Date.now() / 1000) }) {
  const header = b64url(JSON.stringify({ alg: "RS256", kid }));
  const claims = { aud: issuer, iss: clientId, scope: scopes.join(" "), iat: now, exp: now + LIFETIME, jti: randomUUID(), ...(consumerOrg ? { consumer_org: consumerOrg } : {}) };
  const payload = b64url(JSON.stringify(claims));
  const sig = createSign("RSA-SHA256").update(`${header}.${payload}`).sign(key);
  return `${header}.${payload}.${b64url(sig)}`;
}

// aud må være issuer slik Maskinporten selv oppgir den, så den slås opp i well-known i stedet for å hardkodes.
export async function token({ miljo, clientId, scopes, keyFile, keyPem, kid, consumerOrg, fetchImpl = fetch }) {
  const host = HOSTS[miljo];
  if (!host) throw new Error(`Ukjent Maskinporten-miljø «${miljo}». Miljøene: ${Object.keys(HOSTS).join(", ")}`);
  const wk = await call(`${host}/.well-known/oauth-authorization-server`, { fetchImpl });
  if (!wk.ok || !wk.body?.issuer || !wk.body?.token_endpoint) throw new Error(`Well-known feilet: ${wk.status}`);
  const { key, kid: usedKid } = loadKey({ keyFile, keyPem, kid });
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
