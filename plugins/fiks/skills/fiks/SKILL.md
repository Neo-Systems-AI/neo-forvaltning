---
name: fiks
description: Rå lese-kall mot KS Fiks - SvarUt (forsendelsestyper, mottakersystem, status og hendelser for en forsendelse), SvarInn (nye forsendelser til mottakersystemet) og Folkeregisteret via Fiks (en person, hendelseslisten). Bruk den i feilsøk for å se hva Fiks selv sier, satt opp mot det Neo gjorde. Bare lesing; sier alltid miljøet.
---

# KS Fiks: hva sier Fiks selv

Når Neo sier at en forsendelse er sendt, mottatt eller slått opp, er dette kallet som viser hva Fiks sier om det
samme. Brukes særlig fra `/helse:feilsok`: finn kjøringen i Neo først, ta id-en derfra (forsendelses-id,
organisasjonsnummer, fødselsnummer), og spør Fiks.

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/fiks.mjs" [--miljo <miljø>] <kommando>
```

| Kommando | Kallet | Svarer på |
|---|---|---|
| `svarut forsendelsestyper` | `GET /v2/forsendelsestyper` | Virker token og integrasjon i det hele tatt? Det ufarlige første kallet |
| `svarut mottakersystem <orgnr> [--forsendelsestype <type>]` | `GET /v2/mottakersystem` | Har mottakeren et SvarInn-mottakersystem? Tom liste: forsendelsen går til Altinn eller print |
| `svarut status <id> [<id> …]` | `POST /v3/kontoer/<konto>/forsendelser/status/sok` | Kom forsendelsen fram: `MOTTATT`, `AKSEPTERT`, `KLAR_FOR_MOTTAK`, `SENDT_ALTINN`, `LEST`, `IKKE_LEVERT` … Et søk, ingen endring |
| `svarut hendelser <id>` | `GET /v2/forsendelser/<id>/hendelser` | Hva har skjedd med forsendelsen, i rekkefølge |
| `svarinn liste` | `GET /svarinn/v2/forsendelser` | Ligger forsendelsen i SvarInn og venter på mottak? Bare de som ikke er kvittert (høyst 200) |
| `folkeregister person <fnr> [--part navn,bostedsadresse] [--rolle <id>]` | `GET /folkeregister/api/v1/<rolle>/v1/personer/<fnr>` | Hva Folkeregisteret svarer om personen. Uten `--part` kommer bare grunnsettet; et ugyldig part-navn gir en feil som lister de lovlige |
| `folkeregister hendelser [--seq <n>] [--rolle <id>]` | `GET /folkeregister/api/v1/<rolle>/v1/hendelser/feed` | Hendelseslisten fra et sekvensnummer |

Utskriften er metoden, adressen, status og tid, så svaret. Exit 1 når Fiks ikke svarer 2xx, eller når noe mangler.

## Feilsøk: Fiks mot Neo

- **Neo sier sendt, mottakeren har ikke fått det:** `svarut status <id>`, så `svarut hendelser <id>`. Står den på
  `SENDT_ALTINN` eller `IKKE_LEVERT`, se `svarut mottakersystem <orgnr>`: uten mottakersystem går den ikke til SvarInn.
- **Neo har ikke hentet en forsendelse:** `svarinn liste`. Ligger den der, har Neo ikke kvittert den; ligger den ikke
  der, er den kvittert (av Neo eller et annet system på samme mottakersystem) eller aldri kommet.
- **Et oppslag i Neo ga feil eller tomt:** `folkeregister person <fnr>` med de samme `--part` som Neo ba om.
- **401:** fra SvarUt og Folkeregisteret er det nesten alltid at organisasjonen i Maskinporten-tokenet ikke er
  integrasjonens autoriserte organisasjon, eller at integrasjonens passord er feil. Fra SvarInn: mottakersystemets
  id eller passord, eller at organisasjonen ikke er lagt til på mottakersystemet.
- Skriv hva Fiks svarte og hva Neo gjorde side om side, med miljøet og tidspunktet. Avgjør så om feilen er hos
  Fiks, i oppsettet hos kunden (avtaler, roller, mottakersystem) eller i Neo.

## Reglene

- **Bare lesing.** Ingen kall som sender, kvitterer eller endrer noe. SvarInn-kvittering er en endring og er ikke med;
  `svarut status` er et søk med POST, ikke en endring.
- **Si alltid miljøet.** Første linje i utskriften er `Miljø: <miljø>`; ta den med i svaret. Standard er
  `fiks.defaultEnv`, ellers det første i `fiks.environments`. Produksjon er ekte forsendelser og ekte personer: bruk
  den bare når kunden har bedt om det.
- **Personopplysninger:** fødselsnummer maskeres i utskriften (seks første sifre og `*****`). Navn og adresse fra
  Folkeregisteret kommer ut som de er: gjengi bare det feilsøket trenger, og skriv det aldri i en fil i repoet.
- **Hemmelighetene** sladdes fra alt som skrives ut. Mangler en, sier skriptet navnet og hvor den ligger; et menneske
  henter den (`/forvaltning:hemmeligheter`), aldri agenten.
- **Config:** mangler noe, kjør `/fiks:env`.
