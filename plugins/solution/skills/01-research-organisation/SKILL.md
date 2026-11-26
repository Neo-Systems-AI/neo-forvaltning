---
name: 01-research-organisation
description: Researcher kunden én gang, før den første løsningen - roller og tilgang, språket, partene og kanalene, systemene og porteføljen - fra kilder som lagres uendret med opphav, med en påstand per kilde og spørsmålene til kunden der kildene ikke svarer. Bruk når et nytt kunderepo er satt opp, eller når noe som gjelder hele kunden har endret seg.
---

# Research på kunden

Det som gjelder hele kunden, researches én gang og brukes av alle løsningene: hvem som jobber der og med hvilke roller,
hvordan kunden skriver, hvem kunden har med å gjøre, systemene rundt, og sakene på tvers. En løsning som bygges uten
dette, gjetter.

**Inn:** `kunde.yaml` (hvem kunden er, og hvem som godkjenner og forvalter). **Ut:** kildene i `felles/kilder/` og
forståelsen i `felles/forstaelse/`. Formen på begge står i repoets regler for mappene (`.claude/rules/`). Et repo for
standardløsninger (`type: standard` i `kunde.yaml`) har ingen kunde å forstå, og ingen `felles/kilder/` eller
`felles/forstaelse/`; da gjelder ikke denne.

## De fem dimensjonene

| Dimensjon | Hva den svarer på |
|---|---|
| Roller og tilgang | Hvem som gjør hva, hvem som godkjenner, hvem som ser hva, teamene, og inhabilitet |
| Språket | Hvordan kunden skriver: standardformuleringer, begrunnelser, tone og klarspråk, også for tekst en agent skriver |
| Partene og kanalene | Hvem kunden har med å gjøre utenfor seg selv, og kanalene inn og ut, også selvbetjening |
| Systemene | Arkivet, registrene, økonomi, identitet og e-post: det Neo skal snakke med, og det som skal oppdateres der |
| Porteføljen | Sakene på tvers: budsjettet, oversiktene, rapporteringen oppover og hvordan arbeidet fordeles |

Den samme lista brukes for hver kunde, så det som mangler, synes som en tom seksjon og ikke som et hull ingen ser.

## Slik gjør du det

1. **Finn kildene.** Det kunden har publisert (nettsidene, årsrapporten, tildelingsbrevet, instruksen,
   organisasjonskartet), offentlig journal (hvilke saker kunden har, og hvor mange), og det kunden gir oss
   (rutiner, maler, brev de har sendt). Spør kunden etter det som ikke er offentlig, i én samlet liste.
2. **Lagre hver kilde uendret,** med opphavet: lenke, utgiver, datoen dokumentet har, og datoen det ble lest. En lagret
   kilde endres aldri; en ny versjon får en ny id. Personopplysninger i en kilde lagres ikke; ta et utdrag uten dem.
   En kilde som ikke skulle vært lagret, trekkes tilbake med grunnen i registeret, og fila tas bort.
3. **Skriv forståelsen per dimensjon.** Hver påstand viser til kilden den kommer fra. Står det samme i to dimensjoner,
   står det ett sted, og den andre viser dit.
4. **Skriv det kildene ikke svarer på,** per dimensjon, som spørsmål til kunden. Ikke fyll hullet med det som er
   vanlig hos andre.
5. **Kontrollér mot kildene.** En egen agent, som ikke skrev forståelsen, leser hver påstand mot den lagrede kilden og
   lister avvikene: påstander kilden ikke sier, er tolket for langt, eller mangler kilde. Rett dem, eller legg dem fram.
6. **Kjør sjekken av repoet** (`check` i `.claude/method.json`, fra roten) til den er grønn: kildene uendret og i
   registeret, og hver påstand med en kilde som finnes.

   ```bash
   sh -c "$(node -p 'require("./.claude/method.json").check')"
   ```

## Personen avgjør

Spørsmålene til kunden: hvilke som skal stilles, i hvilken form (et møte, en liste, et dokument), og hvem som svarer.
Legg dem fram samlet per dimensjon, med hva svaret endrer i løsningene.

## Ferdig når

Hver dimensjon har forståelsen med kilder eller en tom seksjon med spørsmålene, kontrollen mot kildene har ingen åpne
avvik, og sjekken er grønn. Svarene fra kunden blir nye kilder, og forståelsen skrives om fra dem.
