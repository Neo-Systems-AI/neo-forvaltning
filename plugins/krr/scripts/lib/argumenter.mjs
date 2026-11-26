// Argumentene til skriptene: posisjonene i `_`, og flaggene. Et flagg som ikke er kjent, eller mangler verdien, er feil
// bruk (exit 2), aldri stille ignorert.
export class Usage extends Error {}

//   verdier: flagg med en verdi (--miljo test)   brytere: flagg uten (--json)   flere: flagg som kan gjentas (--param)
export function parse(argv, { verdier = [], brytere = [], flere = [] } = {}) {
  const out = { _: [] };
  for (const f of flere) out[f] = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) {
      out._.push(a);
      continue;
    }
    const name = a.slice(2);
    if (brytere.includes(name)) {
      out[name] = true;
      continue;
    }
    if (!verdier.includes(name) && !flere.includes(name)) throw new Usage(`Ukjent flagg --${name}`);
    const v = argv[++i];
    if (v === undefined || v.startsWith("--")) throw new Usage(`--${name} trenger en verdi`);
    if (flere.includes(name)) out[name].push(v);
    else out[name] = v;
  }
  return out;
}
