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
   - **Sandkassen:** «Full tilgang». Det er der Claude planlegger og gjennomfører.
   - **Produksjonen:** «Bare lesing». Claude trenger bare å lese der (snapshot, og `check_config_refs` før
     promoteringen), og skrive-verktøyene finnes da ikke for koblingen, så Claude kan ikke endre produksjonen ved en
     feil. Viser ikke Neo valget, eller har produksjonen ikke «Koble til Claude» (en vanlig organisasjon får det bare
     når Neo har skrudd det på), settes produksjonen ikke opp; si det, og si at snapshot av produksjonen og sjekken før
     promoteringen da gjøres for hånd.
   - Er en eksisterende produksjonskobling «Full tilgang», be org-admin lage en ny med «Bare lesing» og slette den
     gamle. Tilgangen kan ikke endres på en kobling som finnes.
4. **Pluginene:** hvilke skal på? `forvaltning` alltid. `solution` og `monitoring` er vanlige. `data` leser
   saker med personopplysninger, så den skrus bare på når kunden vil det. `altinn` når kunden lager skjemaer.

## 2. Skriv det

- `.claude/neo.config.json`: `neo.environments`, `neo.defaultEnv` (sandkassen), og `neo.byEnv.<miljø>.mcpServer`
  (`neo-<miljø>`) og `url`. En del per plugin bare når noe skal avvike fra standarden (se `/<plugin>:env`).
- `kunde.yaml`: kunden, godkjenneren og forvalteren.
- `.github/CODEOWNERS`: godkjenneren i stedet for `@ENDRE-MEG`.
- `.claude/settings.json`: `enabledPlugins` med `<plugin>@neo-forvaltning: true` for hver plugin som skal på.
- MCP-serverne, én per miljø, med kommandoen fra Neo og navnet fra config-fila. Hver har klient-ID-en fra sin egen
  kobling (sandkassens med full tilgang, produksjonens med bare lesing):

  ```bash
  claude mcp add --scope project --transport http --client-id <klient-id fra sandkassen>  neo-sandkasse  <adresse>/api/mcp
  claude mcp add --scope project --transport http --client-id <klient-id fra produksjonen> neo-produksjon <adresse>/api/mcp
  ```

  Personen logger inn på hver av dem med `/mcp`, og må være medlem av begge organisasjonene.

## 3. Sjekk det

1. `/forvaltning:env` og `/<plugin>:env` for hver plugin som er på.
2. Be personen logge inn med `/mcp` (det kan ikke gjøres for dem), og start Claude Code på nytt så pluginene lastes.
3. `/forvaltning:snapshot sandkasse`, og commit på en branch med en PR.
4. Før en rad i `beslutninger.md`: repoet er satt opp, med hvilke plugins.

## Regler

- Ingen hemmeligheter i noen fil. Innloggingen er personens egen.
- Endre bare det som mangler. Finnes en verdi, spør før den byttes.
