// Fødsels- og d-nummer og organisasjonsnummer: kontrollsifrene (mod 11) og maskeringen. Ett sted, så alle pluginene
// maskerer likt.

const control = (d, w) => {
  const r = 11 - (w.reduce((s, x, i) => s + x * d[i], 0) % 11);
  return r === 11 ? 0 : r;
};

// To kontrollsifre med faste vekter. Rest 10 gir ikke et gyldig nummer.
export function gyldigFnr(id) {
  if (!/^\d{11}$/.test(String(id))) return false;
  const d = [...String(id)].map(Number);
  const k1 = control(d, [3, 7, 6, 1, 8, 9, 4, 5, 2]);
  const k2 = control(d, [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]);
  return k1 !== 10 && k2 !== 10 && k1 === d[9] && k2 === d[10];
}

// Vektene 3 2 7 6 5 4 3 2. Rest 10 gir ikke et gyldig nummer.
export function gyldigOrgnr(orgnr) {
  if (!/^\d{9}$/.test(String(orgnr))) return false;
  const d = [...String(orgnr)].map(Number);
  const k = control(d, [3, 2, 7, 6, 5, 4, 3, 2]);
  return k !== 10 && k === d[8];
}

// De seks første sifrene og *****. Et tall på 11 sifre med gyldige kontrollsifre er et fødsels- eller d-nummer og
// maskeres; andre tall på 11 sifre står (saksnumre og beløp skal ikke forsvinne). Numrene personen selv har gitt
// (`kjente`), maskeres alltid, også med feil kontrollsifre.
export function maskFnr(text, kjente = []) {
  const known = new Set(kjente.map(String));
  return String(text).replace(/(?<!\d)\d{11}(?!\d)/g, (m) => (known.has(m) || gyldigFnr(m) ? `${m.slice(0, 6)}*****` : m));
}
