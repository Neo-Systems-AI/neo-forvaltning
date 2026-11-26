---
name: oppstart
description: Setter opp et repo for oppsettet i Neo - et kunderepo eller et repo for standardløsninger - eller skrur på en plugin til. Lager repoet som en kopi av malen i et tomt, privat repo, intervjuer, skriver kunde.yaml, .claude/neo.config.json med sandkassen, produksjonen og maskinklienten skriptene kaller sandkassen med, og CODEOWNERS, og skrur på pluginene. MCP-koblingen settes bare opp for pluginene som trenger den (data, monitoring). Kjør når et nytt repo skal lages fra neo-forvaltning-mal, eller når en plugin skal tas i bruk.
---

# Oppstarten

Målet er at repoet kan brukes etterpå: `/forvaltning:env` er grønn, `konfig.mjs token` får et token, og et snapshot av
sandkassen kan tas.

Snapshot, plan og gjennomføring går med skript som kaller Neo sitt API med en **maskinklient i sandkassen**, ikke
gjennom MCP. Svarene går ikke gjennom modellen, og den samme kommandoen virker lokalt og i en jobb i GitHub.

## 1. Opprettelsen

Hopp over dette når repoet finnes.

Repoet lages som en kopi av malens filer, ikke med «Use this template»: malen ligger på github.com og repoet på
GitHub Enterprise, og regelsettet krever PR for alt etter den første pushen.

1. **En org-admin** lager et tomt, privat repo i organisasjonen (kundens, eller vår for standardløsninger), uten
   README, lisens eller `.gitignore`.
2. Kopier malens filer inn, uten historikken:

   ```bash
   git clone --depth 1 https://github.com/Neo-Systems-AI/neo-forvaltning-mal.git <repo>
   cd <repo> && rm -rf .git && git init -b main
   git add -A && git commit -m "Fra neo-forvaltning-mal $(cat VERSION)"
   git remote add origin <adressen til det nye repoet> && git push -u origin main
   ```

3. **Den første pushen gjør org-admin**, som kan gå forbi regelsettet. Alt etter den går som PR.

## 2. Intervjuet

Spør om det som mangler, ett tema om gangen, og vis hva du har før du skriver:

1. **Typen:** kunderepo (`kunde`) eller repo for standardløsninger (`standard`). For en kunde: navnet og
   organisasjonsnummeret. For standardløsninger: partneren eller Neo, som eier dem.
2. **Hvem:** den som godkjenner endringer (navn og GitHub-bruker eller -team), og den som forvalter (kunden selv, Neo
   Systems, eller en partner med egen avtale).
3. **Miljøene:** `sandkasse` og `produksjon`, og adressen til Neo for hvert.
4. **Maskinklienten:** har org-admin laget en maskinklient i **sandkassen** (*API-klienter → Ny API-klient*, slaget
   «Maskin»)? Den trenger scopene for konfig: lese, endre og opprette for familiene i konfig-fila (sakstyper og flyter,
   felt, statussett, oppgavemal-sett, veivisere, relasjonsvisninger, behandlingsregler, maler, saksdatainstrukser og
   -maler, hendelsestyper). Neo viser klient-ID-en og hemmeligheten én gang. Klient-ID-en er ikke en hemmelighet;
   hemmeligheten legger admin i kundens hvelv, og den skal aldri stå i repoet eller i samtalen.
   - Klienten er bundet til sandkassen, og plan og apply virker bare der, så den kan aldri skrive i produksjonen.
   - Revisjonen i Neo viser maskinklienten. Godkjenningen av en endring er PR-en.
5. **Pluginene:** `forvaltning` og `solution` alltid. `monitoring` og `data` leser kjøringer og saker gjennom MCP med
   personens egen innlogging: bare når kunden vil det, og `data` leser personopplysninger. Pluginen for et system
   (`altinn`, `entra`, `documaster` …) når løsningene bruker systemet.

## 3. Skriv det

- **`kunde.yaml`:** `type`, `kunde` (navn og organisasjonsnummer), `godkjenner`, `forvalter`, og versjonene repoet er
  laget for under `verktoy` (malen fra `VERSION`, og `forvaltning`).
- **`.github/CODEOWNERS`:** `*` til godkjenneren, så alt i repoet krever godkjenningen. Det er det GitHub håndhever.
- **`.claude/neo.config.json`:** miljøene og maskinklienten, med hemmeligheten bare som referanse til kundens hvelv:

  ```json
  {
    "version": 1,
    "neo": {
      "environments": ["sandkasse", "produksjon"],
      "defaultEnv": "sandkasse",
      "byEnv": {
        "sandkasse": {
          "url": "https://<adressen>",
          "apiClient": {
            "clientId": "<klient-id>",
            "clientSecret": { "$env": "NEO_SANDKASSE_KLIENT_HEMMELIGHET", "kilde": "azure-keyvault:<hvelv>/<navn>" }
          }
        },
        "produksjon": { "url": "https://<adressen>" }
      }
    }
  }
  ```

  En del per plugin bare når pluginen trenger noe; sjekken av oppsettet sier hva. Referansene for et system kommer
  under `<system>.hemmeligheter` når systemet tas i bruk.
- **`.claude/settings.json`:** `enabledPlugins` med `<plugin>@neo-forvaltning: true` for hver plugin som skal på.
- **Bare når `monitoring` eller `data` er på:** `mcpServer` (`neo-<miljø>`) under `neo.byEnv.<miljø>`, og
  MCP-serveren med kommandoen fra Neo (*API-klienter → Koble til Claude*, slaget «Claude Code»):

  ```bash
  claude mcp add --scope project --transport http --client-id <klient-id> neo-<miljø> <adressen>/api/mcp
  ```

Commit på en gren og åpne en PR.

## 4. Sjekk det

1. Kjør sjekken av oppsettet (`/forvaltning:env`), og rett det den sier mangler, til den gir exit 0.
2. Be personen hente hemmeligheten til `.env.local` (`/forvaltning:hemmeligheter`; et menneske kjører hentingen, aldri
   agenten).
3. `node "${CLAUDE_PLUGIN_ROOT}/scripts/konfig.mjs" token`: maskinklienten får et token. Avviser Neo den, er klient-ID-en
   eller hemmeligheten feil, eller klienten er stengt.
4. `/forvaltning:snapshot`, og se at det som kommer, er fra org-en du venter. En 403 betyr at klienten mangler et
   scope; Neo sier hvilket.
5. Kjør repoets sjekk:

   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/sjekk.mjs" --base origin/main
   ```

6. Er `monitoring` eller `data` på: be personen logge inn med `/mcp` og starte Claude Code på nytt.

## Regler

- **Ingen hemmeligheter i noen fil.** Maskinklientens hemmelighet står bare som referanse til kundens hvelv.
- **Endre bare det som mangler.** Finnes en verdi, spør før den byttes.
