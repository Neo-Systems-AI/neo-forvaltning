---
name: gjennomfor
description: Gjennomfører en godkjent plan i Neo sin sandkasse med ett skript og maskinklienten. Skriptet lager planen på nytt, stopper om den ikke er den som ble godkjent, og skriver fil for fil; Neo skriver hver fil i én transaksjon og nekter om sandkassen er endret siden planen. Promoteringen til produksjon gjøres av kundens org-admin i Neo. Bruk bare når PR-en med planen er godkjent.
---

# Gjennomføringen

## Før du starter

- PR-en med planen er godkjent etter kundens egne rutiner (den som godkjenner, står i `kunde.yaml`), og merget. Er
  den ikke det, stopp og si det. Gjennomfør fra `main`, så filene og planen er de som ble godkjent.
- Skriptet kaller sandkassen med maskinklienten (`neo.byEnv.sandkasse.apiClient`). Produksjonen endres ikke herfra:
  endringen promoteres fra sandkassen av kundens org-admin i Neo, og den står da i revisjonsloggen.

## Slik gjør du det

1. Gjennomfør:

   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/konfig.mjs" apply
   ```

   Skriptet gjør dette, og stopper ved første avvik:
   - lager planen på nytt og sjekker den mot `<reportsDir>/plan-<miljø>.json`, den godkjente. Er den ikke den samme,
     er sandkassen eller filene endret siden godkjenningen, og ingenting skrives;
   - skriver hver fil som er ny eller endret, i rekkefølgen planen har, med hashen planen ga fila. Hashen gjelder
     sandkassen slik den er når filene før er skrevet, så en fil som peker på et objekt en annen fil lager, går;
   - skriver et oppgavemal-sett med steg som venter på en sakstype, én gang til når sakstypene er skrevet.
2. Exit 1: si hva som er skrevet (skriptet lister det) og hvorfor det stoppet:
   - **Planen er ikke den som ble godkjent:** lag planen på nytt (`/forvaltning:plan`) og få den godkjent.
   - **409:** noe er endret i sandkassen mellom planen og skrivingen. Lag planen på nytt.
   - **422:** Neo avviste fila. Grunnene står i svaret.
   - **403 `TOKEN_…`:** sandkassen er satt til begrenset tilgang for tokens (for eksempel bare utkast av flyter, ikke
     KI-oppsettet). Endringen gjøres da i Neo av en person, eller org-admin åpner tilgangen.

   Det som alt er skrevet, står: hver fil er sin egen transaksjon.
3. Snapshot av sandkassen (`/forvaltning:snapshot`). Filene som ble gjennomført, er nå like i `oppsett/` og i
   snapshotet.
4. Si til kunden at endringen ligger i sandkassen og kan promoteres, og hva som bør testes før det. Forhåndsvisningen
   av promoteringen i Neo viser om produksjonen mangler en integrasjon eller postboks en flyt er bundet til (et gap
   på flyten): den settes opp i produksjonen, med samme navn og adresse, før promoteringen.

## Det Neo gjør med hver fil

- Objektet blir slik fila sier, med en versjon før og en etter i Neo. Revisjonen viser maskinklienten; godkjenningen
  er PR-en.
- Det fila har fjernet, blir stående (planen viste det som «blir stående i Neo»).
- En flyt beholder statusen sin: en aktiv flyt er aktiv etterpå, og godkjenningen til å skrive i saker stemples på
  nytt. Med begrenset tilgang for tokens kan bare en flyt som er utkast, endres.
- En veiviser skrives som utkast og publiseres i Neo.

## Det som gjøres utenom

- Det Neo ikke skriver som fil ennå (`ikke-med.md` i snapshotet), og stegene i kravene (`blir: steg`), gjøres i Neo
  av et menneske, og snapshotet etterpå viser at det er gjort.
- Den samme kommandoen kan kjøres av en jobb i GitHub etter merge, med maskinklientens hemmelighet som secret.
