# neo-forvaltning

Neo Systems sine offentlige plugins til Claude Code, og sjekken av et kunderepo. Repoet er offentlig: alt som
committes, kan leses av alle.

## Regler

- **Bare det en kunde eller partner skal bruke.** Det som er internt hos Neo Systems, hører ikke hjemme her.
- **Ingenting om en enkelt kunde**, heller ikke som eksempel. Bruk oppdiktede eksempler.
- **Ingen hemmeligheter.** Innloggingen er alltid personens egen; et token eller en verdi står aldri i en fil.
- **Tynn mal, tykke plugins:** innhold og logikk hører hjemme her, i en versjonert plugin. Malen
  (`neo-forvaltning-mal`) har bare struktur og regler, og henter sjekken herfra.
- **Én sjekk, ett sted:** kilden står i `check/`, og bygges med `node check/build.mjs` til
  `plugins/forvaltning/scripts/sjekk.mjs`. Den bygde fila endres aldri for hånd; CI stopper når den ikke er fersk. Bare
  sjekken leser YAML; `forvaltning` bruker den samme leseren gjennom sjekken. En systemplugin leser bare JSON.
- **Generert kode er merket** i `.gitattributes` (`linguist-generated`): sjekken, kopiene i `plugins/*/scripts/lib/` og
  lockfila. Diffen viser da det som er skrevet for hånd.
- **Et skript som kjøres direkte,** løser opp stiene med `realpathSync` på begge sider før det sammenligner
  `process.argv[1]` med seg selv. Ellers kjører ingenting gjennom en symlenke, med exit 0.
- **Ett bibliotek:** det skriptene deler (config-fila, hemmelighetene, fødselsnummer og mod 11, argumentene, kallene,
  Maskinporten), står i `shared/`, og kopieres inn i pluginene med `node scripts/sync-shared.mjs` etter importene.
  Ingen kopier av samme logikk i pluginene.
- **Dokumentasjonen står i pluginen som bruker den** (`plugins/<plugin>/docs/`). `docs/` i roten er bare inngangen med
  lenker. Stegene står ett sted: oppskriften er det kunden leser, skillen har rekkefølgen, kontrollen og feilene, og
  kommandoene som er like hver gang, står i et skript.
- **En skill sier hva, ikke hvor,** viser ikke til andre skills, og har ingen historikk eller datoer. Løypa beskrives
  én gang, i README-en til `solution`. `check` stopper en henvisning til en annen skill, en dato, og en henvisning til
  en skill som ikke finnes, i alle filer.
- **Ingen stille fallbacks:** mangler noe, sier skriptet hva og gir en feilkode.
- **Versjonen bumpes to steder** (`plugin.json` og `.claude-plugin/marketplace.json`), minor for noe nytt, patch for en
  fiks. Beskrivelsen står bare i `plugin.json`.
- **Alt til `main` går gjennom PR** med `check` grønn, med merge commit.
- Teksten er norsk. Stier i hooks og skript bruker `${CLAUDE_PLUGIN_ROOT}`.
- Digdirs skills i `plugins/altinn` endres aldri for hånd: `node plugins/altinn/scripts/sync-skills.mjs` henter dem.
