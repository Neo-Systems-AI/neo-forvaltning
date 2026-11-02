---
name: maskinporten
description: Spør Maskinporten selv - well-known for miljøet, og et token for kundens klient med scopet og utløpet som faktisk ble innvilget. Brukes i feilsøk når et kall fra Neo mot KRR, Fiks eller Altinn feiler på tilgang, for å skille «klienten får ikke scopet» fra «tjenesten avviser tokenet». Bare lesing; tokenet skrives aldri ut.
---

# Maskinporten

Det rå svaret fra Maskinporten, så det kan settes opp mot det Neo gjorde (`/helse:feilsok`). Avslår Maskinporten,
er feilen hos klienten eller scopet; får klienten scopet her, men Neo får 401 eller 403 hos tjenesten, er feilen
lenger ut.

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/maskinporten.mjs" well-known [--miljo test|produksjon]
node "${CLAUDE_PLUGIN_ROOT}/scripts/maskinporten.mjs" token [<klient>] [--miljo <miljø>] [--scope "<scope> …"] [--consumer-org <orgnr>]
```

- `well-known`: issuer og token-endepunkt for miljøet. Går uten config-fil når `--miljo` er sagt.
- `token`: henter et token for standardklienten, eller en navngitt klient (`krr`, `fiks` …), og viser hva som ble
  bedt om, hva som ble innvilget, utløpet og claimene (client_id, consumer). Et scope som ikke ble innvilget, sies.
- `--scope` prøver et annet scope enn det klienten har i config-fila; svaret (`invalid_scope` eller et token) er målingen.
- `--consumer-org` ber om et delegert token på vegne av en annen organisasjon.
- Avslaget kommer fram som Maskinporten ga det: status, `error` og `error_description`.

Klientene står i `.claude/neo.config.json` under `maskinporten.byEnv.<miljø>`; se `/maskinporten:env`. Mangler
nøkkelen, sier skriptet navnet på variabelen og hvor den ligger: et menneske henter den med
`/forvaltning:hemmeligheter`, aldri agenten.

## Reglene

- **Bare lesing.** Et token endrer ingenting. Skriv aldri tokenet ut, og les aldri `.env.local` eller `.keys/`.
- **Si alltid miljøet** svaret kom fra. Test og produksjon har ulike klienter.
- **Kunden eier klienten og nøkkelen.** Endres noe i klienten, gjør kunden det i Digdirs selvbetjening.
