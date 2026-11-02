---
name: oppstart
description: Setter opp et repo for forvaltning av oppsettet i Neo, eller skrur på en plugin til: intervjuer, skriver .claude/neo.config.json og kunde.yaml, kobler Claude Code til Neo sin MCP-server per miljø og skrur på pluginene i .claude/settings.json. Kjør i et nytt repo laget fra neo-forvaltning-mal, eller når en plugin skal tas i bruk.
---

# Oppstarten

Målet er at repoet kan brukes etterpå: `/forvaltning:env` er grønn, og et snapshot av sandkassen kan tas.

## 1. Intervjuet

Spør om det som mangler, ett tema om gangen, og vis hva du har før du skriver:

1. **Kunden:** navn og organisasjonsnummer. Hvem godkjenner endringer (navn og GitHub-bruker eller -team)? Hvem
   forvalter: kunden selv, Neo Systems, eller en partner med egen avtale med kunden?
2. **Miljøene:** vanligvis `sandkasse` og `produksjon`. Adressen til Neo.
3. **Koblingen:** har org-admin laget en kobling for Claude Code i Neo (*API-klienter → Koble til Claude*, slaget
   «Claude Code»), én per miljø? Neo viser en kommando med klient-ID-en. Den er ikke en hemmelighet.
4. **Pluginene:** hvilke skal på? `forvaltning` alltid. `helse`, `konfig` og `ki` er vanlige. `datalag` leser
   saker med personopplysninger, så den skrus bare på når kunden vil det. `altinn` når kunden lager skjemaer.

## 2. Skriv det

- `.claude/neo.config.json`: `neo.environments`, `neo.defaultEnv` (sandkassen), og `neo.byEnv.<miljø>.mcpServer`
  (`neo-<miljø>`) og `url`. En del per plugin bare når noe skal avvike fra standarden (se `/<plugin>:env`).
- `kunde.yaml`: kunden, godkjenneren og forvalteren.
- `.github/CODEOWNERS`: godkjenneren i stedet for `@ENDRE-MEG`.
- `.claude/settings.json`: `enabledPlugins` med `<plugin>@neo-forvaltning: true` for hver plugin som skal på.
- MCP-serverne, én per miljø, med kommandoen fra Neo og navnet fra config-fila:

  ```bash
  claude mcp add --scope project --transport http --client-id <klient-id> neo-sandkasse <adresse>/api/mcp
  ```

## 3. Sjekk det

1. `/forvaltning:env` og `/<plugin>:env` for hver plugin som er på.
2. Be personen logge inn med `/mcp` (det kan ikke gjøres for dem), og start Claude Code på nytt så pluginene lastes.
3. `/forvaltning:snapshot sandkasse`, og commit på en branch med en PR.
4. Før en rad i `beslutninger.md`: repoet er satt opp, med hvilke plugins.

## Regler

- Ingen hemmeligheter i noen fil. Innloggingen er personens egen.
- Endre bare det som mangler. Finnes en verdi, spør før den byttes.
