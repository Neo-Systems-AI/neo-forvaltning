# fiks

Rå lese-kall mot KS Fiks: SvarUt, SvarInn og Folkeregisteret via Fiks. Til feilsøk: hva sier Fiks selv, satt opp mot
det Neo gjorde. Bare lesing. Hemmelighetene sladdes, og fødselsnummer maskeres.

| Skill | Hva |
|---|---|
| `fiks:fiks` | Kallene: SvarUt (forsendelsestyper, mottakersystem, status, hendelser), SvarInn (nye forsendelser) og Folkeregisteret (person, hendelser) |
| `fiks:env` | Config-fila slik pluginen leser den |

`scripts/fiks.mjs` er kallene, uten avhengigheter (Node 22). `scripts/fiks.test.mjs` prøver dem uten nettverk.

## Config

I `.claude/neo.config.json`, under `fiks`. Miljøene heter `test` og `produksjon`. En hemmelighet står aldri med verdi,
bare som referanse til kundens hvelv:

```json
{
  "fiks": {
    "environments": ["test", "produksjon"],
    "defaultEnv": "test",
    "byEnv": {
      "test": {
        "maskinporten": {
          "klientId": "<klient-id>",
          "kid": "<kid, valgfri>",
          "nokkel": { "$env": "FIKS_MASKINPORTEN_NOKKEL", "kilde": "azure-keyvault:<hvelv>/<navn>", "fil": true }
        },
        "integrasjon": {
          "id": "<integrasjonens id i Fiks forvaltning>",
          "passord": { "$env": "FIKS_INTEGRASJON_PASSORD", "kilde": "azure-keyvault:<hvelv>/<navn>" }
        },
        "svarut": { "kontoId": "<avsenderkontoen>" },
        "svarinn": {
          "mottakersystemId": "<mottakersystemets id>",
          "passord": { "$env": "FIKS_SVARINN_PASSORD", "kilde": "azure-keyvault:<hvelv>/<navn>" }
        },
        "folkeregister": { "rolleId": "<rollen i Fiks register>" }
      }
    }
  }
}
```

Hemmelige er Maskinporten-nøkkelen, integrasjonens passord og SvarInn-passordet. Id-ene er ikke hemmelige.

## Det kunden må ha selv

Kunden eier avtalene, tilgangene og hemmelighetene; vi eier koden.

- **Avtale med KS** om SvarUt og SvarInn, og om Fiks register for Folkeregisteret.
- **Maskinporten-klienten** med scopet `ks:fiks` (SvarUt og Folkeregisteret), og nøkkelen til den. Organisasjonen
  som eier klienten, må være integrasjonens autoriserte organisasjon i Fiks forvaltning.
- **Integrasjonen i Fiks forvaltning**, med servicepassord, tilgang til SvarUt-kontoen (avsenderkontoen) og til
  rollen i Fiks register.
- **Mottakersystemet i SvarInn** for organisasjonsnummeret, med service-passord og sertifikatet for mottak lastet opp.
  SvarInn bruker ikke Maskinporten eller integrasjonen.
- **Folkeregisteret:** Skatteetatens bruksvilkår, delegering til KS i Altinn, en rolle med hjemmel og dataminimering
  i Fiks forvaltning, og databehandleravtale med leverandøren.
