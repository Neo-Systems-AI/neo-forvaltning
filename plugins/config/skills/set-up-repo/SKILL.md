---
name: set-up-repo
description: Setter opp et repo for konfigen til en kunde eller for standardløsninger i Neo, eller skrur på en plugin til - lager repoet som en kopi av malen i et tomt, privat repo, intervjuer, skriver repo.yaml, .claude/neo.config.json og CODEOWNERS, skrur på pluginene, legger til MCP-serveren for miljøet og ber personen logge inn. Kjør når et nytt repo skal lages fra neo-forvaltning-mal, eller når en plugin skal tas i bruk.
---

# Oppsettet av repoet

Målet er et repo der konfigen kan hentes fra Neo og planlegges mot sandkassen: sjekken av oppsettet er grønn, og
MCP-serveren for miljøet svarer med personens egen innlogging.

## 1. Opprettelsen

Hopp over dette når repoet finnes.

Repoet lages som en kopi av malens filer, ikke med «Use this template», fordi regelsettet i organisasjonen krever PR
og den første pushen ikke kan være en PR:

1. **En org-admin** lager et tomt, privat repo i organisasjonen på GitHub Enterprise (kundens, eller vår for
   standardløsninger): uten README, lisens eller `.gitignore`.
2. Kopier malens filer inn, uten historikken:

   ```bash
   git clone --depth 1 https://github.com/Neo-Systems-AI/neo-forvaltning-mal.git mal && rm -rf mal/.git
   cd mal && git init -b main && git add -A && git commit -m "Repoet fra neo-forvaltning-mal"
   git remote add origin <adressen til det nye repoet> && git push -u origin main
   ```

3. **Den første pushen gjør org-admin**, som kan gå forbi regelsettet. Alt etter den går som PR.

Den første kjøringen av `check` kan være rød på hemmelighetssjekken, fordi det ikke finnes en commit før den første.
Den neste PR-en er grønn.

## 2. Intervjuet

Spør om det som mangler, ett tema om gangen, og vis hva du har før du skriver:

1. **Repoet:** kunderepo (`type: kunde`) eller repo for standardløsninger (`type: standard`). For en kunde: navnet og
   organisasjonsnummeret.
2. **Hvem:** eieren, den som godkjenner endringer (GitHub-bruker eller -team), og den som forvalter (kunden selv,
   Neo Systems, eller en partner med egen avtale med kunden).
3. **Neo:** adressen til Neo, og org-en med sandkassen konfigen skal skrives til. Miljøet er `development`.
4. **Koblingen:** en org-admin har laget en kobling for Claude Code i Neo (*API-klienter → Koble til Claude*, slaget
   «Claude Code»). Neo viser en kommando med klient-ID-en; den er ikke en hemmelighet.
5. **Pluginene:** `config` alltid, `solution` for å bygge løsninger, `monitoring` for helsa. `data` leser saker med
   personopplysninger, så den skrus bare på når kunden vil det. Pluginen for et system (`altinn`, `entra`,
   `documaster` …) når løsningene bruker systemet.

## 3. Skriv det

- **`repo.yaml`:** `type`, eieren, godkjenneren og forvalteren, i formen repoets regel sier.
- **`.claude/neo.config.json`:** miljøet, og MCP-serveren, adressen og org-en for det. Ingen hemmeligheter:

  ```json
  {
    "version": 1,
    "neo": {
      "environments": ["development"],
      "defaultEnv": "development",
      "byEnv": { "development": { "mcpServer": "neo-development", "url": "https://<adressen>", "organisasjon": "<org-en>" } }
    }
  }
  ```

  En del per plugin bare når noe skal avvike fra standarden.
- **`.github/CODEOWNERS`:** `*` til godkjenneren, så alt i repoet, også `scripts/` og `.claude/`, krever godkjenningen.
- **`.claude/settings.json`:** `enabledPlugins` med `<plugin>@neo-forvaltning: true` for hver plugin som skal på.
- **MCP-serveren**, med kommandoen fra Neo og navnet fra config-fila:

  ```bash
  claude mcp add --scope project --transport http --client-id <klient-id> neo-development <adressen>/api/mcp
  ```

Commit på en gren og åpne en PR.

## 4. Sjekk det

1. Be personen logge inn med `/mcp` og velge serveren. Det kan ikke gjøres for hen. Start Claude Code på nytt, så
   pluginene lastes.
2. Kjør sjekken av oppsettet, og rett det den sier mangler:

   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/check-setup.mjs"
   ```

3. Kall et lese-verktøy på serveren (`export_config`), og se at svaret kommer fra org-en i config-fila. Er det en annen
   org, er koblingen laget i feil org.

## Maskinklienten

Når Neo lar en maskinklient skrive konfig, kjører arbeidsflyten i malen planen som kommentar på PR-en og skrivingen
til sandkassen ved merge. Oppsettet gjøres én gang, her: en org-admin lager klienten i Neo for repoet, hemmeligheten
legges som en hemmelighet i repoet på GitHub (aldri i en fil), og arbeidsflyten slås på. Så lenge Neo ikke lar en
maskinklient skrive, hoppes punktet over, og planen og skrivingen gjøres med personens egen innlogging.

## Regler

- **Ingen hemmeligheter i noen fil.** Innloggingen er personens egen.
- **Endre bare det som mangler.** Finnes en verdi, spør før den byttes.
