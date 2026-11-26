// Rå kall mot et eksternt system, slik vi gjør dem i labben når vi leter etter hvor en feil ligger: status, svar og
// tid, med hemmelighetene sladdet fra alt som skrives ut. Uten avhengigheter.
export const TIMEOUT_MS = 20_000;

export function redact(text, secrets = []) {
  let out = String(text);
  for (const s of secrets) if (s) out = out.split(s).join("[sladdet]");
  return out.replace(/(Bearer|Basic)\s+[A-Za-z0-9._~+/=-]{8,}/g, "$1 [sladdet]");
}

// Ett kall. Returnerer { status, ok, ms, headers, body } der body er JSON når svaret er JSON, ellers tekst.
export async function call(url, { method = "GET", headers = {}, body, timeout = TIMEOUT_MS, fetchImpl = fetch } = {}) {
  const started = Date.now();
  const res = await fetchImpl(url, {
    method,
    headers,
    body: body === undefined || typeof body === "string" || body instanceof URLSearchParams ? body : JSON.stringify(body),
    signal: AbortSignal.timeout(timeout),
  });
  const text = await res.text();
  let parsed = text;
  if ((res.headers.get?.("content-type") ?? "").includes("json") || /^\s*[[{]/.test(text)) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }
  return { status: res.status, ok: res.ok, ms: Date.now() - started, headers: Object.fromEntries(res.headers.entries?.() ?? []), body: parsed };
}

// Det som skrives ut: metode, adresse, status og tid først, så svaret. Alltid sladdet.
export function report(method, url, result, secrets = []) {
  const head = `${method} ${url} → ${result.status} (${result.ms} ms)`;
  const body = typeof result.body === "string" ? result.body : JSON.stringify(result.body, null, 2);
  return redact(`${head}\n${body}`, secrets);
}

export const basic = (user, password) => `Basic ${Buffer.from(`${user}:${password}`).toString("base64")}`;
