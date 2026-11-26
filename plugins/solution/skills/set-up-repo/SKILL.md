---
name: set-up-repo
description: Setter opp et repo for oppsettet i Neo - et kunderepo eller et repo for standardløsninger - eller skrur på en plugin til. Lager repoet som en kopi av malen i et tomt, privat repo, intervjuer, skriver repo.yaml, .claude/neo.config.json og CODEOWNERS, skrur på pluginene, legger til MCP-serveren og ber personen logge inn. Kjør når et nytt repo skal lages fra neo-forvaltning-mal, eller når en plugin skal tas i bruk.
---

# Oppsettet av repoet

Målet er et repo der konfigen kan hentes fra Neo og planlegges mot sandkassen: sjekken av oppsettet gir exit 0, og
MCP-serveren svarer med personens egen innlogging fra org-en i config-fila.

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
   organisasjonsnummeret.
2. **Hvem:** eieren, den som forvalter (kunden selv, Neo Systems, eller en partner med egen avtale), og den som
   godkjenner endringer (en GitHub-bruker eller et team).
3. **Neo:** adressen, og org-en med sandkassen konfigen skrives til.
4. **Koblingen:** en org-admin har laget en kobling for Claude Code i Neo (*API-klienter → Koble til Claude*, slaget
   «Claude Code»). Neo viser en kommando med klient-ID-en; den er ikke en hemmelighet.
5. **Pluginene:** `solution` alltid, `monitoring` for helsa. `data` leser saker med personopplysninger, så den skrus
   bare på når kunden vil det. Pluginen for et system (`altinn`, `entra`, `documaster` …) når løsningene bruker
   systemet.

## 3. Skriv det

- **`repo.yaml`:** `type`, `eier` (navn, og organisasjonsnummer for en kunde) og `forvalter` (navn og github).
  Godkjenneren står ikke her.
- **`.github/CODEOWNERS`:** `*` til godkjenneren, så alt i repoet krever godkjenningen. Det er det GitHub håndhever.
- **`.claude/neo.config.json`:** ett miljø, og ingen hemmeligheter (referansene til hvelvet kommer under
  `<system>.hemmeligheter` når et system tas i bruk):

  ```json
  { "version": 2, "neo": { "url": "https://<adressen>", "org": "<org-en>", "mcpServer": "neo-development" } }
  ```

  En del per plugin bare når pluginen trenger noe; sjekken av oppsettet sier hva.
- **`.claude/settings.json`:** `enabledPlugins` med `<plugin>@neo-forvaltning: true` for hver plugin som skal på.
- **MCP-serveren**, med kommandoen fra Neo og navnet fra config-fila:

  ```bash
  claude mcp add --scope project --transport http --client-id <klient-id> neo-development <adressen>/api/mcp
  ```

Commit på en gren og åpne en PR.

## 4. Sjekk det

1. Be personen logge inn med `/mcp` og velge serveren. Det kan ikke gjøres for hen. Start Claude Code på nytt, så
   pluginene lastes.
2. Kjør sjekken av oppsettet, og rett det den sier mangler, til den gir exit 0:

   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/check-setup.mjs"
   ```

3. Kall `export_config`, og se at svaret kommer fra org-en i config-fila. Er det en annen org, er koblingen laget i
   feil org.
4. Kjør repoets sjekk:

   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/sjekk.mjs" --base origin/main
   ```

## Regler

- **Ingen hemmeligheter i noen fil.** Innloggingen er personens egen.
- **Endre bare det som mangler.** Finnes en verdi, spør før den byttes.
