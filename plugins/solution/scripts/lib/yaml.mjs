// En liten YAML-leser for repoet, så sjekkene ikke har avhengigheter. Den leser det repoet bruker: kart og lister
// med innrykk, lister og kart på én eller flere linjer i hakeparentes og krøllparentes, strenger med og uten anførsel,
// tall, true/false/null, kommentarer, og tekstblokker med «>» og «|». Det den ikke forstår (ankre, tagger, flere
// dokumenter, nøkler i flere linjer), gir en feil med linjenummeret. Ingenting gjettes.

export class YamlFeil extends Error {
  constructor(melding, linje) {
    super(`linje ${linje}: ${melding}`);
    this.linje = linje;
  }
}

// Tar bort en kommentar som ikke står inne i en streng.
function utenKommentar(s) {
  let q = null;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) {
      if (c === q && s[i - 1] !== "\\") q = null;
    } else if (c === '"' || c === "'") q = c;
    else if (c === "#" && (i === 0 || /\s/.test(s[i - 1]))) return s.slice(0, i).trimEnd();
  }
  return s.trimEnd();
}

function skalar(s, linje) {
  const v = s.trim();
  if (v === "" || v === "~" || v === "null") return null;
  if (v === "true") return true;
  if (v === "false") return false;
  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
  if (v.startsWith('"')) {
    if (!v.endsWith('"') || v.length < 2) throw new YamlFeil(`strengen slutter ikke: ${v}`, linje);
    return JSON.parse(v);
  }
  if (v.startsWith("'")) {
    if (!v.endsWith("'") || v.length < 2) throw new YamlFeil(`strengen slutter ikke: ${v}`, linje);
    return v.slice(1, -1).replace(/''/g, "'");
  }
  if (/^[&*!|>@`]/.test(v)) throw new YamlFeil(`leseren forstår ikke ${v[0]} her`, linje);
  return v;
}

// Leser en verdi i flytform ([…] eller {…}) fra posisjon i, og gir verdien og posisjonen etter den.
function flyt(s, i, linje) {
  const hopp = () => {
    while (i < s.length && /\s/.test(s[i])) i++;
  };
  const enkel = (stopp) => {
    hopp();
    if (s[i] === "[" || s[i] === "{") return verdi();
    if (s[i] === '"' || s[i] === "'") {
      const q = s[i];
      let j = i + 1;
      while (j < s.length && !(s[j] === q && s[j - 1] !== "\\")) j++;
      const v = skalar(s.slice(i, j + 1), linje);
      i = j + 1;
      return v;
    }
    let j = i;
    while (j < s.length && !stopp.includes(s[j])) j++;
    const v = skalar(s.slice(i, j), linje);
    i = j;
    return v;
  };
  const verdi = () => {
    hopp();
    if (s[i] === "[") {
      i++;
      const out = [];
      for (;;) {
        hopp();
        if (s[i] === "]") return i++, out;
        out.push(enkel(",]"));
        hopp();
        if (s[i] === ",") i++;
        else if (s[i] !== "]") throw new YamlFeil("lista mangler «]»", linje);
      }
    }
    if (s[i] === "{") {
      i++;
      const out = {};
      for (;;) {
        hopp();
        if (s[i] === "}") return i++, out;
        let j = i;
        while (j < s.length && s[j] !== ":") j++;
        if (j >= s.length) throw new YamlFeil("kartet mangler «:»", linje);
        const k = String(skalar(s.slice(i, j), linje));
        i = j + 1;
        out[k] = enkel(",}");
        hopp();
        if (s[i] === ",") i++;
        else if (s[i] !== "}") throw new YamlFeil("kartet mangler «}»", linje);
      }
    }
    return enkel(",]}");
  };
  const v = verdi();
  return [v, i];
}

export function parseYaml(tekst) {
  // Linjene med innrykk, uten tomme linjer og kommentarlinjer. Flytverdier over flere linjer slås sammen.
  const raa = tekst.replace(/\r\n/g, "\n").split("\n");
  const linjer = [];
  for (let n = 0; n < raa.length; n++) {
    const l = raa[n];
    if (/^\s*(#.*)?$/.test(l)) continue;
    if (/^(---|\.\.\.)\s*$/.test(l)) {
      if (linjer.length) throw new YamlFeil("flere dokumenter i én fil", n + 1);
      continue;
    }
    if (/\t/.test(l.match(/^\s*/)[0])) throw new YamlFeil("tabulator i innrykket", n + 1);
    linjer.push({ n: n + 1, inn: l.match(/^ */)[0].length, tekst: l.trim(), raa: l });
  }

  let p = 0;
  const feil = (m) => new YamlFeil(m, linjer[Math.min(p, linjer.length - 1)]?.n ?? 0);

  // Resten av verdien etter «nøkkel:» eller «- »: en skalar, en flytverdi (kan fortsette på linjene under), eller en
  // tekstblokk.
  function inline(rest, inn, n) {
    const r = utenKommentar(rest).trim();
    if (r === "") return undefined;
    if (r === ">" || r === "|" || r === ">-" || r === "|-") {
      const deler = [];
      let blokkInn = null;
      // Tekstblokken leses fra de rå linjene, så tomme linjer i den teller med.
      while (p < linjer.length && linjer[p].inn > inn) {
        blokkInn ??= linjer[p].inn;
        deler.push(linjer[p].raa.slice(blokkInn));
        p++;
      }
      const t = r.startsWith(">") ? deler.join(" ") : deler.join("\n");
      return r.endsWith("-") ? t : `${t}\n`;
    }
    if (r[0] === "[" || r[0] === "{") {
      let s = r;
      for (;;) {
        try {
          const [v, i] = flyt(s, 0, n);
          if (s.slice(i).trim()) throw new YamlFeil(`tekst etter verdien: ${s.slice(i).trim()}`, n);
          return v;
        } catch (e) {
          if (p < linjer.length && linjer[p].inn > inn && /mangler/.test(e.message)) {
            s += ` ${utenKommentar(linjer[p].tekst)}`;
            p++;
          } else throw e;
        }
      }
    }
    return skalar(r, n);
  }

  function blokk(inn) {
    if (p >= linjer.length) return null;
    const l = linjer[p];
    if (l.inn !== inn) throw feil(`uventet innrykk (${l.inn}, ventet ${inn})`);
    return l.tekst.startsWith("- ") || l.tekst === "-" ? liste(inn) : kart(inn);
  }

  function underverdi(inn, l, rest) {
    const v = inline(rest, inn, l.n);
    if (v !== undefined) return v;
    if (p < linjer.length && linjer[p].inn > inn) return blokk(linjer[p].inn);
    // En liste under en nøkkel kan stå på samme innrykk som nøkkelen.
    if (p < linjer.length && linjer[p].inn === inn && linjer[p].tekst.startsWith("- ")) return liste(inn);
    return null;
  }

  function kart(inn) {
    const out = {};
    while (p < linjer.length && linjer[p].inn === inn && !linjer[p].tekst.startsWith("- ")) {
      const l = linjer[p];
      const m = /^("[^"]*"|'[^']*'|[^:#{[\]]+?)\s*:(\s+(.*)|)$/.exec(l.tekst);
      if (!m) throw feil(`forventet «nøkkel: verdi», fikk: ${l.tekst}`);
      const k = String(skalar(m[1], l.n));
      if (k in out) throw feil(`nøkkelen ${k} står to ganger`);
      p++;
      out[k] = underverdi(inn, l, m[3] ?? "");
    }
    return out;
  }

  function liste(inn) {
    const out = [];
    while (p < linjer.length && linjer[p].inn === inn && (linjer[p].tekst.startsWith("- ") || linjer[p].tekst === "-")) {
      const l = linjer[p];
      const rest = l.tekst === "-" ? "" : l.tekst.slice(2);
      const elInn = inn + 2;
      // «- nøkkel: verdi» starter et kart som fortsetter på linjene under med innrykket til nøkkelen.
      if (/^("[^"]*"|'[^']*'|[^:#{[\]"']+?)\s*:(\s|$)/.test(rest)) {
        linjer[p] = { ...l, inn: elInn + (rest.length - rest.trimStart().length), tekst: rest.trim() };
        out.push(kart(linjer[p].inn));
      } else {
        p++;
        out.push(underverdi(inn, l, rest));
      }
    }
    return out;
  }

  if (!linjer.length) return null;
  const v = blokk(linjer[0].inn);
  if (p < linjer.length) throw feil(`kunne ikke lese videre: ${linjer[p].tekst}`);
  return v;
}
