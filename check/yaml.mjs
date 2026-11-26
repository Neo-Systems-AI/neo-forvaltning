// YAML leses med pakken `yaml`, den samme leseren Neo bruker for konfigfilene, med låst versjon i package.json. En
// nøkkel som står to ganger i samme kart, er en feil. Feilen sier linjen. Bygget til `shared/yaml.mjs`, så pluginene
// leser YAML på samme måte som sjekken.
import { parse } from "yaml";

export function parseYaml(text) {
  try {
    return parse(text, { uniqueKeys: true });
  } catch (e) {
    const line = e.linePos?.[0]?.line;
    const message = String(e.message).split("\n")[0].replace(/ at line \d+, column \d+:?$/, "");
    throw new Error(line ? `linje ${line}: ${message}` : message);
  }
}
