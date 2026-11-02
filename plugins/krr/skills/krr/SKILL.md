---
name: krr
description: Slår opp én eller flere personer i Kontakt- og reservasjonsregisteret (KRR) og viser hva registeret selv sier - status, reservasjon, varslingsstatus, e-post og mobil. Brukes i feilsøk når Neo varslet feil kanal, ikke varslet, eller sendte til en reservert person. Bare lesing; personnummeret maskeres.
---

# KRR

Det rå svaret fra KRR, så det kan settes opp mot det Neo gjorde (`/helse:feilsok`): sa registeret `reservasjon=JA`,
`IKKE_REGISTRERT` eller `KAN_IKKE_VARSLES`, og valgte Neo kanal etter det?

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/krr.mjs" person <fødselsnummer> [<fødselsnummer> …] [--v2] [--klient <navn>] [--miljo test|produksjon]
```

- Svaret skrives ut som KRR ga det, og så én linje per person: status, reservasjon, varslingsstatus, e-post, mobil.
- **v1 er standard**: én rad per nummer, også `IKKE_REGISTRERT`. `--v2` utelater personer som ikke finnes; bruk den
  for å sammenligne med det Neo gjør, ikke for å si at noen mangler.
- **v1 sjekker ikke kontrollsifrene**: et nummer med feil kontrollsiffer gir `IKKE_REGISTRERT`, som en person som ikke
  finnes. Skriptet sier fra (`MERK: … ugyldige kontrollsifre`) og sender nummeret likevel.
- Tokenet hentes med Maskinporten-klienten `krr` (eller `krr.klient`, eller `--klient`) fra
  `maskinporten.byEnv.<miljø>.klienter`. Avslår Maskinporten, kjør `/maskinporten:maskinporten token krr`.
- Høyst 1000 personer per kall.

## Reglene

- **Bare lesing.** Oppslaget endrer ingenting i KRR.
- **Personopplysninger maskeres.** Personnummeret vises bare som de seks første sifrene og `*****`. Skriv aldri et
  helt personnummer i svaret, et notat eller en sak. E-post og mobil vises fordi det er det oppslaget er til; ikke
  kopier dem videre.
- **Si alltid miljøet.** Test har syntetiske personer; produksjon er ekte folk, og et oppslag der skal ha et formål.
