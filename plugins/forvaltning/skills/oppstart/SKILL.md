---
name: oppstart
description: Setter opp et repo for forvaltning av oppsettet i Neo, eller skrur på en plugin til: intervjuer, skriver .claude/neo.config.json og kunde.yaml, registrerer maskinklienten skriptene kaller sandkassen med, og skrur på pluginene i .claude/settings.json. MCP-koblingen settes bare opp for pluginene som trenger den (data, monitoring). Kjør i et nytt repo laget fra neo-forvaltning-mal, eller når en plugin skal tas i bruk.
---

# Oppstarten

Målet er at repoet kan brukes etterpå: `/forvaltning:env` er grønn, `konfig.mjs token` får et token, og et snapshot av
sandkassen kan tas.

Snapshot, plan og gjennomføring går med skript som kaller Neo sitt API med en **maskinklient i sandkassen**, ikke
gjennom MCP. Svarene går ikke gjennom modellen, og den samme kommandoen virker lokalt og i en jobb i GitHub.

## 1. Intervjuet

Spør om det som mangler, ett tema om gangen, og vis hva du har før du skriver:

1. **Kunden:** navn og organisasjonsnummer. Hvem godkjenner endringer (navn og GitHub-bruker eller -team)? Hvem
   forvalter: kunden selv, Neo Systems, eller en partner med egen avtale med kunden?
2. **Miljøene:** vanligvis `sandkasse` og `produksjon`. Adressen til Neo.
3. **Maskinklienten:** har org-admin laget en maskinklient i **sandkassen** (*API-klienter → Ny API-klient*, slaget
   «Maskin»)? Den trenger scopene for konfig: lese, endre og opprette for familiene i konfig-fila (sakstyper og flyter,
   felt, statussett, oppgavemal-sett, veivisere, relasjonsvisninger, behandlingsregler, maler, saksdatainstrukser og
   -maler, hendelsestyper). Neo viser klient-ID-en og hemmeligheten én gang. Klient-ID-en er ikke en hemmelighet;
   hemmeligheten legger admin i kundens hvelv, og den skal aldri stå i repoet eller i samtalen.
   - Klienten er bundet til sandkassen, og plan og apply virker bare der, så den kan aldri skrive i produksjonen.
   - Revisjonen i Neo viser maskinklienten. Godkjenningen av en endring er PR-en.
4. **Pluginene:** hvilke skal på? `forvaltning` alltid. `solution` er vanlig. `monitoring` og `data` leser kjøringer
   og saker gjennom MCP med personens egen innlogging: bare når kunden vil det, og `data` leser personopplysninger.
   `altinn` når kunden lager skjemaer.

## 2. Skriv det

- `.claude/neo.config.json`:
  - `neo.environments`, `neo.defaultEnv` (sandkassen), og `neo.byEnv.<miljø>.url` og `mcpServer` (`neo-<miljø>`).
  - `neo.byEnv.sandkasse.apiClient`: `{ "clientId": "<klient-id>", "clientSecret": { "$env":
    "NEO_SANDKASSE_KLIENT_HEMMELIGHET", "kilde": "<hvelvet og navnet, for eksempel azure-keyvault:kv-kunde/neo-sandkasse>" } }`.
    Bare referansen, aldri verdien.
  - En del per plugin bare når noe skal avvike fra standarden (se `/<plugin>:env`).
- `kunde.yaml`: kunden, godkjenneren og forvalteren.
- `.github/CODEOWNERS`: godkjenneren i stedet for `@ENDRE-MEG`.
- `.claude/settings.json`: `enabledPlugins` med `<plugin>@neo-forvaltning: true` for hver plugin som skal på.
- Bare når `monitoring` eller `data` er på: MCP-serveren for miljøet de skal lese, med kommandoen fra Neo
  (*API-klienter → Koble til Claude*, slaget «Claude Code») og navnet fra config-fila:

  ```bash
  claude mcp add --scope project --transport http --client-id <klient-id> neo-<miljø> <adresse>/api/mcp
  ```

## 3. Sjekk det

1. `/forvaltning:env` og `/<plugin>:env` for hver plugin som er på.
2. Be personen hente hemmeligheten til `.env.local` (`/forvaltning:hemmeligheter`; et menneske kjører hentingen, aldri
   agenten).
3. `node "${CLAUDE_PLUGIN_ROOT}/scripts/konfig.mjs" token`: maskinklienten får et token. Avviser Neo den, er klient-ID-en
   eller hemmeligheten feil, eller klienten er stengt.
4. `/forvaltning:snapshot`, og commit på en branch med en PR. En 403 her betyr at klienten mangler et scope; Neo sier
   hvilket.
5. Er `monitoring` eller `data` på: be personen logge inn med `/mcp` og starte Claude Code på nytt.
6. Før en rad i `beslutninger.md`: repoet er satt opp, med hvilke plugins.

## Regler

- Ingen hemmeligheter i noen fil. Maskinklientens hemmelighet står bare som referanse til kundens hvelv.
- Endre bare det som mangler. Finnes en verdi, spør før den byttes.
