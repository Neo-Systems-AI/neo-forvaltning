---
name: documaster
description: Rå lese-kall mot kundens Documaster-arkiv (Noark 5) til feilsøk - ble journalposten arkivert, i hvilken mappe, med hvilke dokumenter. Brukes sammen med /helse:feilsok for å sette det arkivet sier opp mot det Neo gjorde. Bare lesing.
---

# Documaster: hva arkivet selv sier

Last denne når en flyt i Neo skulle arkivere noe i Documaster, og du må vite om det skjedde. Neo sier hva den
sendte (`/helse:feilsok`); dette skriptet sier hva arkivet har.

```bash
D="${CLAUDE_PLUGIN_ROOT}/scripts/documaster.mjs"
node "$D" token                                   # virker klienten? Utløp og scope, aldri tokenet
node "$D" arkivdeler                              # samme kall som «Test tjenestekonto» i Neo
node "$D" mappe <id>                              # én mappe på Documaster-id
node "$D" mappe --saksnummer 2026/123             # mappe på saksnummer (mappeIdent)
node "$D" registreringer --saksnummer 2026/123    # registreringene i saken
node "$D" registreringer --mappe <id>
node "$D" journalpost <id>
node "$D" registrering <id> | --ident <registreringsIdent>
node "$D" dokumenter --registrering <id>          # dokumentversjonene: filnavn, format, størrelse
node "$D" sok --type <Noark-type> --query "felt = @p" --param @p=verdi
```

`--miljo <miljø>` velger instans (standard: `documaster.defaultEnv`, ellers det første i `documaster.environments`).
`--limit` er 10 som standard, høyst 50.

## Slik feilsøker du

1. **Hent kjøringen i Neo** (`/helse:feilsok`). Finn det Neo fikk tilbake fra Documaster: mappe-id, registrerings-id
   eller saksnummer. Fikk steget en feil, står den der.
2. **Virker klienten?** `token`. Avslag her (`invalid_client`, `401`) er innloggingen, ikke flyten: hemmeligheten er
   utløpt eller rotert, eller scopet er feil. Kunden eier klienten.
3. **Svarer API-et?** `arkivdeler`. Et HTML-svar betyr at `apiUrl` peker på nettsiden (`/v2/`) og ikke API-et;
   skriptet stopper med exit 1 da, for nettsiden svarer 200 på alle stier.
4. **Finnes det Neo sier den laget?** `mappe <id>`, `registrering <id>`, `registreringer --saksnummer …`.
   - **Funnet, og likt det Neo sendte:** arkiveringen er gjort. Feilen er et annet sted.
   - **Funnet, men annerledes** (feil mappe, tittel, klasse): sammenlign med oppsettet til flyten. Det er som regel
     oppsettet, og rettingen går gjennom `/forvaltning:plan`.
   - **Ikke funnet, og Neo fikk en id tilbake:** meld det som et produktfunn med id-en og tidspunktet.
   - **Ikke funnet, og Neo fikk ingen id:** steget feilet før arkivet. Les feilen i kjøringen.
5. **Ble dokumentene med?** `dokumenter --registrering <id>` viser versjonene uten innholdet.

## Regler

- **Bare lesing.** Spørringen er en POST, men leser. Skriptet har ingen kall som oppretter, endrer eller sletter, og
  ingen skal legges til her.
- **Svarene er arkivinnhold.** Titler og parter kan være personopplysninger. Vis det som trengs for feilsøket, og
  skriv det aldri inn i repoet.
- **Hemmeligheten er kundens.** Står den ikke i `.env.local`, sier skriptet navnet og hvor den ligger. Et menneske
  henter den med `/forvaltning:hemmeligheter`; agenten gjør det aldri.
- **Spørrespråket:** bare `felt = @param` er brukt her, det produktet bruker. Om `&&` og `||` virker, er ikke prøvd.
